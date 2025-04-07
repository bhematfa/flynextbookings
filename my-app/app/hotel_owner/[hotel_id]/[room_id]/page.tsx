"use client";

import React, { useState, useEffect } from "react";
import { RoomType } from "@prisma/client";

const RoomDetails = ({
  params,
}: {
  params: Promise<{ hotel_id: string; room_id: string }>;
}) => {
  const [room, setRoom] = useState<RoomType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [availability, setAvailability] = useState<number | null>(null);

  const { hotel_id, room_id } = React.use(params) || {};

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("flynextToken")
      : null;

  // Fetch room details
  useEffect(() => {
    if (!hotel_id || !room_id) return;

    const fetchRoomDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/hotels/rooms/${room_id}/room_info`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          // Ensure images use forward slashes - copilot
          const images = Array.isArray(data.images)
            ? data.images.map((image: string) => image.replace(/\\/g, "/"))
            : [];
          setRoom({ ...data, images });
        }
      } catch (err) {
        console.error("Error fetching room details:", err);
        setError("Failed to fetch room details.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [hotel_id, room_id]);

  // Check room availability for the selected date range
  const checkRoomAvailability = async () => {
    if (!checkIn || !checkOut) {
      setError("Please select both check-in and check-out dates.");
      return;
    }

    try {
      const response = await fetch(
        `/api/hotels/rooms/${room_id}?startDate=${checkIn}&endDate=${checkOut}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
        }
      );
      const data = await response.json();
      setAvailability(data || 0); 
      setError(""); 
    } catch (err) {
      console.error("Error checking room availability:", err);
      setError("Failed to fetch room availability.");
    }
  };

  if (loading) return <p>Loading room details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!room) return <p>No room details found.</p>;

  return (
    <div className="max-w-4xl mx-auto py-10">
      {/* Room Information */}
      <h2 className="text-2xl font-semibold mb-4">{room.name}</h2>
      <p>Amenities: {JSON.stringify(room.amenities)}</p>
      <p>Price Per Night: ${room.pricePerNight.toString()}</p>
      <p>Available Rooms: {availability !== null ? availability : "N/A"}</p>

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

      {/* Room Images */}
      <div className="room-images mt-6">
        {Array.isArray(room.images) ? (
          room.images.map((image: any, index: React.Key | null | undefined) => (
            <img
              key={index}
              src={`/${image}`} // Ensure correct rendering with forward slashes
              alt={`Room Image ${(typeof index === "number" ? index : 0) + 1}`}
              className="w-full h-96 object-cover rounded mb-4"
            />
          ))
        ) : (
          <div className="w-full h-96 bg-gray-600 flex items-center justify-center rounded">
            <span className="text-xl text-white">No Images Available</span>
          </div>
        )}
      </div>

    </div>
  );
};

export default RoomDetails;