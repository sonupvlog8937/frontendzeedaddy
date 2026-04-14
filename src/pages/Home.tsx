import { useSearchParams } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useEffect, useState, useCallback, useRef } from "react";
import type { IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import RestaurantCard from "../components/RestaurantCard";

// ─── Types ───────────────────────────────────────────────────────────────────

type SortOption = "relevance" | "rating" | "distance" | "delivery_time";
type FilterOption = "all" | "pure_veg" | "offers" | "open_now" | "rating_4plus";

interface FilterChip {
  id: FilterOption;
  label: string;
  icon: string;
}

interface SortChip {
  id: SortOption;
  label: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTER_CHIPS: FilterChip[] = [
  { id: "all", label: "All", icon: "🍽️" },
  { id: "open_now", label: "Open Now", icon: "🟢" },
  { id: "rating_4plus", label: "Rating 4.0+", icon: "⭐" },
  { id: "pure_veg", label: "Pure Veg", icon: "🥦" },
  { id: "offers", label: "Offers", icon: "🏷️" },
];

const SORT_CHIPS: SortChip[] = [
  { id: "relevance", label: "Relevance" },
  { id: "rating", label: "Top Rated" },
  { id: "distance", label: "Nearest" },
  { id: "delivery_time", label: "Fast Delivery" },
];

// ─── Haversine ────────────────────────────────────────────────────────────────

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
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100">
    <div className="h-40 bg-gray-200" />
    <div className="p-3 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="flex gap-2 pt-1">
        <div className="h-3 bg-gray-100 rounded w-10" />
        <div className="h-3 bg-gray-100 rounded w-10" />
      </div>
    </div>
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ search }: { search: string }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <span className="text-6xl mb-4">🍽️</span>
    <h3 className="text-xl font-semibold text-gray-700 mb-1">
      {search ? `No results for "${search}"` : "No restaurants found"}
    </h3>
    <p className="text-sm text-gray-400 max-w-xs">
      {search
        ? "Try a different search term or adjust your filters."
        : "We couldn't find any restaurants near your location right now."}
    </p>
  </div>
);

// ─── Location Loader ──────────────────────────────────────────────────────────

const LocationLoader = () => (
  <div className="flex flex-col h-[60vh] items-center justify-center gap-3">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-4 border-orange-200" />
      <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
    </div>
    <p className="text-gray-500 text-sm font-medium">
      Finding restaurants near you…
    </p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Home = () => {
  const { location } = useAppData();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";

  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [activeSort, setActiveSort] = useState<SortOption>("relevance");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Close sort menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchRestaurants = useCallback(async () => {
    if (!location?.latitude || !location?.longitude) return;

    try {
      setLoading(true);
      setError(null);

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
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [location, search]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // ── Enrich with distance ─────────────────────────────────────────────────────

  const enriched = restaurants.map((res) => {
    const [resLng, resLat] = res.autoLocation.coordinates;
    const distance = location
      ? getDistanceKm(location.latitude, location.longitude, resLat, resLng)
      : 0;
    return { ...res, distance };
  });

  // ── Filter ───────────────────────────────────────────────────────────────────

  const filtered = enriched.filter((res) => {
    if (activeFilter === "open_now") return res.isOpen;
    // if (activeFilter === "rating_4plus") return (res.rating ?? 0) >= 4;
    // if (activeFilter === "pure_veg") return res.isVeg === true;
    // if (activeFilter === "offers") return (res.offers?.length ?? 0) > 0;
    return true;
  });

  // ── Sort ─────────────────────────────────────────────────────────────────────

  // const sorted = [...filtered].sort((a, b) => {
  //   if (activeSort === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
  //   if (activeSort === "distance") return a.distance - b.distance;
  //   if (activeSort === "delivery_time")
  //     return (a.deliveryTime ?? 99) - (b.deliveryTime ?? 99);
  //   return 0;
  // });

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (!location) return <LocationLoader />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero / Header Banner ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3">
          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                  activeFilter === chip.id
                    ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200"
                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500"
                }`}
              >
                <span className="text-base leading-none">{chip.icon}</span>
                {chip.label}
              </button>
            ))}

            {/* Divider */}
            <div className="flex-shrink-0 w-px h-6 bg-gray-200 mx-1" />

            {/* Sort dropdown */}
            <div className="flex-shrink-0 relative" ref={sortMenuRef}>
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                  activeSort !== "relevance"
                    ? "bg-orange-50 text-orange-600 border-orange-300"
                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M6 12h12M9 17h6" />
                </svg>
                Sort
                {activeSort !== "relevance" && (
                  <span className="text-xs bg-orange-500 text-white rounded-full px-1.5">1</span>
                )}
              </button>

              {showSortMenu && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-30 min-w-[160px]">
                  {SORT_CHIPS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setActiveSort(s.id);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        activeSort === s.id
                          ? "bg-orange-50 text-orange-600 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {activeSort === s.id && (
                        <span className="mr-2 text-orange-500">✓</span>
                      )}
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-7xl px-4 py-6">

        {/* Result count */}
        {!loading && !error && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">
              {search ? (
                <>Results for <span className="text-orange-500">"{search}"</span></>
              ) : (
                "Restaurants near you"
              )}
            </h2>
            {/* <span className="text-sm text-gray-400">
              {sorted.length} place{sorted.length !== 1 ? "s" : ""}
            </span> */}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-4xl">⚠️</span>
            <p className="text-gray-600 font-medium">{error}</p>
            <button
              onClick={fetchRestaurants}
              className="mt-2 px-5 py-2 bg-orange-500 text-white rounded-full text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Skeleton Grid */}
        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Restaurant Grid */}
        {/* {!loading && !error && (
          <>
            {sorted.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {sorted.map((res) => (
                  <RestaurantCard
                    key={res._id}
                    id={res._id}
                    name={res.name}
                    image={res.image ?? ""}
                    distance={`${res.distance}`}
                    isOpen={res.isOpen}
                    rating={res.rating}
                    deliveryTime={res.deliveryTime}
                    cuisine={res.cuisine}
                    offers={res.offers}
                    isVeg={res.isVeg}
                  />
                ))}
              </div>
            ) : (
              <EmptyState search={search} />
            )}
          </>
        )} */}
      </div>

      {/* ── Scrollbar hide style ── */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Home;