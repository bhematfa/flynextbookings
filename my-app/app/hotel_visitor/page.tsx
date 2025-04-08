"use client";
import dynamic from "next/dynamic";
import React from "react";

// Dynamically import HotelSearch with SSR disabled
const HotelSearch = dynamic(() => import("./HotelSearch"), { ssr: false });

export default function HotelVisitorPage() {
  return <HotelSearch />;
}
