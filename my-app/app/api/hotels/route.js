import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { parseAndVerifyToken } from "@/utils/jwt.js";
import { findAvailability } from "../../../utils/availablehelp.js";

//create hotel
export async function POST(request) {
  try {
    const { name, logo, address, location, city, starRating, images } =
      await request.json();

    const userDec = await parseAndVerifyToken(request);

    if (userDec.err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userDec.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!name || !logo || !address || !location || !city || !starRating) {
      return NextResponse.json({ error: "Invalid Field" }, { status: 400 });
    }

    // Decode Base64 and save files locally
    const saveBase64File = (base64String, fileName) => {
      const uploadDir = path.join(process.cwd(), "public/uploads"); // Save files in 'public/uploads'

      // Ensure the uploads directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName); // Complete path for saving file
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, ""); // Remove prefix
      const buffer = Buffer.from(base64Data, "base64");
      fs.writeFileSync(filePath, buffer); // Save file locally

      // Return only the relative path (e.g., 'uploads/logo-<timestamp>.png')
      return path.join("uploads", fileName); // Reference as 'public/uploads'
    };

    const logoPath = saveBase64File(logo, `logo-${Date.now()}.png`); // Save logo file
    const imagePaths = images.map((image, index) =>
      saveBase64File(image, `image-${Date.now()}-${index}.png`)
    ); // Save all image files

    const hotel = await prisma.hotel.create({
      data: {
        name,
        logo: logoPath,
        address,
        location,
        city,
        starRating: parseInt(starRating, 10),
        images: imagePaths,
        owner: {
          connect: {
            id: userDec.userId,
          },
        },
      },
    });

    return NextResponse.json({ hotel });
  } catch (error) {
    console.error("Error:", error.stack);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

//As a visitor, I want to search for hotels by check-in date, check-out date, and city.
//I also want to filter them by name, star-rating, and price range.
//Search results should display in a list that shows the hotel information,
//starting price, and a location pinpoint on a map. The results should only reflect available rooms.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const city = searchParams.get("city");
    const name = searchParams.get("name");
    const starRating = parseInt(searchParams.get("starRating"), 10);
    const priceRange = searchParams.get("priceRange")?.split("-");

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    if (
      !startDate ||
      !endDate ||
      !city ||
      !name ||
      !starRating ||
      !priceRange
    ) {
      return NextResponse.json({ error: "Invalid Field" }, { status: 400 });
    }

    const whereClause = {
      ...(city && { city }),
      ...(name && { name }),
      ...(starRating && { starRating }),
    };

    // Query initial hotel and roomType data
    const result = await prisma.hotel.findMany({
      where: whereClause,
      include: {
        roomTypes: true,
      },
    });

    // Filter hotels by room availability and price
    const availableHotels = result.filter((hotel) => {
      // Check if the hotel has any room types that match the criteria
      const hasAvailableRoom = hotel.roomTypes.some((roomType) => {
        const isAvailable =
          findAvailability(roomType.schedule, checkIn, checkOut) > 0;
        const isInPriceRange =
          roomType.pricePerNight >= parseFloat(priceRange[0]) &&
          roomType.pricePerNight <= parseFloat(priceRange[1]);
        return isAvailable && isInPriceRange;
      });

      return hasAvailableRoom;
    });

    return NextResponse.json({ availableHotels });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
