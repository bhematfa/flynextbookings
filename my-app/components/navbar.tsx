"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Hotel, Plane, LogIn, LogOut, UserPlus } from "lucide-react";
import { parseAndVerifyToken, verifyToken } from "@/utils/jwt";
import DarkModeToggle from "./darkmodetoggle";
import { log } from "console";
import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "jwt-decode";


interface CustomJwtPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<CustomJwtPayload | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const fallbackImage = "/avatar.png"; // Generic fallback in public/

  // Load user from token
  const loadUser = () => {
    const token = localStorage.getItem("flynextToken");
    if (token) {
      try {
        const decoded = jwtDecode<CustomJwtPayload>(token);
        setUser(decoded);
      } catch (err) {
        console.error("Invalid token", err);
        setUser(null);
        setProfilePicture(null);
      }
    } else {
      setUser(null);
      setProfilePicture(null);
    }
  };

  // Fetch profile picture when user is authenticated
  const fetchProfilePicture = async () => {
    const token = localStorage.getItem("flynextToken");
    if (!token) {
      setProfilePicture(null);
      return;
    }

    try {
      const response = await fetch("/api/profile/picture", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob); // Create a local URL for the image
        setProfilePicture(imageUrl);
      } else {
        console.log("Failed to fetch profile picture:", response.statusText);
        setProfilePicture(fallbackImage);
      }
    } catch (err) {
      console.log("Error fetching profile picture:", err);
      setProfilePicture(fallbackImage);
    }
  };

  useEffect(() => {
    loadUser();

    const handleLogin = () => {
      console.log("Received userLoggedIn event");
      loadUser();
    };

    const handleLogout = () => {
      console.log("Received userLoggedOut event");
      loadUser();
    };

    window.addEventListener("userLoggedIn", handleLogin);
    window.addEventListener("userLoggedOut", handleLogout);

    return () => {
      window.removeEventListener("userLoggedIn", handleLogin);
      window.removeEventListener("userLoggedOut", handleLogout);
    };
  }, []);

  // Fetch profile picture when user changes
  useEffect(() => {
    if (user) {
      fetchProfilePicture();
    } else {
      setProfilePicture(null);
    }
  }, [user]);

  const handleLogoutClick = () => {
    localStorage.removeItem("flynextToken");
    setUser(null);
    setProfilePicture(null);
    window.dispatchEvent(new Event("userLoggedOut"));
    router.push("/");
  };
  
  

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
            onClick={() => router.push("/flights/search")}
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
                className="hover:opacity-75 transition-opacity"
                title="Go to Dashboard"
                >
                <Image
                  src={profilePicture || fallbackImage}
                  alt="User Profile"
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                  onError={() => setProfilePicture(fallbackImage)}
                />
                </button>
              <button
                onClick={handleLogoutClick}
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
