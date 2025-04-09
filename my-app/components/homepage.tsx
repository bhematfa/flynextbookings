"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Plane, Hotel, ArrowRight } from "lucide-react";
import Card from "@/components/card";

// Define the card data here
const cards = [
  {
    title: "Find Flights",
    icon: <Plane className="h-6 w-6 text-blue-600" />,
    path: "/flights/search",
    desc: "Search for the best flight deals to your dream destinations",
    image: "url('/airplane.jpg')",
  },
  {
    title: "Book Hotels",
    icon: <Hotel className="h-6 w-6 text-blue-600" />,
    path: "/hotel_visitor",
    desc: "Find perfect accommodations for your stay at the best prices",
    image: "url('/hotel.jpg')",
  },
];

export default function Home() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full">
      {/* Main Content */}
      <div className="container flex flex-col justify-center items-center h-screen text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-6">
            Your Journey Begins Here
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Discover the world with FlyNext - your most reliable travel companion for flights and hotels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {cards.map((card, index) => (
            <Card key={index} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}