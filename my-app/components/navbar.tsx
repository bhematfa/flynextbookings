"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Hotel, Plane, LogIn, LogOut, UserPlus } from "lucide-react";
import { signToken } from "@/utils/jwt";
import DarkModeToggle from "./darkmodetoggle";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("flynextToken");
      if (token) {
        const decoded = signToken(token);
        if (decoded) {
          setUser(decoded);
        }
      }
    }
  }, []);

  return (
    <nav className="w-full py-4 bg-white dark:bg-gray-900 shadow-md fixed top-0 z-50">
      <div className="container mx-auto flex items-center px-4">
        {/* Left: Logo */}
        <div className="flex-1">
          <div
            className="text-2xl font-bold text-blue-600 cursor-pointer"
            onClick={() => router.push("/")}
          >
            FlyNext
          </div>
        </div>

        {/* Center: Navigation Buttons */}
        <div className="flex-1 flex justify-center space-x-6">
          <button
            onClick={() => router.push("/flights")}
            className="hover:text-blue-600 transition-colors"
          >
            <Plane className="h-6 w-6 text-blue-600" />
          </button>
          <button
            onClick={() => router.push("/hotel_visitor")}
            className="hover:text-blue-600 transition-colors"
          >
            <Hotel className="h-6 w-6 text-blue-600" />
          </button>
        </div>

        {/* Right: Auth Actions and Dark Mode Toggle */}
        <div className="flex-1 flex justify-end items-center space-x-4">
          {user ? (
            <>
              <button
                onClick={() => router.push("/profile")}
                className="hover:text-blue-600 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  // Logout logic here
                  console.log("Logging out...");
                }}
                className="hover:text-blue-600 transition-colors"
              >
                <LogOut className="h-6 w-6 text-blue-600" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/login")}
                className="hover:text-blue-600 transition-colors"
              >
                <LogIn className="h-6 w-6 text-blue-600" />
              </button>
              <button
                onClick={() => router.push("/register")}
                className="hover:text-blue-600 transition-colors"
              >
                <UserPlus className="h-6 w-6 text-blue-600" />
              </button>
            </>
          )}
          <DarkModeToggle />
        </div>
      </div>
    </nav>
  );
}
