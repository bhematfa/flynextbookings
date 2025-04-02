// app/api/bookings/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseAndVerifyToken } from "@/utils/jwt";
/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/

export async function GET(request) {
  try {
    const user = parseAndVerifyToken(request);
    if (!user || user.err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const localBookings = await prisma.booking.findMany({
      where: { userId: user.id },
    });
    if (!localBookings) {
      return NextResponse.json({ error: "No bookings found" }, { status: 404 });
    }
    for (let i = 0; i < localBookings.length; i++) {
      let booking = localBookings[i];
      if (booking.flightBookingId) {
        let flightBooking = await prisma.flightBooking.findUnique({
          where: { id: booking.flightBookingId },
        });
        localBookings[i].flightBooking = flightBooking;
      }
      if (booking.hotelBookingId) {
        let hotelBooking = await prisma.hotelBooking.findUnique({
          where: { id: booking.hotelBookingId },
        });
        localBookings[i].hotelBooking = hotelBooking;
      }
    }

    return NextResponse.json(localBookings);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
