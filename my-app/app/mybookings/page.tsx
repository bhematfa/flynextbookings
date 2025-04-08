"use client";
/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// --------------------
// INTERFACES
// --------------------
/** Basic booking fields stored in DB. */
interface Booking {
  id: string;
  userId: string;
  status: string;         // e.g. 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  totalPrice: number | null;
  flightBookingId?: string | null;
  hotelBookingId?: string | null;
  createdAt: string;      // or Date if you parse it, but string from JSON
  updatedAt: string;      // same note
  customerLastName?: string; // optional
}

/** Minimal flightBooking row from DB. */
interface FlightBooking {
  id: string;
  reference: string;
  status: string;  // e.g. 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  price: number;
  flightId?: string | null;
}

/** Minimal hotelBooking row from DB. */
interface HotelBooking {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;  // e.g. 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  totalPrice: number;
  checkIn?: string;   // or Date if you parse
  checkOut?: string;  // or Date
  roomTypeId?: string | null;
}

/** Additional flight details from AFS retrieve. */
interface FlightSegment {
  flightNumber: string;
  airline: string;
  departureCity: string;
  departureAirport: string;
  departureCode: string;
  departureCountry: string;
  departureTime: string;
  destinationCity: string;
  destinationAirport: string;
  destinationCode: string;
  destinationCountry: string;
  arrivalTime: string;
  duration: number;
  price: number;
  currency: string;
  status: string;
}

interface FlightDetails {
  ticketNumber: string;
  flights: FlightSegment[];
  status: string;
}

/** Additional hotel details. */
interface HotelDetails {
  hotelName: string;
  hotelAddress: string;
  hotelStarRating?: number;
  hotelLogo?: string;
  address?: string;
  city?: string;
  location?: string;
}

interface RoomTypeDetails {
  roomTypeName: string;
  roomTypePrice: number;
  roomTypeAmenities: string[];
}

/** The server returns an extended structure that merges everything: */
interface DetailedBooking extends Booking {
  flightBooking?: FlightBooking | null;
  hotelBooking?: HotelBooking | null;
  flightDetails?: FlightDetails | null;
  hotelDetails?: HotelDetails | null;
  roomTypeDetails?: RoomTypeDetails | null;
}

interface GetBookingsResponse {
  page: number;
  pageSize: number;
  results: DetailedBooking[];
  error?: string;
}

