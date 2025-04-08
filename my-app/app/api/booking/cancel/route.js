// app/api/bookings/cancel/route.js
/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseAndVerifyToken } from "@/utils/jwt";
import { setAvailability } from "@/utils/availablehelp";

async function cancelAFSFlight(bookingReference, lastName) {
  const url = "https://advanced-flights-system.replit.app/api/bookings/cancel";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.AFS_API_KEY,
    },
    body: JSON.stringify({
      bookingReference,
      lastName,
    }),
  });
  if (res.status == 400) {
    return res.json();
  }
  if (!res.ok) {
    console.log("AFS fetch not OK, body:", await res.text());
    return null;
  }
  return res.json();
}

export async function POST(request) {
  try {
    const { origin } = new URL(request.url);
    const notificationsUrl = new URL("/api/notifications", origin);
    const user = parseAndVerifyToken(request);
    if (!user || user.err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("role: ", user.role);
    if (user.role !== "USER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const { bookingId, flightBookingId, hotelBookingId } = body;
    if (!bookingId) {
      return NextResponse.json(
        { error: "You need to provide a Booking ID" },
        { status: 400 }
      );
    }
    if (!hotelBookingId && !flightBookingId) {
      let booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });
      if (!booking) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );
      }
      if (booking.status === "CANCELLED") {
        return NextResponse.json(
          { error: "Booking already cancelled" },
          { status: 400 }
        );
      }
      if (booking.userId !== user.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      booking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      });
      if (!booking) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );
      }
      if (user.userId) {
        const notifyRes = await fetch(notificationsUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Your booking # ${bookingId} has been cancelled.`,
            uid: user.userId,
          }),
        });
        if (!notifyRes || notifyRes.error) {
          return NextResponse.json({ error: notifyRes.error }, { status: 404 });
        }
      }
      return NextResponse.json({
        message: "Booking cancelled",
        booking,
      });
    }
    const requester = await prisma.user.findUnique({
      where: { id: user.userId },
    });
    if (!requester) {
      return NextResponse.json({ error: "Wrong user" }, { status: 404 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    console.log(booking);
    if (booking.userId !== user.userId) {
      console.log("booker: ", booking.userId);
      console.log("user: ", user.userId);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let flightCancelRes = null;
    let flightBooking;
    if (flightBookingId) {
      flightBooking = await prisma.flightBooking.findUnique({
        where: { id: flightBookingId },
      });

      console.log("trying to cancel flight");
      flightCancelRes = await cancelAFSFlight(
        flightBooking.reference,
        requester.lastName
      );
      if (flightCancelRes?.error) {
        let aFSmessage = flightCancelRes.error;
        return NextResponse.json({ message: aFSmessage }, { status: 400 });
      }
      if (!flightCancelRes) {
        return NextResponse.json(
          { error: "AFS Cancellation Error" },
          { status: 500 }
        );
      }
      let internalFlightBooking = await prisma.flightBooking.update({
        where: { id: flightBookingId },
        data: { status: "CANCELLED" },
      });
      if (user.userId) {
        const notifyRes = await fetch(notificationsUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Your Flight room booking has been cancelled.`,
            uid: user.userId,
          }),
        });
        if (!notifyRes || notifyRes.error) {
          return NextResponse.json({ error: notifyRes.error }, { status: 404 });
        }
      }
      if (!internalFlightBooking) {
        return NextResponse.json(
          { error: "Flight Booking not found" },
          { status: 404 }
        );
      }
      if (!hotelBookingId) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "CANCELLED" },
        });
      }
    }

    let hotelCancelRes = null;
    if (hotelBookingId) {
      hotelCancelRes = await prisma.hotelBooking.update({
        where: { id: hotelBookingId },
        data: { status: "CANCELLED" },
      });
      if (!hotelCancelRes) {
        return NextResponse.json(
          { error: "Hotel Booking not found" },
          { status: 404 }
        );
      }
      if (booking.status === "CONFIRMED") {
        let roomType = await prisma.roomType.findUnique({
          where: { id: hotelCancelRes.roomTypeId },
        });
        const hotel = await prisma.hotel.findUnique({
          where: { id: hotelCancelRes.hotelId },
        });
        if (!roomType || !hotel) {
          return NextResponse.json(
            { error: "Room type or hotel not found" },
            { status: 404 }
          );
        }
        let newSchedule = await setAvailability(
          roomType.schedule,
          hotelCancelRes.checkIn,
          hotelCancelRes.checkOut,
          hotelCancelRes.roomIndexNumber,
          true
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
        if (hotel.ownerId) {
          const notifyRes = await fetch(notificationsUrl.toString(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: `Hotel room booking # ${hotelBookingId} for room ${hotelCancelRes.roomIndexNumber} from ${hotelCancelRes.checkIn} to ${hotelCancelRes.checkOut} has been cancelled.`,
              uid: hotel.ownerId,
            }),
          });
          if (!notifyRes || notifyRes.error) {
            return NextResponse.json(
              { error: notifyRes.error },
              { status: 404 }
            );
          }
        }
      }
      if (user.userId) {
        const notifyRes = await fetch(notificationsUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Your Hotel room booking # ${hotelBookingId} has been cancelled.`,
            uid: user.userId,
          }),
        });
        if (!notifyRes || notifyRes.error) {
          return NextResponse.json({ error: notifyRes.error }, { status: 404 });
        }
      }
      if (!flightBookingId) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "CANCELLED" },
        });
      }
    }

    // overall booking cancellation
    if (flightBookingId && hotelBookingId) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED" },
      });
      if (user.userId) {
        const notifyRes = await fetch(notificationsUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Your booking # ${booking.id} has been completely cancelled.`,
            uid: user.userId,
          }),
        });
        if (!notifyRes || notifyRes.error) {
          return NextResponse.json({ error: notifyRes.error }, { status: 404 });
        }
      }
    }

    return NextResponse.json({
      message: "Cancellation processed",
      flightCancel: flightCancelRes,
      hotelCancel: hotelCancelRes,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
