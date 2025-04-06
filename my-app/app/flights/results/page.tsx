"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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

export default function FlightResultsPage() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<FlightOption[][]>([]);
  const [type, setType] = useState<"one-way" | "round">("one-way");

  useEffect(() => {
    const resultsParam = searchParams.get("results");
    const typeParam = searchParams.get("type") as "one-way" | "round";

    if (resultsParam) {
      try {
        const parsedResults = JSON.parse(decodeURIComponent(resultsParam));
        setResults(parsedResults);
        setType(typeParam || "one-way");
      } catch (err) {
        console.error("Error parsing results:", err);
      }
    }
  }, [searchParams]);

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
          </>
        )}
      </div>
    </div>
  );
}