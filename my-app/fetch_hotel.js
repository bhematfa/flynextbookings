import { prisma } from "./utils/db.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HOTELS_JSON_PATH = path.join(__dirname, "..", "realistic_hotels_with_rooms.json");

export async function importHotels() {
  try {
    // Check if a default user exists; if not, create one
    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      console.log("No users found in the database. Creating a default user...");
      defaultUser = await prisma.user.create({
        data: {
          id: "user-001",
          email: "default.owner@flynext.com",
          passwordHash: "default-hashed-password", // Placeholder hashed password
          firstName: "Default",
          lastName: "Owner",
          role: "HOTEL_OWNER", // Set role to HOTEL_OWNER since this user owns hotels
        },
      });
      console.log("Created default user:", defaultUser.id);
    }

    const hotelCount = await prisma.hotel.count();
    if (hotelCount === 0) {
      console.log("No hotels found in the database. Importing hotels...");
      const rawData = await fs.readFile(HOTELS_JSON_PATH, "utf-8");
      const hotelData = JSON.parse(rawData);
      for (const hotel of hotelData) {
        await prisma.hotel.create({
          data: {
            id: hotel.id,
            name: hotel.name,
            logo: hotel.logo,
            address: hotel.address,
            city: hotel.city,
            location: hotel.location,
            starRating: hotel.starRating,
            images: hotel.images,
            ownerId: defaultUser.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            roomTypes: {
              create: hotel.roomTypes.map((roomType) => ({
                id: roomType.id,
                name: roomType.name,
                amenities: roomType.amenities,
                pricePerNight: roomType.pricePerNight,
                images: roomType.images,
                totalRooms: roomType.totalRooms,
                schedule: roomType.schedule,
                createdAt: new Date(),
                updatedAt: new Date(),
              })),
            },
          },
        });
        console.log(`Imported hotel: ${hotel.name}`);
      }
      console.log("Hotel import completed successfully.");
    } else {
      console.log("Hotels already exist in the database. Skipping import.");
    }
  } catch (error) {
    console.error("Error importing hotels:", error);
    if (error.code === "ENOENT") {
      console.error(`File not found: ${HOTELS_JSON_PATH}. Please ensure realistic_hotels_with_rooms.json exists in the project root directory.`);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importHotels();