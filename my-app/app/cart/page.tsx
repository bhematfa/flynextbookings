"use client";
/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface FlightBooking {
  id: string;
  reference: string;
  status: string;
  price: number;
  flightId: string;
}

interface HotelBooking {
  id: string;
  status: string;
  totalPrice: number;
  checkIn?: string;
  checkOut?: string;
  roomTypeId?: string;
}

interface Booking {
  id: string;
  status: string;
  totalPrice: number | null;
}
interface RoomTypeDetails {
    roomTypeName: string;
    roomTypePrice: number;
    roomTypeAmenities: Record<string, unknown>;
  }
  
  interface HotelDetails {
    hotelName: string;
    hotelAddress: string;
    hotelStarRating: number;
    hotelLogo?: string;
    address: string;
    city: string;
    location?: string;
  }
  
  interface Flight{
    flightNumber: string;
    airline: string;
    departureCity: string;
    departureAirport: string;
    departureCode: string;
    departureCountry: string;
    departureTime: string;
    destinationCity: string;
    destinationAirport: string;
    destinationCountry: string;
    destinationCode: string;
    arrivalTime: string;
    duration: number;
    price: number;
    currency: string;
    status: string;
  }

  interface FlightDetails {
    ticketNumber: string;
    flights: Flight[];
    status: string;
  }

