"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Plane, Hotel, ArrowRight } from "lucide-react";


export default function Card({ title, icon, path, desc }) {
  const router = useRouter();

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-white dark:bg-gray-800 shadow-md transition-all hover:shadow-lg">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent z-0" />
      {/* Background image with adjusted dark mode background */}
      <div
        className="h-48 w-full bg-gray-200 dark:bg-gray-700"
        style={{
          backgroundImage: "url('/placeholder.svg?height=400&width=600')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Card content */}
      <div className="p-6 relative z-10 bg-gray-300 dark:bg-gray-800">
        <div className="flex items-center mb-4">
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-4">
            {icon}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-6">{desc}</p>
        <button
          onClick={() => router.push(path)}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 border rounded hover:bg-blue-600 hover:text-white transition-colors text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400"
        >
          {title}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}