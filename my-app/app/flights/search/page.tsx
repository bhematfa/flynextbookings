"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Plane, Calendar, ArrowRight } from "lucide-react";
import AsyncSelect from "react-select/async";

interface Suggestion {
  actual: string; // city name or airport code
  label: string; // display name
  type: "city" | "airport";
}

interface FlightSearchForm {
  origin: Suggestion | null;
  destination: Suggestion | null;
  type: "one-way" | "round";
  date: string[];
}

export default function FlightSearchPage() {
  const [form, setForm] = useState<FlightSearchForm>({
    origin: null,
    destination: null,
    type: "one-way",
    date: [""],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch suggestions from the /api/flights/dropdown endpoint
  const loadOptions = async (inputValue: string) => {
    if (!inputValue) return [];
    try {
      const response = await fetch(`/api/flights/dropdown?q=${encodeURIComponent(inputValue)}`);
      const data = await response.json();
      return data.map((item: { id: string; name: string; value:string; type: string }) => ({
        value: item.id,
        label: item.name,
        actual: item.value,
      }));
    } catch (err) {
      console.error("Error fetching dropdown suggestions:", err);
      return [];
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!form.origin || !form.destination) {
      setError("Please select both origin and destination.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/flights",
        {
          origin: form.origin.actual, // Extract city name or code
          destination: form.destination.actual,
          date: form.date,
          type: form.type,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.length === 0) {
        setError("No flights found.");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("flightResults", JSON.stringify(response.data));
      setLoading(false);

      router.push(
        `/flights/results?type=${form.type}`
      );
    } catch (err: any) {
      setError(err.response?.data?.error || "Error fetching flights.");
      setLoading(false);
    }
  };

  const handleTypeChange = (value: "one-way" | "round") => {
    setForm((prev) => ({
      ...prev,
      type: value,
      date: value === "one-way" ? [""] : ["", ""],
    }));
  };

  return (
    <div className="relative h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 overflow-hidden flex items-center justify-center">
      {/* Background Gradient with Image */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-gradient-to-b from-blue-100 via-gray-50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-900"
          style={{
            backgroundImage: "url('/airplane.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.3,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="container relative z-10 flex flex-col items-center py-12 px-4">
        <div className="max-w-3xl text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4 flex items-center justify-center gap-2">
            <Plane className="h-8 w-8 text-blue-600" />
            Search Flights
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Find the best flight deals with FlyNext, your trusted travel companion.
          </p>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Origin
                </label>
                <AsyncSelect
                  cacheOptions
                  loadOptions={loadOptions}
                  value={form.origin}
                  onChange={(selected) => setForm({ ...form, origin: selected })}
                  placeholder="e.g., Toronto"
                  className="text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Destination
                </label>
                <AsyncSelect
                  cacheOptions
                  loadOptions={loadOptions}
                  value={form.destination}
                  onChange={(selected) => setForm({ ...form, destination: selected })}
                  placeholder="e.g., Zurich"
                  className="text-gray-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Trip Type
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => handleTypeChange("one-way")}
                  className={`flex-1 py-2 px-4 rounded-md border transition-all duration-200 ${
                    form.type === "one-way"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                  }`}
                >
                  One-way
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("round")}
                  className={`flex-1 py-2 px-4 rounded-md border transition-all duration-200 ${
                    form.type === "round"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                  }`}
                >
                  Round Trip
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {form.type === "one-way" ? "Departure Date" : "Departure & Return Dates"}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.date.map((d, index) => (
                  <input
                    key={index}
                    type="date"
                    value={d}
                    onChange={(e) => {
                      const newDates = [...form.date];
                      newDates[index] = e.target.value;
                      setForm({ ...form, date: newDates });
                    }}
                    required
                    className="w-full px-4 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search Flights"}
              {!loading && <ArrowRight className="h-5 w-5" />}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 text-red-500 font-semibold bg-red-100 dark:bg-red-900/30 p-4 rounded-md w-full max-w-2xl">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}