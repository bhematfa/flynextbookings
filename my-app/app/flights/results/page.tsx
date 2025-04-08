"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

interface FlightLeg {
  id: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  origin: { code: string; name: string; city: string; country: string };
  destination: { code: string; name: string; city: string; country: string };
  duration: number;
  price: number;
  currency: string;
  availableSeats: number;
  status: string;
  airline: { code: string; name: string };
}

interface FlightOption {
  legs: number;
  flights: FlightLeg[];
}

interface HotelSuggestion {
  id: string;
  name: string;
  address: string;
  city: string;
  starRating: number;
  images: string[];
  roomTypes: {
    id: string;
    name: string;
    amenities: string[];
    pricePerNight: number;
    images: string[];
    availability: number;
  }[];
}

interface Booking {
  id: string;
  hotelBookingId?: string | null;
  flightBookingId?: string | null;
  hotelBooking?: {
    hotelId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
  };
}

export default function FlightResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<FlightOption[][]>([]);
  const [type, setType] = useState<"one-way" | "round">("one-way");
  const [hotelSuggestions, setHotelSuggestions] = useState<HotelSuggestion[]>([]);
  const [hotelLoading, setHotelLoading] = useState<boolean>(false);
  const [hotelError, setHotelError] = useState<string | null>(null);
  const [passportNumber, setPassportNumber] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");
  const [selectedOutbound, setSelectedOutbound] = useState<FlightOption | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<FlightOption | null>(null);
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);
  const [bookingChoice, setBookingChoice] = useState<"new" | "patch">("new");

  const token = typeof window !== "undefined" ? localStorage.getItem("flynextToken") : null;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch flight results
    const resultsParam = sessionStorage.getItem("flightResults");
    const typeParam = searchParams.get("type") as "one-way" | "round";

    if (resultsParam) {
      try {
        const parsedResults = JSON.parse(decodeURIComponent(resultsParam));
        setResults(parsedResults);
        setType(typeParam || "one-way");

        if (parsedResults.length > 0 && parsedResults[0].length > 0) {
          const firstOption = parsedResults[0][0];
          const lastOutboundFlight = firstOption.flights[firstOption.flights.length - 1];
          const city = lastOutboundFlight.destination.city;
          const arrivalInCity = lastOutboundFlight.arrivalTime.split("T")[0];
          const departureFromCity =
            type === "round" && parsedResults[1]?.[0]?.flights[0]
              ? parsedResults[1][0].flights[0].departureTime.split("T")[0]
              : new Date(
                  new Date(lastOutboundFlight.arrivalTime).setDate(
                    new Date(lastOutboundFlight.arrivalTime).getDate() + 3
                  )
                )
                  .toISOString()
                  .split("T")[0];

          setCheckInDate(arrivalInCity);
          setCheckOutDate(departureFromCity);
          fetchHotelSuggestions(city, arrivalInCity, departureFromCity);
        }
      } catch (err) {
        console.error("Error parsing results:", err);
        alert("Failed to load flight results");
      }
    }

    // Fetch pending booking
    fetchPendingBooking();
  }, [searchParams, token]);

  const fetchPendingBooking = async () => {
    try {
      const response = await axios.get("/api/booking/itinerary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = response.data;
      if (data.booking && data.hotelBookingId && !data.flightBookingId) {
        setPendingBooking(data.booking);
      } else {
        setPendingBooking(null);
      }
    } catch (err) {
      console.error("Error fetching pending booking:", err);
      setPendingBooking(null); // Silently fail if no pending booking
    }
  };

  const fetchHotelSuggestions = async (
    city: string,
    arrivalInCity: string,
    departureFromCity: string
  ) => {
    setHotelLoading(true);
    setHotelError(null);
    try {
      const response = await axios.get("/api/hotels/suggestions", {
        params: { city, arrivalInCity, departureFromCity, page: 1, pageSize: 3 },
      });
      setHotelSuggestions(response.data.suggestions || []);
    } catch (err: any) {
      setHotelError(err.response?.data?.error || "Failed to fetch hotel suggestions");
    } finally {
      setHotelLoading(false);
    }
  };

  const handleHotelSearch = (city: string, checkIn: string, checkOut: string) => {
    const flightParams = searchParams.toString();
    router.push(
      `/hotel-search?city=${encodeURIComponent(city)}&checkIn=${checkIn}&checkOut=${checkOut}&${flightParams}`
    );
  };

  const addToCart = async () => {
    if (!passportNumber) {
      alert("Please enter your passport number");
      return;
    }

    const passportRegex = /^\d{9}$/;
    if (!passportRegex.test(passportNumber)) {
      alert("Passport number must be exactly 9 digits and contain only numbers");
      return;
    }

    if (!selectedOutbound || (type === "round" && !selectedReturn)) {
      alert("Please select all required flights");
      return;
    }

    const flightIds = [
      ...(selectedOutbound?.flights.map((f) => f.id) || []),
      ...(type === "round" && selectedReturn ? selectedReturn.flights.map((f) => f.id) : []),
    ];

    try {
      console.log("Adding to cart:", flightIds, passportNumber);
      const payload = { flightIds, passportNumber };
      let response;

      if (bookingChoice === "patch" && pendingBooking) {
        response = await axios.patch(
          "/api/booking/itinerary",
          { ...payload, bookingId: pendingBooking.id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        response = await axios.post("/api/booking/itinerary", payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }

      if (response.status === 200) {
        alert("Added to cart. View in My Bookings/Cart.");
        setSelectedOutbound(null);
        setSelectedReturn(null);
        setPassportNumber("");
        setPendingBooking(null); // Reset after successful patch or post
        setBookingChoice("new"); // Default back to new
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.response?.data?.message || "Failed to add to cart");
    }
  };

  const isAddToCartEnabled = type === "one-way" ? !!selectedOutbound : !!selectedOutbound && !!selectedReturn;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="container mx-auto">
        {results.length > 0 ? (
          <>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
              {type === "one-way" ? "Flight Results" : "Outbound Flights"}
            </h1>
            {token && (
              <div className="mb-6">
                <label className="block font-semibold mb-1 text-gray-900 dark:text-gray-100">
                  Passport Number
                </label>
                <input
                  type="text"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  className="w-full max-w-xs border px-3 py-2 rounded dark:text-gray-900"
                  placeholder="Enter 9-digit passport number"
                  maxLength={9}
                />
              </div>
            )}
            {token && pendingBooking && (
              <div className="mb-6">
                <p className="text-gray-900 dark:text-gray-100 mb-2">
                  You have a pending hotel-only booking (ID: {pendingBooking.id}). Would you like to:
                </p>
                <div className="flex gap-4">
                  <label className="flex items-center text-gray-900 dark:text-gray-100">
                    <input
                      type="radio"
                      value="patch"
                      checked={bookingChoice === "patch"}
                      onChange={() => setBookingChoice("patch")}
                      className="mr-2"
                    />
                    Add flights to this booking
                  </label>
                  <label className="flex items-center text-gray-900 dark:text-gray-100">
                    <input
                      type="radio"
                      value="new"
                      checked={bookingChoice === "new"}
                      onChange={() => setBookingChoice("new")}
                      className="mr-2"
                    />
                    Create a new booking
                  </label>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-6">
              {results[0]?.map((option, idx) => (
                <div
                  key={idx}
                  className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border ${
                    selectedOutbound === option ? "border-green-500" : "border-gray-200 dark:border-gray-700"
                  } hover:shadow-lg transition`}
                >
                  {option.flights.map((flight) => (
                    <div key={flight.id} className="mb-4 last:mb-0">
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        ✈ {flight.airline.name} ({flight.flightNumber})
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {flight.origin.city} ({flight.origin.code}) →{" "}
                        {flight.destination.city} ({flight.destination.code})
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        🕒 {new Date(flight.departureTime).toLocaleString()} →{" "}
                        {new Date(flight.arrivalTime).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Duration: {Math.floor(flight.duration / 60)}h {flight.duration % 60}m
                      </p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {flight.currency} {flight.price}
                      </p>
                    </div>
                  ))}
                  {token && (
                    <button
                      onClick={() => setSelectedOutbound(option)}
                      className={`mt-4 py-2 px-4 rounded-md transition ${
                        selectedOutbound === option
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"
                      }`}
                    >
                      {selectedOutbound === option ? "Selected" : "Select"}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {type === "round" && results[1] && (
              <>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-10 mb-8">
                  Return Flights
                </h1>
                <div className="grid grid-cols-1 gap-6">
                  {results[1].map((option, idx) => (
                    <div
                      key={idx}
                      className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border ${
                        selectedReturn === option ? "border-green-500" : "border-gray-200 dark:border-gray-700"
                      } hover:shadow-lg transition`}
                    >
                      {option.flights.map((flight) => (
                        <div key={flight.id} className="mb-4 last:mb-0">
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            ✈ {flight.airline.name} ({flight.flightNumber})
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            {flight.origin.city} ({flight.origin.code}) →{" "}
                            {flight.destination.city} ({flight.destination.code})
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            🕒 {new Date(flight.departureTime).toLocaleString()} →{" "}
                            {new Date(flight.arrivalTime).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Duration: {Math.floor(flight.duration / 60)}h {flight.duration % 60}m
                          </p>
                          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {flight.currency} {flight.price}
                          </p>
                        </div>
                      ))}
                      {token && (
                        <button
                          onClick={() => setSelectedReturn(option)}
                          className={`mt-4 py-2 px-4 rounded-md transition ${
                            selectedReturn === option
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"
                          }`}
                        >
                          {selectedReturn === option ? "Selected" : "Select"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {token && (
              <div className="mt-6">
                <button
                  onClick={addToCart}
                  disabled={!isAddToCartEnabled}
                  className={`py-2 px-4 rounded-md transition ${
                    isAddToCartEnabled
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-400 text-gray-700 cursor-not-allowed"
                  }`}
                >
                  Add to Cart
                </button>
              </div>
            )}

            {token && (
              <div className="mt-10">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Hotel Suggestions
                </h2>
                {hotelLoading ? (
                  <p className="text-gray-700 dark:text-gray-300">Loading hotel suggestions...</p>
                ) : hotelError ? (
                  <p className="text-red-600 dark:text-red-400">{hotelError}</p>
                ) : hotelSuggestions.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {hotelSuggestions.map((hotel) => (
                      <div
                        key={hotel.id}
                        className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition"
                      >
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {hotel.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {hotel.address}, {hotel.city}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ⭐ {hotel.starRating} stars
                        </p>
                        <button
                          onClick={() =>
                            handleHotelSearch(hotel.city, checkInDate, checkOutDate)
                          }
                          className="mt-4 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                          View Rooms
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">No hotel suggestions available.</p>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-700 dark:text-gray-300">No flight results found.</p>
        )}
      </div>
    </div>
  );
}