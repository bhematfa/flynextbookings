import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { parseAndVerifyToken } from "../../../../../utils/jwt.js";

// As a hotel owner, I want to view room availability for specific date ranges.

export function findAvailability(schedule, checkIn, checkOut) {
  const inDate = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
  const outDate = typeof checkOut === "string" ? new Date(checkOut) : checkOut;

  // Number of nights
  const numDays = Math.round((outDate - inDate) / (1000 * 60 * 60 * 24));
  if (numDays <= 0) return 0;

  let numAvailable = 0;

  for (const roomSched of schedule) {
    let isRoomFree = true;
    const tempDate = new Date(inDate);
    for (let i = 0; i < numDays; i++) {
      const dateStr = tempDate.toISOString().split("T")[0];
      if (!roomSched[dateStr]) {
        isRoomFree = false;
        break;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    if (isRoomFree) {
      numAvailable++;
    }
  }
  return numAvailable;
}

export function findAvailableIndex(schedule, checkIn, checkOut) {
  const inDate = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
  const outDate = typeof checkOut === "string" ? new Date(checkOut) : checkOut;

  // Number of nights
  const numDays = Math.round((outDate - inDate) / (1000 * 60 * 60 * 24));
  if (numDays <= 0) return 0;

  let unavailable = -1;
  let count = 0;

  for (const roomSched of schedule) {
    let isRoomFree = true;
    const tempDate = new Date(inDate);
    for (let i = 0; i < numDays; i++) {
      const dateStr = tempDate.toISOString().split("T")[0];
      if (!roomSched[dateStr]) {
        isRoomFree = false;
        break;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    if (isRoomFree) {
      return count;
    }
    count++;
  }
  return unavailable;
}

// copilot lines 66-101
export function isAvailable(schedule, checkIn, checkOut, roomIndex) {
  const inDate = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
  const outDate = typeof checkOut === "string" ? new Date(checkOut) : checkOut;

  // Number of nights
  const numDays = Math.round((outDate - inDate) / (1000 * 60 * 60 * 24));
  if (numDays <= 0) return false;

  let isRoomFree = true;
  const tempDate = new Date(inDate);
  for (let i = 0; i < numDays; i++) {
    const dateStr = tempDate.toISOString().split("T")[0];
    if (!schedule[roomIndex][dateStr]) {
      isRoomFree = false;
      break;
    }
    tempDate.setDate(tempDate.getDate() + 1);
  }
  return isRoomFree;
}

export function setAvailability(
  schedule,
  checkIn,
  checkOut,
  roomIndex,
  availability
) {
  const inDate = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
  const outDate = typeof checkOut === "string" ? new Date(checkOut) : checkOut;

  // Number of nights
  const numDays = Math.round((outDate - inDate) / (1000 * 60 * 60 * 24));
  if (numDays <= 0) return false;

  const tempDate = new Date(inDate);
  for (let i = 0; i < numDays; i++) {
    const dateStr = tempDate.toISOString().split("T")[0];
    schedule[roomIndex][dateStr] = availability;
    tempDate.setDate(tempDate.getDate() + 1);
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Invalid Field" }, { status: 400 });
    }

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

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json(
        { error: "Invalid date range." },
        { status: 400 }
      );
    }

    // GPT Lines 55-78
    // Fetch all room types in the hotel
    const roomTypes = await prisma.roomType.findMany({
      where: { hotelId: id },
    });

    // Fetch bookings that overlap with the requested date range
    const bookedRooms = await prisma.hotelBooking.findMany({
      where: {
        hotelId: id,
        OR: [
          {
            checkIn: { lt: end },
            checkOut: { gt: start },
          },
        ],
      },
      select: { roomTypeId: true },
    });

    // Get roomType IDs that are booked
    const bookedRoomTypeIds = bookedRooms.map((booking) => booking.roomTypeId);

    // Filter available room types
    const availableRooms = roomTypes.filter(
      (room) => !bookedRoomTypeIds.includes(room.id)
    );

    if (availableRooms.length === 0) {
      return NextResponse.json(
        { message: "No Rooms Available." },
        { status: 404 }
      );
    }

    return NextResponse.json({ availableRooms });
  } catch (error) {
    console.log(error.stack);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
