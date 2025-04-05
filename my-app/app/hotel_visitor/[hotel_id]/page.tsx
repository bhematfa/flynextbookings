"use client";

import React, { useState, useEffect } from "react";
import { Hotel, RoomType } from "@prisma/client";

// Define the types for better clarity
type HotelWithRooms = Hotel & { roomTypes: RoomType[]; images?: string[] };

const HotelDetails = ({ params }: { params: Promise<{ hotel_id: string }> }) => {
  const [hotel, setHotel] = useState<HotelWithRooms | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomAvailability, setRoomAvailability] = useState<number[]>([]);

  // Safely unwrap the `params` Promise to get the hotel ID
  const hotel_id = React.use(params)?.hotel_id;

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
            roomTypes: data.roomTypes || [], // Fallback to an empty array if roomTypes is missing
            images: data.images || [], // Fallback to an empty array if images are missing
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

  // Check room availability for the selected date range
  const checkRoomAvailability = async () => {
    if (!checkIn || !checkOut) {
      setError("Please select both check-in and check-out dates.");
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
    } catch (err) {
      console.error("Error checking room availability:", err);
      setError("Failed to fetch room availability.");
    }
  };

  if (loading) return <p>Loading hotel details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!hotel) return <p>No hotel details found.</p>;

  return (
    <div className="max-w-4xl mx-auto py-10">
      {/* Hotel Information */}
      <h1 className="text-3xl font-bold mb-6">{hotel.name}</h1>
      <p>City: {hotel.city}</p>
      <p>Star Rating: {hotel.starRating}</p>
      <p>Address: {hotel.address}</p>
      <p>Location: {hotel.location}</p>

      {/* Hotel Images */}
      <div className="hotel-images mt-6">
        <h2 className="text-2xl font-semibold">Hotel Images</h2>
        {hotel.images && hotel.images.length > 0 ? (
          hotel.images.map((image, index) => (
            <img
              key={index}
              src={`/${image}`} // Ensure correct rendering with forward slashes
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

      <h2 className="text-2xl font-semibold mt-6">Room Types</h2>
      <div>
        {hotel.roomTypes.length > 0 ? (
          hotel.roomTypes.map((room, index) => (
            <div key={`${room.name}-${room.pricePerNight}`} className="room-card border rounded p-4 mb-4">
              <h3 className="text-xl font-semibold">{room.name}</h3>
              <p>Amenities: {JSON.stringify(room.amenities)}</p>
              <p>Price Per Night: ${room.pricePerNight.toString()}</p>
              <p>Available Rooms: {roomAvailability[index] || "N/A"}</p>
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
        <h2 className="text-2xl font-semibold mb-4">Check Room Availability</h2>
        <label htmlFor="checkIn" className="block mb-2 text-white">
          Check-In Date:
        </label>
        <input
          type="date"
          id="checkIn"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="w-full p-3 rounded bg-gray-700 text-white mb-4"
        />
        <label htmlFor="checkOut" className="block mb-2 text-white">
          Check-Out Date:
        </label>
        <input
          type="date"
          id="checkOut"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full p-3 rounded bg-gray-700 text-white mb-4"
        />
        <button
          onClick={checkRoomAvailability}
          className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded"
        >
          Check Availability
        </button>
      </div>
    </div>
  );
};

export default HotelDetails;