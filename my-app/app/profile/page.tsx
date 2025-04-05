"use client";
/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: string;
}

function blobImageLoader({ src }: { src: string }) {
  return src;
}

interface PictureModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onUpdated: () => void; // callback to refresh after upload
}

function PictureModal({ isOpen, onClose, token, onUpdated }: PictureModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setFile(null);
      setPreviewUrl("");
      return;
    }
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    const localUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(localUrl);
  };

  const handleSaveImage = async () => {
    if (!file) {
      setError("No file selected");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/auth/profilePicture", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error uploading image");
        return;
      }
      onClose();
      onUpdated();
    } catch (err) {
      console.error(err);
      setError("Error uploading file");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          X
        </button>
        <h2 className="text-xl font-semibold mb-4">Edit Profile Picture</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <div className="mb-4">
          <label className="block font-semibold mb-1">Select Image</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>
        {previewUrl && (
          <div className="mb-4 flex justify-center">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
              <Image
                src={previewUrl}
                alt="Preview"
                width={128}
                height={128}
                loader={blobImageLoader}
                unoptimized
                className="object-cover w-32 h-32"
              />
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={handleSaveImage}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Save Image
          </button>
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileImgUrl, setProfileImgUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showPictureModal, setShowPictureModal] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("flynextToken") : null;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchUserProfile().catch((err) => console.error(err));
  }, []);

  async function fetchUserProfile() {
    try {
      setLoading(true);
      setError("");


      const res = await fetch("/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error fetching profile");
        if (res.status === 401) {
          router.push("/login");
        }
        return;
      }
      const userData: UserProfile = data;
      setProfile(userData);
      setFirstName(userData.firstName || "");
      setLastName(userData.lastName || "");
      setPhoneNumber(userData.phoneNumber || "");


      const picRes = await fetch("/api/auth/profilePicture", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (picRes.ok) {
        const blob = await picRes.blob();
        const objUrl = URL.createObjectURL(blob);
        setProfileImgUrl(objUrl);
      } else {
        console.log("No profile pic found");
      }
    } catch (err) {
      console.error(err);
      setError("Server error");
    } finally {
      setLoading(false);
    }
  }

  function refreshProfilePicture() {
    fetchUserProfile();
  }

  function cancelEditing() {
    setIsEditing(false);
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setPhoneNumber(profile.phoneNumber || "");
    }
  }

  async function saveEdits(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!profile) return;

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error updating profile");
        return;
      }

      setProfile(data);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError("Server error");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 dark:bg-gray-900 dark:text-gray-100">
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded shadow p-6">
        {/* Show the profile picture */}
        <div className="flex justify-center mb-4">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
            {profileImgUrl ? (
              <Image
                loader={blobImageLoader}
                unoptimized
                src={profileImgUrl}
                alt="Profile"
                width={128}
                height={128}
                className="object-cover w-32 h-32"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                No image
              </div>
            )}
          </div>
        </div>

        {/* Button to open editor */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setShowPictureModal(true)}
            className="bg-gray-300 dark:bg-gray-700 text-sm px-3 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
          >
            Edit Profile Picture
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={saveEdits}>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Email</label>
              <input
                type="text"
                disabled
                value={profile.email}
                className="w-full border px-3 py-2 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
              />
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border px-3 py-2"
              />
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border px-3 py-2"
              />
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full border px-3 py-2"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="mb-4">
              <p className="font-semibold">Email</p>
              <p>{profile.email}</p>
            </div>
            <div className="mb-4">
              <p className="font-semibold">First Name</p>
              <p>{profile.firstName}</p>
            </div>
            <div className="mb-4">
              <p className="font-semibold">Last Name</p>
              <p>{profile.lastName}</p>
            </div>
            <div className="mb-4">
              <p className="font-semibold">Phone Number</p>
              <p>{profile.phoneNumber || "N/A"}</p>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>

      <PictureModal
        isOpen={showPictureModal}
        onClose={() => setShowPictureModal(false)}
        token={token || ""}
        onUpdated={refreshProfilePicture}
      />
    </div>
  );
}