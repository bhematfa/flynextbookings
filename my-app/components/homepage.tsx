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
    <div className="relative bg-gray-50 dark:bg-gray-900">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-gradient-to-b from-blue-100 via-gray-50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-900"
          style={{
            backgroundImage: "url('/placeholder.svg?height=1080&width=1920')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.5,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="container relative z-10 flex flex-col justify-center items-center h-full text-center">
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
