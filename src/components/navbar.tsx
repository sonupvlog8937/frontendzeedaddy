import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useEffect, useState } from "react";
import { CgShoppingCart } from "react-icons/cg";
import { BiMapPin, BiSearch } from "react-icons/bi";

const Navbar = () => {
  const { isAuth, city, quauntity, setLocation } = useAppData();
  const currLocation = useLocation();

  const isHomePage = currLocation.pathname === "/";

  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [manualLocation, setManualLocation] = useState("");

  const updateManualLocation = async () => {
    if (!manualLocation.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          manualLocation
        )}&limit=1`
      );
      const data = await res.json();
      if (!data?.[0]) return;
      setLocation({
        latitude: Number(data[0].lat),
        longitude: Number(data[0].lon),
        formattedAddress: data[0].display_name,
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) {
        setSearchParams({ search });
      } else {
        setSearchParams({});
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);
  return (
    <div className="w-full bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link
          to={"/"}
          className="text-2xl font-bold text-[#E23744] cursor-pointer"
        >
          Tomato
        </Link>

        <div className="flex items-center gap-4">
          <Link to={"/cart"} className="relative">
            <CgShoppingCart className="h-6 w-6 text-[#E23744]" />
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#E23744] text-xs font-semibold text-white">
              {quauntity}
            </span>
          </Link>

          {isAuth ? (
            <Link to="/account" className="font-medium text-[#E23744]">
              Account
            </Link>
          ) : (
            <Link to="/Login" className="font-medium text-[#E23744]">
              Login
            </Link>
          )}
        </div>
      </div>

      {/* search bar */}
      {isHomePage && (
        <div className="border-t px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center rounded-lg border shadow-sm">
           <div className="flex items-center gap-2 px-3 border-r text-gray-700">
            <BiMapPin className="h-4 w-4 text-[#E23744]" />
            <span className="text-sm truncate max-w-35">{city}</span>
          </div>
          <input
            type="text"
            placeholder="Set location manually"
            value={manualLocation}
            onChange={(e) => setManualLocation(e.target.value)}
            onBlur={updateManualLocation}
            onKeyDown={(e) => e.key === "Enter" && updateManualLocation()}
            className="w-44 border-r px-2 py-2 text-xs outline-none"
          />
            <div className="flex flex-1 items-center gap-2 px-3">
              <BiSearch className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for restaurant"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full py-2 text-sm outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
