import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { parseAndVerifyToken } from "../../../../../utils/jwt.js";
import axios from "axios";
import { setAvailability } from "@/utils/availablehelp.js";

// As a hotel owner, I want to view and filter my hotel’s booking list by date and/or room type.
export async function GET(request, { params }) {
  try {
    const { hotel_id } = await params;
    const id = hotel_id;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const roomTypeName = searchParams.get("roomType");

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

    let roomTypeId = null;
    if (roomTypeName) {
      const roomType = await prisma.roomType.findFirst({
        where: { name: roomTypeName },
      });

      if (!roomType) {
        return NextResponse.json(
          { message: `Room type '${roomTypeName}' does not exist.` },
          { status: 404 }
        );
      }

      roomTypeId = roomType.id;
    }

    const bookingFilter = {
      hotelId: id,
    };

    if (date !== null) {
      const targetDate = new Date(date);
      bookingFilter.checkIn = { lte: targetDate };
      bookingFilter.checkOut = { gte: targetDate };
    }

    if (roomTypeId !== null) {
      bookingFilter.roomTypeId = roomTypeId;
    }

    const hotelBookings = await prisma.hotelBooking.findMany({
      where: bookingFilter,
      include: {
        roomType: true, // Include the roomType relation
      },
    });

    // Add roomType name to the result for each booking
    const formattedBookings = hotelBookings.map((booking) => ({
      ...booking,
      roomTypeName: booking.roomType?.name || "N/A", // Include roomType name
    }));

    return NextResponse.json({ hotelBookings: formattedBookings });
    

  } catch (error) {
    console.log(error.stack);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// As a hotel owner, I want to cancel a hotel reservation.
export async function PATCH(request, { params }) {
  try {
    const { bookingId } = await request.json();

    const { hotel_id } = await params;

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
        id: hotel_id,
      },
    });

    if (hotel.ownerId !== user.id) {
      return NextResponse.json(
        { error: "You are not authorized." },
        { status: 403 }
      );
    }

    const booking = await prisma.hotelBooking.findUnique({
      where: {
        id: bookingId,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    await prisma.hotelBooking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED" },
    });

    const room = await prisma.roomType.findUnique({
      where: { id: booking.roomTypeId },
    });

    setAvailability(room.schedule, booking.checkIn, booking.checkOut, booking.roomIndexNumber, true);

    const { origin } = new URL(request.url);
    const notificationsUrl = new URL("/api/notifications", origin);
    await axios.post(notificationsUrl.toString(), {
      message: "Your Booking is Cancelled",
      uid: user.id,
    });

    return NextResponse.json(
      { message: "The Booking has been Cancelled." },
      { status: 200 }
    );

  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
