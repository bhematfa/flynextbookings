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


  
export default function FlightResultsPage() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<FlightOption[][]>([]);
  const [type, setType] = useState<"one-way" | "round">("one-way");
  const [hotelSuggestions, setHotelSuggestions] = useState<HotelSuggestion[]>([]);
  const [hotelLoading, setHotelLoading] = useState<boolean>(false);
  const [hotelError, setHotelError] = useState<string | null>(null);
  const router = useRouter();
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");

  useEffect(() => {
    const resultsParam = searchParams.get("results");
    const typeParam = searchParams.get("type") as "one-way" | "round";

    if (resultsParam) {
      try {
        const parsedResults = JSON.parse(decodeURIComponent(resultsParam));
        setResults(parsedResults);
        setType(typeParam || "one-way");

        if (localStorage.getItem("flynextoken") && parsedResults.length > 0 && parsedResults[0].length > 0) {
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
      }
    }
  }, [searchParams]);

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

  

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="container mx-auto">
        {(
          <>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
              {type === "one-way" ? "Flight Results" : "Outbound Flights"}
            </h1>
            <div className="grid grid-cols-1 gap-6">
              {results[0]?.map((option, idx) => (
                <div
                  key={idx}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition"
                >
                  {option.flights.map((flight) => (
                    console.log(flight),
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
                      className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition"
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
                    </div>
                  ))}
                </div>
              </>
            )}

            {localStorage.getItem("flynextoken") && (
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
                                handleHotelSearch(
                                hotel.city,
                                checkInDate,
                                checkOutDate
                                )
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
            )
            }
          </>
        )}
      </div>
    </div>
  );
}