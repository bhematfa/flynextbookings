/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Hotel, RoomType } from "@prisma/client";
import { useSearchParams } from "next/navigation";

type HotelWithRooms = Hotel & { roomTypes: RoomType[]; images?: string[] };

const HotelDetails = ({ params }: { params: Promise<{ hotel_id: string }> }) => {
  const [hotel, setHotel] = useState<HotelWithRooms | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomAvailability, setRoomAvailability] = useState<number[]>([]);
  const [cart, setCart] = useState<RoomType[]>([]);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const checkInParam = searchParams.get("checkIn");
  const checkOutParam = searchParams.get("checkOut");

  const [originCity, setOriginCity] = useState("");
  const [formPassport, setFormPassport] = useState("");
  const [flightDate, setFlightDate] = useState(checkIn); // default to checkIn
  const [flightSuggestions, setFlightSuggestions] = useState<any[]>([]);
  const [flightError, setFlightError] = useState("");
  const [selectedFlightOption, setSelectedFlightOption] = useState<any>(null);
  const [flightSuccessMsg, setFlightSuccessMsg] = useState("");
  const [flightErrorMsg, setFlightErrorMsg] = useState("");
  //const [cityDropdown, setCityDropdown] = useState<any[]>([]);

  const hotel_id = React.use(params)?.hotel_id;
  const token = typeof window !== "undefined" ? localStorage.getItem("flynextToken") : null;

  // Fetch hotel details
  useEffect(() => {
    if (!hotel_id) return;

    const fetchHotel = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/hotels/${hotel_id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          setHotel({
            ...data,
            roomTypes: data.roomTypes || [],
            images: data.images || [],
          });
        }
      } catch (err) {
        console.error("Error fetching hotel details:", err);
        setError("Failed to fetch hotel details.");
      } finally {
        setLoading(false);
      }
    };

    fetchHotel();
  }, [hotel_id]);

  // // Load city dropdown
  // useEffect(() => {
  //   const loadCities = async () => {
  //     try {
  //       const res = await fetch("/api/flights/dropdown?q=");
  //       if (!res.ok) throw new Error("Failed to load city dropdown");
  //       const data = await res.json();
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   };
  //   loadCities();
  // }, []);

  // Check room availability for the selected date range
  const checkRoomAvailability = async () => {
    if (!checkIn || !checkOut) {
      alert("Please select both check-in and check-out dates.");
      return;
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      alert("Check-out date must be after check-in date.");
      return;
    }

    try {
      const availabilityPromises = hotel?.roomTypes?.map(async (room) => {
        const response = await fetch(
          `/api/hotels/rooms/${room.id}?startDate=${checkIn}&endDate=${checkOut}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );
        const data = await response.json();
        return data || 0;
      });

      const availabilityData = (await Promise.all(availabilityPromises || [])) as number[];
      setRoomAvailability(availabilityData);
      setError("");
      
      // Display a banner message indicating that availability has been updated
      alert("Availability updated!");
    } catch (err) {
      console.error("Error checking room availability:", err);
      setError("Failed to fetch room availability.");
    }
  };

  const handleAddToCart = async (room: RoomType, hotel: HotelWithRooms) => {
    try {
      const response = await fetch(`/api/booking/itinerary`, {
        method: bookingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hotelId: hotel.id,
          roomTypeId: room.id,
          checkIn,
          checkOut,
          ...(bookingId ? { bookingId } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add room to cart");
      }

      const cartResponse = await response.json();
      setCart((prev) => [...prev, cartResponse]);
      alert("Room added to cart successfully!");
    } catch (err) {
      console.error(err);
      alert("Error adding room to cart.");
    }
  };

  const handleFetchFlights = async () => {
    setFlightError("");
    setFlightErrorMsg("");
    setFlightSuccessMsg("");
    if (!originCity || !flightDate || !hotel?.city) {
      setFlightError("Please fill in all fields.");
      return;
    }
    try {
      const params = new URLSearchParams({
        origin: originCity,
        destination: hotel.city,
        date: flightDate,
      });
      const suggestionRes = await fetch(`/api/flights/suggestions?${params}`, { method: "GET" });
      if (!suggestionRes.ok) {
        const errorData = await suggestionRes.json();
        console.error("Error fetching flight suggestions:", errorData);
        setFlightError("No flights available. Please add Hotel Room to cart.");
      } else {
        const data = await suggestionRes.json();
        setFlightSuggestions(data.results || []);
      }
    } catch (err) {
      console.error("Error fetching flight suggestions:", err);
      setFlightError("No flights available. Please add Hotel Room to cart above.");
    }
  };

  const handleAddRoomAndFlight = async () => {
    setFlightSuccessMsg("");
    setFlightErrorMsg("");
    if (!selectedFlightOption || !formPassport.match(/^[0-9]{9}$/) || !selectedRoomTypeId || !hotel?.id) {
      setFlightErrorMsg("Please select a valid Room Type, Flight Option, and 9-digit passport.");
      return;
    }
    try {
      const flightIds = selectedFlightOption.flights.map((f: any) => f.id);
      const res = await fetch(`/api/booking/itinerary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hotelId: hotel.id,
          roomTypeId: selectedRoomTypeId,
          checkIn,
          checkOut,
          flightIds,
          passportNumber: formPassport,
        }),
      });
      if (!res.ok) {
        const errMsg = await res.json();
        setFlightErrorMsg(errMsg.error || "Failed to add to cart");
      } else {
        setFlightSuccessMsg("Room & Flight added to cart. View in My Bookings/Cart.");
      }
    } catch (err) {
      setFlightErrorMsg("Failed to add to cart: " + err);
    }
  };

  if (loading) return <p>Loading hotel details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!hotel) return <p>No hotel details found.</p>;

  return (
    <div className="max-w-4xl mx-auto py-10">
      {/* Display Error Message */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Hotel Information */}
      <h1 className="text-3xl text-black dark:text-white font-bold mb-6">{hotel.name}</h1>
      <p className="text-black dark:text-white font-bold"> City: {hotel.city}</p>
      <p className="text-black dark:text-white font-bold">Star Rating: {hotel.starRating}</p>
      <p className="text-black dark:text-white font-bold">Address: {hotel.address}</p>
      <p className="text-black dark:text-white font-bold">Location: {hotel.location}</p>

      {/* Hotel Images */}
      <div className="hotel-images mt-6">
        <h2 className="text-2xl text-black dark:text-white font-semibold">Hotel Images</h2>
        {hotel.images && hotel.images.length > 0 ? (
          hotel.images.map((image, index) => (
            <img
              key={index}
              src={`/${image}`}
              alt={`Hotel Image ${index + 1}`}
              className="w-auto h-auto object-cover rounded mb-4"
            />
          ))
        ) : (
          <div className="w-full h-96 bg-gray-600 flex items-center justify-center rounded">
            <span className="text-xl text-white">No Images Available</span>
          </div>
        )}
      </div>

      <h2 className="text-2xl text-black dark:text-white font-semibold mt-6">Room Types</h2>
      <div>
        {hotel.roomTypes.length > 0 ? (
          hotel.roomTypes.map((room, index) => (
            <div key={`${room.name}-${room.pricePerNight}`} className="room-card border rounded p-4 mb-4">
              <h3 className="text-xl text-black dark:text-white font-semibold">{room.name}</h3>
              <p className="text-black dark:text-white font-bold">Amenities: {JSON.stringify(room.amenities)}</p>
              <p className="text-black dark:text-white font-bold">Price Per Night: ${room.pricePerNight.toString()}</p>
              <p className="text-black dark:text-white font-bold">Available Rooms: {roomAvailability[index] || "N/A"}</p>
              {/* Add to Cart Button */}
              <button
                disabled={!roomAvailability[index] || !token || roomAvailability[index] === 0} // Disable if no availability
                onClick={() => handleAddToCart(room, hotel)}
                className={`bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded ${
                  (!roomAvailability[index] || !token) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Add to Cart: Make sure you're logged in and have selected the check-in and check-out dates!
              </button>
              <button
                className={`px-2 py-1 ml-2 rounded ${
                  selectedRoomTypeId === room.id ? "bg-green-500 text-white" : "border border-gray-300"
                }`}
                onClick={() => setSelectedRoomTypeId(room.id)}
              >
                {selectedRoomTypeId === room.id ? "✓ Selected" : "Select Room"}
              </button>

              {/* Room Images */}
              <div className="room-images mt-6">
                {Array.isArray(room.images) ? (
                  room.images.map((image, imgIndex) => (
                    <img
                      key={imgIndex}
                      src={`/${image}`} // Ensure correct rendering with forward slashes
                      alt={`${room.name} Image ${typeof imgIndex === "number" ? imgIndex + 1 : "Unknown"}`}
                      className="w-248 h-96 object-cover content-center rounded mb-4"
                    />
                  ))
                ) : (
                  <div className="w-full h-96 bg-gray-60 flex items-center justify-center rounded">
                    <span className="text-xl text-white">No Images Available</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No room types available for this hotel.</p>
        )}
      </div>

      {/* Date Selection and Availability Check */}
      <div className="availability-form mt-6 p-6 bg-gray-800 rounded">
        <h2 className="text-2xl text-white font-semibold mb-4">Check Room Availability</h2>
        <label htmlFor="checkIn" className="block mb-2 text-white">
          Check-In Date:
        </label>
        <input
          type="date"
          id="checkIn"
          value={checkInParam ? checkInParam : checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="w-full p-3 rounded bg-gray-700 text-white mb-4"
        />
        <label htmlFor="checkOut" className="block mb-2 text-white">
          Check-Out Date:
        </label>
        <input
          type="date"
          id="checkOut"
          value={checkOutParam ? checkOutParam : checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full p-3 rounded bg-gray-700 text-white mb-4"
        />
        <button
          onClick={checkRoomAvailability}
          className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded"
        >
          Check Availability: These are your check-in and check-out dates!
        </button>
      </div>

      {!bookingId && (
        <div className="mt-6 p-6 bg-white rounded-lg shadow-md">
          <div className="grid gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Origin City</label>
              <input
                type="text"
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                placeholder="Enter your origin city"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Passport (9 digits)</label>
              <input
                type="text"
                maxLength={9}
                value={formPassport}
                onChange={(e) => setFormPassport(e.target.value)}
                placeholder="Enter your passport number"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Flight Date</label>
              <input
                type="date"
                value={flightDate}
                onChange={(e) => setFlightDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleFetchFlights}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded mb-4"
          >
            Flight options for this trip
          </button>
          <div className="flightsuggestions mt-4">
            {flightError ? (
              <p className="text-red-500">{flightError}</p>
            ) : flightSuggestions.length === 0 ? (
              <p className="text-gray-500">No flight suggestions yet.</p>
            ) : (
              flightSuggestions.map((option, idx) => (
                <div
                  key={idx}
                  className={`p-4 border rounded mb-2 cursor-pointer ${
                    selectedFlightOption === option ? "border-green-500" : "border-gray-300"
                  }`}
                  onClick={() => setSelectedFlightOption(option)}
                >
                  {option.flights.map((flight: any) => (
                    <div key={flight.id} className="mb-1">
                      <p className="text-gray-800 font-semibold">
                        {flight.airline.name} ({flight.flightNumber})
                      </p>
                      <p className="text-gray-600">
                        {flight.origin.city} → {flight.destination.city}
                      </p>
                      <p className="text-gray-600">
                        ${flight.price} {flight.currency}
                      </p>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
          <button
            onClick={handleAddRoomAndFlight}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded mt-4"
          >
            Add Hotel Room and Flight to Cart
          </button>
          {flightSuccessMsg && <p className="text-green-500 mt-2">{flightSuccessMsg}</p>}
          {flightErrorMsg && <p className="text-red-500 mt-2">{flightErrorMsg}</p>}
        </div>
      )}
    </div>
  );
};

export default HotelDetails;