// --------------------
// MYBOOKINGS COMPONENT
// --------------------
export default function MyBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [page, setPage] = useState<number>(1);
  const [bookings, setBookings] = useState<DetailedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("flynextToken") : null;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    const spPage = searchParams.get("page");
    if (spPage) {
      const p = parseInt(spPage, 10);
      if (!isNaN(p) && p > 0) {
        setPage(p);
      }
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [page]);

  async function fetchBookings() {
    try {
      setLoading(true);
      setError("");
      setBookings([]);

      const res = await fetch(`/api/booking?page=${page}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data: GetBookingsResponse = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load bookings");
        return;
      }
      setBookings(data.results || []);
      setHasMore(data.results && data.results.length === data.pageSize);
    } catch (err) {
      console.error(err);
      setError("Server error");
    } finally {
      setLoading(false);
    }
  }

  function handleNextPage() {
    router.push(`/mybookings?page=${page + 1}`);
    setPage((prev) => prev + 1);
  }
  function handlePrevPage() {
    if (page > 1) {
      router.push(`/mybookings?page=${page - 1}`);
      setPage((prev) => prev - 1);
    }
  }

  async function cancelBooking(bookingId: string, hotelBookingId?: string | null, flightBookingId?: string | null) {
    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId, hotelBookingId, flightBookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to cancel booking");
        return;
      }
      alert("Booking cancelled successfully");
      // re-fetch
      fetchBookings();
    } catch (err) {
      console.error(err);
      alert("Error cancelling booking");
    }
  }

  function openInvoiceTab(
    bookingId: string,
    hotelBookingId?: string | null,
    flightBookingId?: string | null
  ) {
    const params = new URLSearchParams({ bookingId });
    if (hotelBookingId) params.set("hotelBookingId", hotelBookingId);
    if (flightBookingId) params.set("flightBookingId", flightBookingId);
    const invoiceUrl = `/invoice?${params.toString()}`;
    window.open(invoiceUrl, "_blank"); 
  }

  function goToCheckout(bookingId: string) {
    router.push(`/checkout?bookingId=${bookingId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading bookings...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  if (!bookings || bookings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No bookings found.</p>
      </div>
    );
  }

return (
    <div className="min-h-screen p-4 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">My Bookings</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings.map((b) => (
                    <div
                        key={b.id}
                        className="border rounded bg-white dark:bg-gray-800 p-4 shadow"
                    >
                        <p className="font-semibold mb-2">Booking ID: {b.id}</p>
                        <p>User ID: {b.userId}</p>
                        <p>Customer Last Name: {b.customerLastName}</p>
                        <p>Flight Booking ID: {b.flightBookingId}</p>
                        <p>Hotel Booking ID: {b.hotelBookingId}</p>
                        <p>Status: {b.status}</p>
                        <p>Total Price: ${b.totalPrice}</p>
                        <p>Created: {new Date(b.createdAt).toLocaleString()}</p>

                        {/* Flight Booking info */}
                        {b.flightBooking && (
                            <div className="mt-2 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                <p className="font-semibold">Flight Booking</p>
                                <p>Reference: {b.flightBooking.reference}</p>
                                <p>Status: {b.flightBooking.status}</p>
                                <p>Price: {b.flightBooking.price}</p>
                            </div>
                        )}
                        {b.flightDetails && (
                            <div className="mt-2 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                <p className="font-semibold">Flight Details</p>
                                {b.flightDetails.flights.map((flight, index) => (
                                    <div key={index} className="mb-2">
                                        <p>Flight Number: {flight.flightNumber}</p>
                                        <p>Airline: {flight.airline}</p>
                                        <p>
                                            Departure: {flight.departureCity} ({flight.departureCode}) at{" "}
                                            {new Date(flight.departureTime).toLocaleString()}
                                        </p>
                                        <p>
                                            Arrival: {flight.destinationCity} ({flight.destinationCode}) at{" "}
                                            {new Date(flight.arrivalTime).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Hotel Booking info */}
                        {b.hotelBooking && (
                            <div className="mt-2 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                <p className="font-semibold">Hotel Booking</p>
                                <p>First Name: {b.hotelBooking.firstName}</p>
                                <p>Last Name: {b.hotelBooking.lastName}</p>
                                <p>Email: {b.hotelBooking.email}</p>
                                <p>Hotel Booking ID: {b.hotelBooking.id}</p>
                                <p>Status: {b.hotelBooking.status}</p>
                                <p>Total Price: {b.hotelBooking.totalPrice}</p>
                                {b.hotelBooking.checkIn && (
                                    <p>Check-In: { new Date(b.hotelBooking.checkIn).toLocaleString()}</p>
                                )}
                                {b.hotelBooking.checkOut && (
                                    <p>Check-Out: { new Date(b.hotelBooking.checkOut).toLocaleString()}</p>
                                )}
                            </div>
                        )}
                        {b.hotelDetails && (
                            <div className="mt-2 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                <p className="font-semibold">Hotel Details</p>
                                <p>Name: {b.hotelDetails.hotelName}</p>
                                <p>Address: {b.hotelDetails.hotelAddress}</p>
                                <p>Star Rating: {b.hotelDetails.hotelStarRating}</p>
                            </div>
                        )}
                        {b.roomTypeDetails && (
                            <div className="mt-2 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                <p className="font-semibold">Room Type Details</p>
                                <p>Name: {b.roomTypeDetails.roomTypeName}</p>
                                <p>Price: {b.roomTypeDetails.roomTypePrice}</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-3 flex gap-2">
                            {b.status === "PENDING" && (
                                <>
                                    <button
                                        onClick={() => goToCheckout(b.id)}
                                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                    >
                                        Go to Checkout
                                    </button>
                                    <button
                                        onClick={() => cancelBooking(b.id, b.hotelBookingId, b.flightBookingId)}
                                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                    >
                                        Cancel Booking
                                    </button>
                                </>
                            )}
                            {b.status === "CONFIRMED" && (
                                <>
                                    <button
                                        onClick={() => cancelBooking(b.id, b.hotelBookingId, b.flightBookingId)}
                                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                    >
                                        Cancel Booking
                                    </button>
                                    <button
                                        onClick={() =>
                                            openInvoiceTab(
                                                b.id,
                                                b.hotelBookingId,
                                                b.flightBookingId
                                            )
                                        }
                                        className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                                    >
                                        Generate Invoice
                                    </button>
                                </>
                            )}
                            {b.status === "CANCELLED" && (
                                <button
                                    onClick={() =>
                                        openInvoiceTab(b.id, b.hotelBookingId, b.flightBookingId)
                                    }
                                    className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                                >
                                    Generate Invoice
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-4 mt-6">
                {page > 1 && (
                    <button
                        onClick={handlePrevPage}
                        className="bg-gray-400 dark:bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-500 dark:hover:bg-gray-700"
                    >
                        Previous Page
                    </button>
                )}
                {hasMore && (
                    <button
                        onClick={handleNextPage}
                        className="bg-gray-400 dark:bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-500 dark:hover:bg-gray-700"
                    >
                        Next Page
                    </button>
                )}
            </div>
        </div>
    </div>
);
}