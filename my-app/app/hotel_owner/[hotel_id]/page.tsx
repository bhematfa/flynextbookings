"use client";
import React, { useEffect, useState } from "react";
import { RoomType } from "@prisma/client";
import Link from "next/link";

const ManageRoomTypes = ({ params }: { params: Promise<{ hotel_id: string }> }) => {

  const [hotelId, setHotelId] = useState<string | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    amenities: "",
    pricePerNight: "",
    totalRooms: "",
  });
  const [images, setImages] = useState<File[]>([]); // Store uploaded image files
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("flynextToken") : null;

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const resolvedParams = await params; 
        const id = resolvedParams.hotel_id; 
        setHotelId(id); 

        const response = await fetch(`/api/hotels/${id}/rooms`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || "Failed to fetch room types.");
        } else {
          setRoomTypes(data.roomTypes);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch room types.");
      }
    };

    fetchRoomTypes();
  }, [params]); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files)); // Convert FileList to an array of File objects
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string); // Base64 string
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {

      //image logic - copilot
      const base64Images = await Promise.all(images.map((file) => fileToBase64(file))); // Convert images to base64

      const payload = {
        name: formData.name,
        amenities: formData.amenities.split(","),
        pricePerNight: parseFloat(formData.pricePerNight),
        images: base64Images, // Array of base64 strings
        totalRooms: parseInt(formData.totalRooms),
      };

      const response = await fetch(`/api/hotels/${hotelId}/rooms`, {
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : "", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to create room type.");
      } else {
        setSuccessMessage("Room type created successfully!");
        setRoomTypes((prev) => [...prev, data.room]);
        setFormData({
          name: "",
          amenities: "",
          pricePerNight: "",
          totalRooms: "",
        });
        setImages([]); 
      }
    } catch (err) {
      console.error("Error creating room type:", err);
      setError("Failed to create room type.");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 text-white">
      <Link
        href={`/hotel_visitor/${hotelId}`}
        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded mb-4 mt-4"
      >
        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded">
            View Hotel and All Room Type Details
          </button>
      </Link>

      <Link
        href={`/hotel_owner/${hotelId}/bookings`}
        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded mb-4 mt-4"
      >
        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded">
            View Bookings
          </button>
      </Link>


      <h1 className="text-3xl font-bold mb-6 text-center">Manage Room Types</h1>
      {error && <p className="text-red-500">{error}</p>}
      {successMessage && <p className="text-green-500">{successMessage}</p>}

      {/* Form Section */}
      <form onSubmit={handleCreateRoom} className="bg-gray-800 p-6 -lg space-y-6 w-full max-w-md">
        <label htmlFor="name" className="block text-white">Room Name </label>
        <input
          id="name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-3 rounded bg-gray-700 text-white"
          placeholder="E.g., Twin, Double"
          required
        />

        <label htmlFor="amenities" className="block text-white">Amenities</label>
        <textarea
          id="amenities"
          name="amenities"
          value={formData.amenities}
          onChange={handleChange}
          className="w-full p-3 rounded bg-gray-700 text-white"
          placeholder="Comma-separated amenities"
          required
        />

        <label htmlFor="pricePerNight" className="block text-white">Price Per Night</label>
        <input
          id="pricePerNight"
          type="number"
          name="pricePerNight"
          value={formData.pricePerNight}
          onChange={handleChange}
          className="w-full p-3 rounded bg-gray-700 text-white"
          placeholder="E.g., 100"
          required
        />

        <label htmlFor="totalRooms" className="block text-white">Total Rooms</label>
        <input
          id="totalRooms"
          type="number"
          name="totalRooms"
          value={formData.totalRooms}
          onChange={handleChange}
          className="w-full p-3 rounded bg-gray-700 text-white"
          placeholder="E.g., 10"
          required
        />

        <label htmlFor="images" className="block text-white">Upload Images</label>
        <input
          id="images"
          type="file"
          name="images"
          multiple
          onChange={handleImageChange}
          className="w-full p-3 rounded bg-gray-700 text-white"
          required
        />

        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded">
          Create Room Type
        </button>
      </form>

      {/* Room List Section */}
      <div className="overflow-y-auto max-h-64 bg-gray-800 p-4 space-y-4 w-full max-w-md">
        {roomTypes.map((room) => (
          <Link
            key={room.id}
            href={`/hotel_owner/${hotelId}/${room.id}`}
            className="border rounded p-4 flex items-center space-x-4 hover:bg-gray-700"
          >
            <div key={room.id} className="bg-gray-700 p-4 rounded space-y-2">
              <h2 className="text-lg font-bold text-white">{room.name}</h2>
              <p className="text-white"><strong>Amenities:</strong> {Array.isArray(room.amenities) ? room.amenities.join(", ") : "No amenities listed"}</p>
              <p className="text-white"><strong>Price Per Night:</strong> ${room.pricePerNight.toString()}</p>
              <p className="text-white"><strong>Total Rooms:</strong> {room.totalRooms}</p>

            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ManageRoomTypes;