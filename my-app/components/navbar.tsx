"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Hotel, Plane, LogIn, LogOut, UserPlus, User, Bell, ShoppingCart, BookOpen } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import DarkModeToggle from "./darkmodetoggle";
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
  const fallbackImage = "/avatar.png";
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null); // For debouncing

  const dropdownItems = [
    { label: "Profile", icon: <User className="h-4 w-4" />, path: "/profile" },
    { label: "Notifications", icon: <Bell className="h-4 w-4" />, path: "/notifications" },
    { label: "My Bookings", icon: <BookOpen className="h-4 w-4" />, path: "/mybookings" },
    { label: "Cart", icon: <ShoppingCart className="h-4 w-4" />, path: "/cart" },
    { label: "Hotel Owner Page", icon: <Hotel className="h-4 w-4" />, path: "/hotel_owner" },
  ];

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

  const fetchProfilePicture = async () => {
    const token = localStorage.getItem("flynextToken");
    if (!token) {
      setProfilePicture(null);
      return;
    }

    try {
      const response = await fetch("/api/auth/profilePicture", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
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

    const handleProfileUpdate = () => {
      console.log("Received profilePictureUpdated event");
      fetchProfilePicture();
    };

    window.addEventListener("userLoggedIn", handleLogin);
    window.addEventListener("userLoggedOut", handleLogout);
    window.addEventListener("profilePictureUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("userLoggedIn", handleLogin);
      window.removeEventListener("userLoggedOut", handleLogout);
      window.removeEventListener("profilePictureUpdated", handleProfileUpdate);
      if (profilePicture) URL.revokeObjectURL(profilePicture);
    };
  }, []);

  useEffect(() => {
    if (user) fetchProfilePicture();
    else setProfilePicture(null);
  }, [user]);

  const handleLogoutClick = () => {
    localStorage.removeItem("flynextToken");
    setUser(null);
    setProfilePicture(null);
    window.dispatchEvent(new Event("userLoggedOut"));
    router.push("/");
  };

  // Handle mouse enter with no delay
  const handleMouseEnter = () => {
    if (timeoutId) clearTimeout(timeoutId); // Clear any pending close
    setIsDropdownOpen(true);
  };

  // Handle mouse leave with a 200ms delay
  const handleMouseLeave = () => {
    const id = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 200); // 200ms delay before closing
    setTimeoutId(id);
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
            <div
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className="hover:opacity-75 transition-opacity"
                title="User Menu"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  {profilePicture ? (
                    <Image
                      src={profilePicture}
                      alt="User Profile"
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                      onError={(e) => (e.currentTarget.src = fallbackImage)}
                    />
                  ) : (
                    <Image
                      src={fallbackImage}
                      alt="Fallback Profile"
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                      onError={(e) => (e.currentTarget.src = "/avatar.png")}
                    />
                  )}
                </div>
              </button>
              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-0 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md py-2 z-50"
                  onMouseEnter={handleMouseEnter} // Keep open when hovering dropdown
                  onMouseLeave={handleMouseLeave}
                >
                  {dropdownItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        router.push(item.path);
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </button>
                  ))}
                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center w-full px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="ml-2">Logout</span>
                  </button>
                </div>
              )}
            </div>
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