"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Hotel, RoomType } from "@prisma/client";
import "leaflet/dist/leaflet.css";

//Leaflet logic - copilot
// Dynamically import react-leaflet components
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

// Fix for Leaflet marker icons not showing
import L from "leaflet";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Hotel Type with Location
type HotelWithRooms = Hotel & { roomTypes: RoomType[]; location?: { latitude: number; longitude: number } };

const HotelSearch = () => {
  const [searchParams, setSearchParams] = useState({
    checkIn: "",
    checkOut: "",
    city: "",
    name: "",
    starRating: "",
    priceRange: "",
  });

  const [hotels, setHotels] = useState<HotelWithRooms[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  // Fetch hotels and include coordinates based on their address
  const fetchHotels = async () => {
    if (typeof window === "undefined") return; // Ensure `window` is available
    setLoading(true);
    setError("");
    const queryString = new URLSearchParams(searchParams as any).toString();
    try {
      const response = await fetch(`/api/hotels?${queryString}`);
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        // Fetch coordinates for each hotel and update the list
        const hotelsWithCoordinates = await Promise.all(
          data.availableHotels.map(async (hotel: HotelWithRooms) => {
            const coordinates = await getCoordinates(hotel.address);
            return { ...hotel, location: coordinates };
          })
        );
        setHotels(hotelsWithCoordinates);
      }
    } catch (err) {
      console.error("Error fetching hotels:", err);
      setError("Failed to fetch hotels.");
    } finally {
      setLoading(false);
    }
  };

  // Geocoding function to fetch coordinates using Nominatim
  async function getCoordinates(address: string) {
    if (typeof window === "undefined") return null; // Ensure `window` is available
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch coordinates from Nominatim API");
      }
      const data = await response.json();
      if (data.length > 0) {
        const { lat, lon } = data[0]; // Extract latitude and longitude
        return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
      } else {
        throw new Error("No coordinates found for the given address");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error fetching coordinates:", error.message);
      } else {
        console.error("Error fetching coordinates:", error);
      }
      return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white  bg-white dark:bg-gray-800">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-10" >
        <h2 className="text-3xl text-center text-black dark:text-white font-bold mb-4 ">Search for Hotels</h2>
        <form className="bg-gray-800 p-6 rounded-lg space-y-6">
          <input
            type="text"
            name="city"
            placeholder="City"
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-700 text-white"
          />
          <input
            type="date"
            name="checkIn"
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-700 text-white"
          />
          <input
            type="date"
            name="checkOut"
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-700 text-white"
          />
          <input
            type="text"
            name="name"
            placeholder="Hotel Name"
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-700 text-white"
          />
          <input
            type="number"
            name="starRating"
            placeholder="Star Rating"
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-700 text-white"
          />
          <input
            type="text"
            name="priceRange"
            placeholder="Price Range (e.g., 50-300)"
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-700 text-white"
          />
          <button
            type="button"
            onClick={fetchHotels}
            className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded"
          >
            Search
          </button>
        </form>

        {loading && <p className="mt-4">Loading hotels...</p>}
        {error && <p className="text-red-500 mt-4">{error}</p>}

        {/* Display Map with Hotel Pinpoints */}
        <div className="mt-10">
          <h3 className="text-2xl font-bold text-black dark:text-white mb-4">Hotel Map</h3>
          <MapContainer
            center={
              hotels.length > 0
                ? [hotels[0].location.latitude, hotels[0].location.longitude]
                : [0, 0] // Dynamically set the default center
            }
            zoom={hotels.length > 0 ? 12 : 2} // Adjust zoom level based on hotel data
            className="w-full h-96"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {hotels.map(
              (hotel, index) =>
                hotel.location && (
                  <Marker
                    key={index}
                    position={[hotel.location.latitude, hotel.location.longitude]}
                  >
                    <Popup>
                      <h3>{hotel.name}</h3>
                      <p>{hotel.address}</p>
                      <p>City: {hotel.city}</p>
                    </Popup>
                  </Marker>
                )
            )}
          </MapContainer>
        </div>

        {/* Hotel Results */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {hotels.map((hotel, index) => (
            <div key={index} className="bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold">{hotel.name}</h3>
              <p>City: {hotel.city}</p>
              <p>Star Rating: {hotel.starRating}</p>
              <p>
                Starting Price: $
                {hotel.roomTypes.length > 0
                  ? hotel.roomTypes[0].pricePerNight.toString()
                  : "Not Available"}
              </p>
              <Link href={`/hotel_visitor/${hotel.id}`}>
                <button className="mt-4 bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded">
                  View Hotel Details
                </button>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default dynamic(() => Promise.resolve(HotelSearch), { ssr: false }); // Disable SSR for the component