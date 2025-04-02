// app/api/bookings/checkout/route.js
/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseAndVerifyToken } from "@/utils/jwt";
import {
  isAvailable,
  findAvailableIndex,
  setAvailability,
} from "@/utils/availablehelp";

function isCreditCardValid(cardNumber, expiry) {
  if (!cardNumber || !expiry) return false;

  const [mm, yy] = expiry.split("/");
  if (!mm || !yy) return false;
  if (mm.length !== 2 || yy.length !== 2) return false;
  const expYear = parseInt(yy, 10) + 2000;
  const expMonth = parseInt(mm, 10);

  // Luhn algorithm
  const digits = cardNumber.replace(/\D/g, "");
  let sum = 0;
  let doubleNext = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (doubleNext) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleNext = !doubleNext;
  }
  if (sum % 10 !== 0) return false;
  // expiry date check
  if (isNaN(expYear) || isNaN(expMonth) || expMonth < 1 || expMonth > 12)
    return false;
  const now = new Date();
  const expDate = new Date(expYear, expMonth - 1);
  return expDate > now;
}

export async function POST(request) {
  try {
    const user = parseAndVerifyToken(request);
    if (!user || user.err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { origin } = new URL(request.url);
    const notificationsUrl = new URL("/api/notifications", origin);
    const body = await request.json();
    const { bookingId, cardNumber, expiry, nameOnCard } = body;
    if (!bookingId || !cardNumber || !expiry || !nameOnCard) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!isCreditCardValid(cardNumber, expiry)) {
      return NextResponse.json(
        { error: "Invalid card credentials" },
        { status: 400 }
      );
    }

    let booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    console.log(booking);
    if (booking.userId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (booking.flightBookingId) {
      let flightBooking = await prisma.flightBooking.findUnique({
        where: { id: booking.flightBookingId },
      });
      if (!flightBooking) {
        return NextResponse.json(
          { error: "Flight booking not found" },
          { status: 404 }
        );
      }
      if (flightBooking.status !== "PENDING") {
        return NextResponse.json(
          { error: "Flight booking already confirmed" },
          { status: 400 }
        );
      }
      // Update flight booking status to CONFIRMED
      flightBooking = await prisma.flightBooking.update({
        where: { id: flightBooking.id },
        data: { status: "CONFIRMED" },
      });
    }
    // const hotelBooking = await prisma.hotelBooking.update({
    //   where: { bookingId: bookingId },
    //   data: { status: "CONFIRMED" },
    // });

    let hotelBooking;
    let roomType;
    let hotel;
    let finalRoomIndexNumber;
    if (booking.hotelBookingId) {
      hotelBooking = await prisma.hotelBooking.findUnique({
        where: { id: booking.hotelBookingId },
      });
      if (!hotelBooking) {
        return NextResponse.json(
          { error: "Hotel booking not found" },
          { status: 404 }
        );
      }
      finalRoomIndexNumber = hotelBooking.roomIndexNumber;
      roomType = await prisma.roomType.findUnique({
        where: { id: hotelBooking.roomTypeId },
      });
      if (!roomType) {
        return NextResponse.json(
          { error: "Room type not found" },
          { status: 404 }
        );
      }
      hotel = await prisma.hotel.findUnique({
        where: { id: roomType.hotelId },
      });
      if (!hotel) {
        return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
      }
      if (
        !isAvailable(
          roomType.schedule,
          hotelBooking.checkIn,
          hotelBooking.checkOut,
          finalRoomIndexNumber
        )
      ) {
        let firstAvailableIndex = findAvailableIndex(
          roomType.schedule,
          hotelBooking.checkIn,
          hotelBooking.checkOut,
          finalRoomIndexNumber
        );
        if (firstAvailableIndex === -1) {
          return NextResponse.json(
            { error: "No rooms available" },
            { status: 400 }
          );
        }
        finalRoomIndexNumber = firstAvailableIndex;
      }
      const availability = false;
      const newSchedule = setAvailability(
        roomType.schedule,
        hotelBooking.checkIn,
        hotelBooking.checkOut,
        finalRoomIndexNumber,
        availability
      );
      roomType = await prisma.roomType.update({
        where: { id: roomType.id },
        data: { schedule: newSchedule },
      });
      if (!roomType) {
        return NextResponse.json(
          { error: "Room type update error" },
          { status: 404 }
        );
      }

      hotelBooking = await prisma.hotelBooking.update({
        where: { id: booking.hotelBookingId },
        data: {
          status: "CONFIRMED",
          roomIndexNumber: finalRoomIndexNumber,
        },
      });
      if (!hotelBooking) {
        return NextResponse.json(
          { error: "Hotel booking update error" },
          { status: 404 }
        );
      }
      await fetch(notificationsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Your hotel booking (#${hotelBooking.id}) has been confirmed from ${hotelBooking.checkIn} to ${hotelBooking.checkOut} for Room ${finalRoomIndexNumber}.`,
          uid: user.userId,
        }),
      });
      await fetch(notificationsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Your Hotel ${hotel.name} has a new booking (#${hotelBooking.id}) from ${hotelBooking.checkIn} to ${hotelBooking.checkOut} for Room ${finalRoomIndexNumber} made by ${hotelBooking.customerFirstName} ${hotelBooking.customerLastName}.`,
          uid: hotel.ownerId,
        }),
      });
    }

    // if (hotelBooking?.length) {
    //   console.log("Payment validated");
    // }
    booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
    });
    if (booking?.userId) {
      await fetch(notificationsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Your booking (#${bookingId}) has been confirmed.`,
          uid: booking.userId,
        }),
      });
    }
    return NextResponse.json({
      message: "Payment validated. Booking is confirmed.",
      bookingId,
      hotelBookingId: hotelBooking.id,
      flightBookingId: flightBooking.id,
      status: "CONFIRMED",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
