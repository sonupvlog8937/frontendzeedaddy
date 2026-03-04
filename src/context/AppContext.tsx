import axios from "axios";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authService, restaurantService } from "../main";
import type { AppContextType, ICart, LocationData, User } from "../types";
import { Toaster } from "react-hot-toast";

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const [location, setLocation] = useState<LocationData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
 const [locationPermissionAsked, setLocationPermissionAsked] =
    useState(false);
  const [city, setCity] = useState("Select Location");


  async function fetchUser() {
    try {
      const token = localStorage.getItem("token");

       if (!token) {
        return;
      }

      const { data } = await axios.get(`${authService}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(data);
      setIsAuth(true);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const requestCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setCity("Location unavailable");
      return;
    }

    setLocationPermissionAsked(true);
    setLoadingLocation(true);

    const resolveAddress = async (latitude: number, longitude: number) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await res.json();

        const formattedAddress = data.display_name || "Current Location";

        setLocation({
          latitude,
          longitude,
          formattedAddress,
        });

        setCity(
          data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            "Your Location"
        );
      } catch (error) {
        setLocation({
          latitude,
          longitude,
          formattedAddress: "Current Location",
        });
        setCity("Current Location");
      } finally {
        setLoadingLocation(false);
      }
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolveAddress(latitude, longitude);
      },
      () => {
        setLoadingLocation(false);
        setCity("Permission denied");
      }
    );
  };

  const setManualLocation = async (manualAddress: string) => {
    const trimmedAddress = manualAddress.trim();

    if (!trimmedAddress) {
      return;
    }

    setLoadingLocation(true);
    setLocationPermissionAsked(true);

    try {
      const searchAddress = encodeURIComponent(trimmedAddress);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${searchAddress}&limit=1`
      );
      const results = await response.json();

      if (results?.length) {
        const firstMatch = results[0];
        const latitude = Number(firstMatch.lat);
        const longitude = Number(firstMatch.lon);

        setLocation({
          latitude,
          longitude,
          formattedAddress: firstMatch.display_name || trimmedAddress,
        });

        const citySegment =
          firstMatch.address?.city ||
          firstMatch.address?.town ||
          firstMatch.address?.village ||
          trimmedAddress;
        setCity(citySegment);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingLocation(false);
    }
  };


  const [cart, setCart] = useState<ICart[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [quauntity, setQuauntity] = useState(0);

  async function fetchCart() {
    if (!user || user.role !== "customer") return;
    try {
      const { data } = await axios.get(`${restaurantService}/api/cart/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setCart(data.cart || []);
      setSubTotal(data.subtotal || 0);
      setQuauntity(data.cartLength);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user && user.role === "customer") {
      fetchCart();
    }
  }, [user]);

  useEffect(() => {
    if (isAuth && user?.role === "customer" && !locationPermissionAsked && !location) {
      requestCurrentLocation();
    }
  }, [isAuth, user, locationPermissionAsked, location]);

  return (
    <AppContext.Provider
      value={{
        isAuth,
        loading,
        setIsAuth,
        setLoading,
        setUser,
        user,
        location,
        loadingLocation,
        city,
        locationPermissionAsked,
        requestCurrentLocation,
        setManualLocation,
        cart,
        fetchCart,
        quauntity,
        subTotal,
      }}
    >
      {children}

      <Toaster />
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used within AppProvider");
  }
  return context;
};
