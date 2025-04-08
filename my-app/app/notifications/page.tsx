/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Bell } from "lucide-react";

interface CustomJwtPayload {
  userId: string;
  email: string;
  role: string;
}

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string; // Assuming this exists in your schema
}

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<CustomJwtPayload | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("flynextToken") : null;

  // Load user from token
  const loadUser = () => {
    if (token) {
      try {
        const decoded = jwtDecode<CustomJwtPayload>(token);
        setUser(decoded);
      } catch (err) {
        console.error("Invalid token", err);
        setUser(null);
        router.push("/login");
      }
    } else {
      setUser(null);
      router.push("/login");
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user || !token) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?uid=${user.userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch notifications");
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    if (!token) return;

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, isRead: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark as read");
      }

      const updatedNotification = await response.json();
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === updatedNotification.id ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount((prev) => prev - 1); // Decrease unread count
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Load user and fetch notifications on mount
  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  if (!token) {
    return null; // Redirecting to login via router
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 flex items-center">
          <Bell className="h-8 w-8 mr-2 text-blue-600" />
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-600 text-white text-sm font-semibold rounded-full px-2 py-1">
              {unreadCount}
            </span>
          )}
        </h1>

        {notifications.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {notifications
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Newest first
              .map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border ${
                    notification.isRead
                      ? "border-gray-200 dark:border-gray-700"
                      : "border-blue-500"
                  } hover:shadow-lg transition`}
                >
                  <p className="text-gray-900 dark:text-gray-100">{notification.message}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="mt-4 py-1 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-700 dark:text-gray-300">No notifications found.</p>
        )}
      </div>
    </div>
  );
}