import { useEffect, useMemo, useState } from "react";
import { useAppData } from "../context/AppContext";
import axios from "axios";
import { restaurantService, utilsService } from "../main";
import { useNavigate } from "react-router-dom";
import type { ICart, IMenuItem, IRestaurant } from "../types";
import toast from "react-hot-toast";
import { BiCreditCard, BiLoader, BiMoney } from "react-icons/bi";
import { loadStripe } from "@stripe/stripe-js";

interface Address {
  _id: string;
  formattedAddress: string;
  mobile: number;
}

type PaymentMethod = "razorpay" | "stripe" | "cod";

const Checkout = () => {
  const { cart, subTotal, quauntity, fetchCart } = useAppData();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setselectedAddressId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("cod");

  const [loadingAddress, setLoadingAddress] = useState(true);
  const [loadingCod, setLoadingCod] = useState(false);
  const [loadingRazorpay, setLoadingRazorpay] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!cart || cart.length === 0) {
        setLoadingAddress(false);
        return;
      }

      try {
        const { data } = await axios.get(
          `${restaurantService}/api/address/all`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        setAddresses(data || []);
      } catch (error) {
        console.log(error);
      } finally {
        setLoadingAddress(false);
      }
    };

    fetchAddresses();
  }, [cart]);

  const navigate = useNavigate();

  if (!cart || cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] item-center justify-center">
        <p className="text-gray-500 text-lg">Your cart is empty</p>
      </div>
    );
  }

  const restaurant = cart[0].restaurantId as IRestaurant;
  const deliveryFee = subTotal < 250 ? 0 : 0;
  const platformFee = 0;
  const grandTotal = subTotal + deliveryFee + platformFee;

  const createOrder = async (paymentMethod: PaymentMethod) => {
    if (!selectedAddressId) return null;

    setCreatingOrder(true);
    try {
      const { data } = await axios.post(
        `${restaurantService}/api/order/new`,
        {
          paymentMethod,
          addressId: selectedAddressId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      return data;
    } catch (error) {
      toast.error("Failed to create Order");
    } finally {
      setCreatingOrder(false);
    }
  };

  const payWithRazorpay = async () => {
    try {
      setLoadingRazorpay(true);

      const order = await createOrder("razorpay");
      if (!order) return;

      const { orderId, amount } = order;

      const { data } = await axios.post(`${utilsService}/api/payment/create`, {
        orderId,
      });

      const { razorpayOrderId, key } = data;

      const options = {
        key,
        amount: amount * 100,
        currency: "INR",
        name: "Tomato", 
        description: "Food Order Payment",
        order_id: razorpayOrderId,

        handler: async (response: any) => {
          try {
            await axios.post(`${utilsService}/api/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });

            toast.success("Payment successfull 🎉");
            await fetchCart(); // Cart clear hone ke liye update
            navigate("/paymentsuccess/" + response.razorpay_payment_id);
          } catch (error) {
            toast.error("Payment verification failed");
          }
        },
        theme: {
          color: "#E23744",
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.log(error);
      toast.error("Payment Failed please refresh page");
    } finally {
      setLoadingRazorpay(false);
    }
  };

  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

  const payWithStripe = async () => {
    try {
      setLoadingStripe(true);
      const order = await createOrder("stripe");
      if (!order) return;

      const { orderId } = order;

      try {
        await stripePromise;

        const { data } = await axios.post(
          `${utilsService}/api/payment/stripe/create`,
          {
            orderId,
          },
        );

        if (data.url) {
          window.location.href = data.url;
        } else {
          toast.error("failed to create payment session");
        }
      } catch (error) {
        toast.error("Payment Failed");
      }
    } catch (error) {
      console.log(error);
      toast.error("Payment failed");
    } finally {
      setLoadingStripe(false);
    }
  };

  // ✅ Consolidated Cash On Delivery Logic
  const placeCodOrder = async () => {
    try {
      setLoadingCod(true);

      const order = await createOrder("cod");
      if (!order) return;

      toast.success("Order placed with Cash on Delivery 🎉");
      await fetchCart(); // Clear/Update cart after successful order
      navigate(order.orderId ? `/order/${order.orderId}` : "/orders");
    } catch (error) {
      console.log(error);
      toast.error("Failed to place cash on delivery order");
    } finally {
      setLoadingCod(false);
    }
  };

  const paymentMethods = useMemo(
    () => [
      {
        key: "razorpay" as PaymentMethod,
        label: "Razorpay",
        cta: "Pay with Razorpay",
        className: "bg-[#2D7FF9] hover:bg-blue-500",
      },
      {
        key: "stripe" as PaymentMethod,
        label: "Stripe",
        cta: "Pay with Stripe",
        className: "bg-black hover:bg-gray-800",
      },
      {
        key: "cod" as PaymentMethod,
        label: "Cash on Delivery",
        cta: "Place COD Order",
        className: "bg-[#e23744] hover:bg-red-600",
      },
    ],
    []
  );

  const isAnyPaymentLoading = loadingRazorpay || loadingStripe || loadingCod || creatingOrder;

  // ✅ Dynamic Method Handler for Single Button
  const placeOrderByMethod = async () => {
    if (selectedPaymentMethod === "razorpay") {
      await payWithRazorpay();
      return;
    }

    if (selectedPaymentMethod === "stripe") {
      await payWithStripe();
      return;
    }

    await placeCodOrder(); // Defaults to COD
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">{restaurant.name}</h2>
        <p className="text-sm text-gray-500">
          {restaurant.autoLocation?.formattedAddress}
        </p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
        <h3 className="font-semibold">Delivery Address</h3>

        {loadingAddress ? (
          <p className="text-sm text-gray-500">Loading addresses...</p>
        ) : addresses.length === 0 ? (
          <p className="text-sm text-gray-500">
            No address found. Please add one
          </p>
        ) : (
          addresses.map((add) => (
            <label
              key={add._id}
              className={`flex gap-3 rounded-lg border p-3 cursor-pointer transition ${
                selectedAddressId === add._id
                  ? "border-[#e23744] bg-red-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                checked={selectedAddressId === add._id}
                onChange={() => setselectedAddressId(add._id)}
              />
              <div>
                <p className="text-sm font-medium">{add.formattedAddress}</p>
                <p className="text-xs text-gray-500">{add.mobile}</p>
              </div>
            </label>
          ))
        )}
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-4">
        <h3 className="font-semibold">Order Summary</h3>

        {cart.map((cartItem: ICart) => {
          const item = cartItem.itemId as IMenuItem;

          return (
            <div className="flex justify-between text-sm" key={cartItem._id}>
              <span>
                {item.name} x {cartItem.quauntity}
              </span>
              <span>₹{item.price * cartItem.quauntity}</span>
            </div>
          );
        })}

        <hr />

        <div className="flex justify-between text-sm">
          <span>Items ({quauntity})</span>
          <span>₹{subTotal}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Delivery Fee</span>
          <span>{deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>PlatForm Fee</span>
          <span>₹{platformFee}</span>
        </div>

        {subTotal < 250 && (
          <p className="text-xs text-gray-500">
            Add Item worth ₹{250 - subTotal} more to get Free delivery
          </p>
        )}

        <div className="flex justify-between text-base font-semibold border-t pt-2">
          <span>Grand Total</span>
          <span>₹{grandTotal}</span>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
        <h3 className="font-semibold">Payment Method</h3>

        {paymentMethods.map((method) => (
          <label
            key={method.key}
            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition ${
              selectedPaymentMethod === method.key
                ? "border-[#e23744] bg-red-50"
                : "hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="payment-method"
              checked={selectedPaymentMethod === method.key}
              onChange={() => setSelectedPaymentMethod(method.key)}
            />
            {method.key === "cod" ? <BiMoney size={18} /> : <BiCreditCard size={18} />}
            <span className="text-sm font-medium">{method.label}</span>
          </label>
        ))}

        {/* ✅ Single Dynamic Submit Button */}
        <button
          disabled={!selectedAddressId || isAnyPaymentLoading}
          onClick={placeOrderByMethod}
          className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 mt-4 text-sm font-semibold text-white disabled:opacity-50 transition-colors ${
            paymentMethods.find((m) => m.key === selectedPaymentMethod)?.className
          }`}
        >
          {isAnyPaymentLoading ? (
            <BiLoader size={18} className="animate-spin" />
          ) : selectedPaymentMethod === "cod" ? (
            <BiMoney size={18} />
          ) : (
            <BiCreditCard size={18} />
          )}
          {paymentMethods.find((m) => m.key === selectedPaymentMethod)?.cta}
        </button>
      </div>
    </div>
  );
};

export default Checkout;