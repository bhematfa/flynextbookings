import prisma from "@/lib/prisma";
import { findAvailability } from "../../../../utils/availablehelp.js";
import { NextResponse } from "next/server";
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const arrivalInCity = searchParams.get("arrivalInCity");
    const departureFromCity = searchParams.get("departureFromCity");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    if (!city || !arrivalInCity || !departureFromCity) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const hotels = await prisma.hotel.findMany({
      where: { city },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { roomTypes: true },
    });

    const suggestions = hotels
      .map((hotel) => {
        const availableRoomTypes = hotel.roomTypes
          .map((roomType) => {
            const availability = findAvailability(
              roomType.schedule,
              arrivalInCity,
              departureFromCity
            );
            if (availability > 1) {
              return {
                id: roomType.id,
                name: roomType.name,
                amenities: roomType.amenities,
                pricePerNight: roomType.pricePerNight,
                images: roomType.images,
                availability,
              };
            }
            return null;
          })
          .filter(Boolean);

        if (availableRoomTypes.length > 0) {
          return {
            id: hotel.id,
            name: hotel.name,
            address: hotel.address,
            city: hotel.city,
            starRating: hotel.starRating,
            images: hotel.images,
            roomTypes: availableRoomTypes,
          };
        }
        return null;
      })
      .filter(Boolean);

    return NextResponse.json(
      { suggestions },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
