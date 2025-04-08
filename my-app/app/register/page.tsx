"use client";
/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: ""
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      // Registration successful, now route to login
      router.push("/login");
    } catch (err) {
      console.error(err);
      setError("Server error");
    }
  };

return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 text-black dark:text-gray-100">
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-md p-6 rounded shadow bg-white dark:bg-gray-800"
        >
            <h1 className="text-2xl font-bold mb-4">Register</h1>

            {error && (
                <div className="bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 p-2 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="mb-4">
                <label className="block font-semibold mb-1">Email</label>
                <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                    required
                />
            </div>

            <div className="mb-4">
                <label className="block font-semibold mb-1">Password</label>
                <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                    required
                />
            </div>

            <div className="mb-4">
                <label className="block font-semibold mb-1">First Name</label>
                <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                    required
                />
            </div>

            <div className="mb-4">
                <label className="block font-semibold mb-1">Last Name</label>
                <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                    required
                />
            </div>

            <div className="mb-4">
                <label className="block font-semibold mb-1">Phone Number</label>
                <input
                    type="text"
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Optional"
                />
            </div>

            <button
                type="submit"
                className="bg-blue-600 dark:bg-blue-700 text-white font-semibold px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800"
            >
                Register
            </button>
        </form>
    </div>
);
}