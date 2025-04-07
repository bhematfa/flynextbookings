import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { parseAndVerifyToken } from "@/utils/jwt.js";


// add room type
export async function POST(request, { params }) {
  try {
    const { hotel_id } = await params; 
    const { name, amenities, pricePerNight, images, totalRooms } = await request.json();

    const userDec = await parseAndVerifyToken(request);

    if (userDec.err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userDec.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "You are not authorized." },
        { status: 401 }
      );
    }

    const hotel = await prisma.hotel.findUnique({
      where: {
        id: id,
      },
    });

    if (hotel.ownerId !== user.id) {
      return NextResponse.json(
        { error: "You are not authorized." },
        { status: 403 }
      );
    }

    if (!hotel) {
      return NextResponse.json(
        { error: "Hotel does not exist." },
        { status: 404 }
      );
    }

    if (!name || !amenities || !pricePerNight || !images || !totalRooms) {
      return NextResponse.json({ error: "Invalid Field" }, { status: 400 });
    }

    //image logic - copilot

    // Decode Base64 and save files locally
    const saveBase64File = (base64String, fileName) => {
      const uploadDir = path.join(process.cwd(), "public", "uploads");

      // Ensure the public/uploads directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, ""); // Remove prefix
      const buffer = Buffer.from(base64Data, "base64");
      fs.writeFileSync(filePath, buffer); // Save file locally

      // Return the relative path to the saved file
      return path.join("uploads", fileName);
    };

    // Save images
    const imagePaths = images.map((image, index) =>
      saveBase64File(image, `room-image-${Date.now()}-${index}.png`)
    );


    const today = new Date();
    const maxDate = new Date(
      today.getFullYear() + 1,
      today.getMonth(),
      today.getDate()
    );

    const schedule = [];

    // Generate availability schedule for 1 year
    for (let i = 0; i < totalRooms; i++) {
      const roomSched = {};
      let currDate = new Date(today);
      while (currDate < maxDate) {
        const dateStr = currDate.toISOString().split("T")[0];
        roomSched[dateStr] = true;
        currDate.setDate(currDate.getDate() + 1);
      }
      schedule.push(roomSched);
    }

    // Create room type in the database
    const room = await prisma.roomType.create({
      data: {
        hotelId: hotel_id,
        name,
        amenities,
        pricePerNight,
        images: imagePaths, // Save paths to the database
        totalRooms,
        schedule,
      },
    });

    return NextResponse.json({ room });
  } catch (error) {
    console.error("Error creating room type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// get room types
export async function GET(request, { params }) {
  try {
    const { hotel_id } = await params;

    const roomTypes = await prisma.roomType.findMany({
      where: {
        hotelId: hotel_id,
      },
    });

    if (!roomTypes) {
      return NextResponse.json(
        { error: "Room Types Does not Exist" },
        { status: 404 }
      );
    }

    return NextResponse.json({ roomTypes });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