export default function CartPage() {
  const router = useRouter();

  // main booking
  const [booking, setBooking] = useState<Booking | null>(null);

  // flight/hotel booking references
  const [flightBooking, setFlightBooking] = useState<FlightBooking | null>(null);
  const [hotelBooking, setHotelBooking] = useState<HotelBooking | null>(null);
  // from the new GET route
  const [flightDetails, setFlightDetails] = useState<FlightDetails | null>(null);
  const [hotelDetails, setHotelDetails] = useState<HotelDetails | null>(null);
  const [roomTypeDetails, setRoomTypeDetails] = useState<RoomTypeDetails | null>(null);

  // flightBookingId, hotelBookingId from server
  const [flightBookingId, setFlightBookingId] = useState<string | null>(null);
  const [hotelBookingId, setHotelBookingId] = useState<string | null>(null);

  // messages/errors
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Suppose we store JWT in localStorage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("flynextToken") : null;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchCart().catch((err) => console.error(err));
  }, []);

  async function fetchCart() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/booking/itinerary", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || "No pending cart found");
        return;
      }

      // booking, flightBooking, flightBookingId, flightDetails, hotelBooking, hotelBookingId, hotelDetails, roomTypeDetails, message
      setBooking(data.booking || null);

      if (data.flightBooking) setFlightBooking(data.flightBooking);
      if (data.hotelBooking) setHotelBooking(data.hotelBooking);
      if (data.flightDetails) setFlightDetails(data.flightDetails);
      if (data.hotelDetails) setHotelDetails(data.hotelDetails);
      if (data.roomTypeDetails) setRoomTypeDetails(data.roomTypeDetails);

      setFlightBookingId(data.flightBookingId || null);
      setHotelBookingId(data.hotelBookingId || null);

      setMessage(data.message || "");
    } catch (err) {
      console.error(err);
      setError("Server error while fetching cart");
    } finally {
      setLoading(false);
    }
  }

  // POST /api/booking/cancel => remove the items
  async function removeCart() {
    if (!booking) return;
    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          flightBookingId,
          hotelBookingId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to remove cart");
        return;
      }
      // success => empty the cart
      setBooking(null);
      setFlightBooking(null);
      setHotelBooking(null);
      setFlightBookingId(null);
      setHotelBookingId(null);
      setFlightDetails(null);
      setHotelDetails(null);
      setRoomTypeDetails(null);
    } catch (err) {
      console.error(err);
      setError("Server error while removing cart");
    }
  }

  function proceedToCheckout() {
    //if booking
    if (!booking) return;
    router.push(`/checkout?bookingId=${booking.id}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 dark:bg-gray-900 dark:text-gray-100">
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Your Cart (Pending Booking)</h1>
        {message && (
          <div className="bg-green-100 text-green-700 p-2 rounded mb-4">
            {message}
          </div>
        )}

        <div className="mb-2">
          <strong>Booking ID:</strong> {booking.id}
        </div>
        <div className="mb-2">
          <strong>Status:</strong> {booking.status}
        </div>
        {booking.totalPrice !== undefined && (
          <div className="mb-2">
            <strong>Total Price:</strong> ${booking.totalPrice}
          </div>
        )}

        {/* Show flight details in a grid */}
        {flightDetails && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 my-4 p-3 border rounded bg-gray-50 dark:bg-gray-700">
            <h2 className="col-span-2 text-lg font-semibold">Flight Details</h2>
            <p className="font-semibold">Ticket Number:</p>
            <p>{flightDetails.ticketNumber}</p>

            {flightDetails.flights &&
              flightDetails.flights.map((f: Flight, idx: number) => (
                <div key={idx} className="col-span-2 border p-2 my-2">
                  <p>Airline: {f.airline}</p>
                  <p>Flight Number: {f.flightNumber}</p>
                  <p>
                    Departure: {f.departureCity} ({f.departureCode}),{" "}
                    {f.departureCountry}
                  </p>
                  <p>DepartureTime: {f.departureTime}</p>
                  <p>
                    Destination: {f.destinationCity} ({f.destinationCode}),{" "}
                    {f.destinationCountry}
                  </p>
                  <p>ArrivalTime: {f.arrivalTime}</p>
                  <p>
                    Price: {f.price} {f.currency}
                  </p>
                  <p>Status: {f.status}</p>
                </div>
              ))}
          </div>
        )}

        {/* Show raw flight booking (if needed) */}
        {flightBooking && (
          <div className="my-4 border p-3 rounded bg-gray-50 dark:bg-gray-700">
            <h2 className="text-lg font-semibold mb-2">Flight Booking Record</h2>
            <p>ID: {flightBooking.id}</p>
            <p>Reference: {flightBooking.reference}</p>
            <p>Status: {flightBooking.status}</p>
            <p>Price: ${flightBooking.price}</p>
            {flightBooking.flightId && <p>Flight ID: {flightBooking.flightId}</p>}
          </div>
        )}

        {/* Show hotel details (hotelDetails + roomTypeDetails) */}
        {hotelDetails && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 my-4 p-3 border rounded bg-gray-50 dark:bg-gray-700">
            <h2 className="col-span-2 text-lg font-semibold">Hotel Details</h2>
            <p className="font-semibold">Hotel Name:</p>
            <p>{hotelDetails.hotelName}</p>
            <p className="font-semibold">Address:</p>
            <p>{hotelDetails.hotelAddress}</p>
            <p className="font-semibold">Rating:</p>
            <p>{hotelDetails.hotelStarRating}</p>
            {hotelDetails.location && (
              <>
                <p className="font-semibold">Location:</p>
                <p>{hotelDetails.location}</p>
              </>
            )}
          </div>
        )}

        {roomTypeDetails && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 my-4 p-3 border rounded bg-gray-50 dark:bg-gray-700">
            <h2 className="col-span-2 text-lg font-semibold">Room Type Details</h2>
            <p className="font-semibold">Name:</p>
            <p>{roomTypeDetails.roomTypeName}</p>
            <p className="font-semibold">Price/night:</p>
            <p>{roomTypeDetails.roomTypePrice}</p>
            {roomTypeDetails.roomTypeAmenities && (
              <>
                <p className="font-semibold">Amenities:</p>
                <p>{(roomTypeDetails.roomTypeAmenities.toString())}</p>
              </>
            )}
          </div>
        )}

        {/* Show raw hotel booking data */}
        {hotelBooking && (
          <div className="my-4 border p-3 rounded bg-gray-50 dark:bg-gray-700">
            <h2 className="text-lg font-semibold mb-2">Hotel Booking Record</h2>
            <p>ID: {hotelBooking.id}</p>
            <p>Status: {hotelBooking.status}</p>
            <p>Total Price: ${hotelBooking.totalPrice}</p>
            {hotelBooking.checkIn && <p>Check-In: {hotelBooking.checkIn}</p>}
            {hotelBooking.checkOut && <p>Check-Out: {hotelBooking.checkOut}</p>}
            {hotelBooking.roomTypeId && <p>RoomType ID: {hotelBooking.roomTypeId}</p>}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={removeCart}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Remove from Cart
          </button>
          <button
            onClick={proceedToCheckout}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}