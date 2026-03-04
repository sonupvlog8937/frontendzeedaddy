import { useSearchParams } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { type FormEvent, useEffect, useState } from "react";
import type { IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import RestaurantCard from "../components/RestaurantCard";

const Home = () => {
  const {
    location,
    loadingLocation,
    requestCurrentLocation,
    setManualLocation,
  } = useAppData();
  const [searchParams] = useSearchParams();

  const search = searchParams.get("search") || "";

  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualLocation, setManualLocationInput] = useState("");

  const getDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return +(R * c).toFixed(2);
  };

  const fetchRestaurants = async () => {
    if (!location?.latitude || !location?.longitude) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/all`,
        {
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
            search,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setRestaurants(data.restaurants ?? []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [location, search]);

  const handleManualLocationSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    await setManualLocation(manualLocation);
  };

  if (!location) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Set your delivery location</h2>
          <p className="mt-2 text-sm text-gray-600">
            Choose how you want to provide your location to discover nearby restaurants.
          </p>

          <div className="mt-6 space-y-4">
            <button
              onClick={requestCurrentLocation}
              disabled={loadingLocation}
              className="w-full rounded-lg bg-[#E23744] px-4 py-3 text-sm font-medium text-white hover:bg-[#c72f3d] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingLocation ? "Detecting your location..." : "Use my current location"}
            </button>

            <div className="text-center text-xs font-medium uppercase tracking-wide text-gray-400">
              or enter location manually
            </div>

            <form onSubmit={handleManualLocationSubmit} className="space-y-3">
              <label htmlFor="manual-location" className="block text-sm font-medium text-gray-700">
                Delivery location
              </label>
              <input
                id="manual-location"
                type="text"
                value={manualLocation}
                onChange={(e) => setManualLocationInput(e.target.value)}
                placeholder="e.g. Sector 21, Noida"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#E23744]"
              />
              <button
                type="submit"
                disabled={loadingLocation || !manualLocation.trim()}
                className="w-full rounded-lg border border-[#E23744] px-4 py-2.5 text-sm font-medium text-[#E23744] hover:bg-[#fff2f4] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingLocation ? "Validating location..." : "Set manual location"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-gray-500">Finding restaurants near you...</p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {restaurants.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {restaurants.map((res) => {
            const [resLng, resLat] = res.autoLocation.coordinates;

            const distance = getDistanceKm(
              location.latitude,
              location.longitude,
              resLat,
              resLng
            );

            return (
              <RestaurantCard
                key={res._id}
                id={res._id}
                name={res.name}
                image={res.image ?? ""}
                distance={`${distance}`}
                isOpen={res.isOpen}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-center text-gray-500">No restaurant found</p>
      )}
    </div>
  );
};

export default Home;
