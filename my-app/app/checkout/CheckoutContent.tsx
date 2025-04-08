// app/checkout/CheckoutContent.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutContent() {
  const router = useRouter();
  const [bookingId, setBookingId] = useState<string | null>(null);

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("flynextToken") : null;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const bid = urlParams.get("bookingId");
    if (bid) {
      setBookingId(bid);
    } else {
      setError("No bookingId provided in query parameters");
    }
  }, [router, token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!bookingId) {
      setError("No booking ID found");
      return;
    }
    if (!cardNumber || !expiry || !nameOnCard) {
      setError("Please fill out all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/booking/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          cardNumber,
          expiry,
          nameOnCard,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout failed");
        setLoading(false);
        return;
      }
      setSuccess("Payment validated. Booking is confirmed!");
    } catch (err) {
      console.error(err);
      setError("Server error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center dark:bg-gray-900 dark:text-gray-100">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 p-2 rounded mb-4">
            {success}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Booking ID</label>
              <input
                type="text"
                value={bookingId ?? ""}
                disabled
                className="w-full border px-3 py-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-900 cursor-not-allowed"
              />
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-1">Name on Card</label>
              <input
                type="text"
                value={nameOnCard}
                onChange={(e) => setNameOnCard(e.target.value)}
                className="w-full border px-3 py-2 dark:text-gray-900"
                placeholder="Jane Doe"
              />
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-1">Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full border px-3 py-2 dark:text-gray-900"
                placeholder="1234 5678 9876 5432"
              />
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-1">Expiry (MM/YY)</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full border px-3 py-2 dark:text-gray-900"
                placeholder="04/25"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {loading ? "Processing..." : "Confirm Payment"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
