"use client";

import { useRouter } from "next/navigation";
//import { useMediaQuery } from "react-responsive";

// Determine if the user is on a mobile device for responsive UI adjustments
//const isMobile = useMediaQuery({ query: "(max-width: 767px)" });
import { useState, useEffect } from "react";
import { Plane, Hotel, ArrowRight } from "lucide-react";
import Card from "@/components/card";

// Define the card data here
const cards = [
  {
    title: "Find Flights",
    icon: <Plane className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />,
    path: "/flights/search",
    desc: "Search for the best flight deals to your dream destinations. Enjoy a seamless booking experience with adaptive options for any screen.",
    image: "url('/airplane.jpg')",
  },
  {
    title: "Book Hotels",
    icon: <Hotel className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />,
    path: "/hotel_visitor",
    desc: "Find perfect accommodations at great prices. Our design adjusts to your device for an effortless booking process.",
    image: "url('/hotel.jpg')",
  },
];

export default function Home() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full">
      <header className="py-10 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
            Your Journey Begins Here
          </h1>
          <p className="mt-2 text-lg text-gray-700 dark:text-gray-300">
            Discover the world with FlyNext - your most reliable travel companion for flights and hotels.
          </p>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card, index) => (
            <Card key={index} {...card} />
          ))}
        </div>
      </main>
    </div>
  );
}
