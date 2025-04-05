"use client";
/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function InvoicePage() {
  const [pdfUrl, setPdfUrl] = useState("");
  const searchParams = useSearchParams();

  const bookingId = searchParams.get("bookingId") || "";
  const hotelBookingId = searchParams.get("hotelBookingId") || "";
  const flightBookingId = searchParams.get("flightBookingId") || "";

  useEffect(() => {
    if (bookingId) {
      fetchInvoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, hotelBookingId, flightBookingId]);

  const fetchInvoice = async () => {
    const token = localStorage.getItem("flynextToken");
    if (!token) {
      alert("No token found in localStorage");
      return;
    }
    try {
      const res = await fetch(`/api/booking/invoice/${bookingId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          hotelBookingId,
          flightBookingId,
        }),
      });
      if (!res.ok) {
        alert("Failed to generate invoice");
        return;
      }
      const pdfBlob = await res.blob();
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (error) {
      console.error("Error generating invoice:", error);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Booking Invoice</h1>
      {pdfUrl ? (
        <iframe
          src={pdfUrl}
          width="100%"
          height="600px"
          title="Invoice PDF"
        />
      ) : (
        <p>Loading or no invoice yet.</p>
      )}
    </div>
  );
}