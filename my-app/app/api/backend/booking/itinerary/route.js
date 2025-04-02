// filepath: /app/api/booking/itinerary/route.js

/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseAndVerifyToken } from "@/utils/jwt";
import { isValidDate } from "@/utils/validations";
import { findAvailableIndex } from "@utils/availablehelp";

async function bookAFSFlight(
  firstName,
  lastName,
  email,
  flightIds,
  passportNumber
) {
  const url = "https://advanced-flights-system.replit.app/api/bookings";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": process.env.AFS_API_KEY,
    },
    body: JSON.stringify({
      email,
      firstName,
      flightIds,
      lastName,
      passportNumber,
    }),
  });
  console.log("AFS fetch status:", res.status);
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
  let hotelBooking = null;
  let flightBooking = null;
  let flightBookingId = null;
  let hotelBookingId = null;
  let totalBookingPrice = 0;
  try {
    const body = await request.json();
    const { origin } = new URL(request.url);
    const notificationsUrl = new URL("/api/notifications", origin);
    const verifiedUser = parseAndVerifyToken(request);
    if (!verifiedUser || verifiedUser.err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(verifiedUser);
    const userId = verifiedUser.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    });
    console.log(user);

    if (!user) {
      return NextResponse.json({ error: "No User Found" }, { status: 401 });
    }
    console.log(user);
    const {
      flightIds = [],
      passportNumber,
      hotelId,
      roomTypeId,
      checkIn,
      checkOut,
    } = body;
    if (
      (!flightIds || flightIds.length === 0) &&
      !passportNumber &&
      !hotelId &&
      !roomTypeId &&
      !checkIn &&
      !checkOut
    ) {
      return NextResponse.json(
        { message: "Please provide the required parameters" },
        { status: 400 }
      );
    }
    console.log(flightIds);
    console.log("passport #", passportNumber);
    //console.log("room-type: ", roomTypeId);

    let newBooking = await prisma.booking.create({
      data: {
        userId: userId,
        status: "PENDING",
      },
    });
    console.log("generic booking: ", newBooking);

    if (flightIds.length > 0 && passportNumber) {
      const flightAFSBookRes = await bookAFSFlight(
        user.firstName,
        user.lastName,
        user.email,
        flightIds,
        passportNumber
      );
      if (flightAFSBookRes?.error) {
        let aFSmessage = flightAFSBookRes.error;
        return NextResponse.json({ message: aFSmessage }, { status: 400 });
      }
      if (!flightAFSBookRes) {
        return NextResponse.json(
          { error: "AFS Booking Error" },
          { status: 500 }
        );
      }

      console.log("AFS booking: ", flightAFSBookRes);

      const totalFlightPrice = flightAFSBookRes.flights.reduce(
        (acc, f) => acc + f.price,
        0
      );
      totalBookingPrice += parseInt(totalFlightPrice, 10);
      console.log("total price: ", typeof totalFlightPrice);
      console.log(" ref: ", flightAFSBookRes.bookingReference);
      console.log(" Booking ID: ", newBooking.id);
      console.log(" status: ", flightAFSBookRes.status);
      const AFSflightId = flightAFSBookRes.flights[0].id;
      try {
        flightBooking = await prisma.flightBooking.create({
          data: {
            bookingId: newBooking.id,
            reference: flightAFSBookRes.bookingReference,
            status: "PENDING", //flightAFSBookRes.status,
            price: totalFlightPrice,
            flightId: AFSflightId,
          },
          //  select: {
          //   id: true,
          //   reference: true,
          //   bookingId: true,
          //   status: true,
          //   price: true,
          // },
        });
      } catch (err) {
        console.log("Prisma error: ", err);
      }
      console.log("FLIGHT BOOKING: ", flightBooking);
      flightBookingId = flightBooking.id;
      // if (!roomTypeId) {
      //   newBooking = await prisma.booking.update({
      //     where: { id: newBooking.id },
      //     data: { status: "PENDING" },
      //   });
      // }
      const notifyRes = await fetch(notificationsUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Your flight booking ref (#${flightBooking.reference}) has been Requested.`,
          uid: newBooking.userId,
        }),
      });
      if (!notifyRes || notifyRes.error) {
        return NextResponse.json({ error: notifyRes.error }, { status: 404 });
      }
    }

    // HotelBooking

    if (roomTypeId && checkIn && checkOut && hotelId) {
      if (!isValidDate(checkIn) || !isValidDate(checkOut)) {
        return NextResponse.json({ error: "Invalid Date" }, { status: 400 });
      }
      const roomType = await prisma.roomType.findUnique({
        where: { id: roomTypeId },
      });

      if (!roomType) {
        return NextResponse.json(
          { error: "Invalid roomType" },
          { status: 400 }
        );
      }

      if (!roomType.schedule || !roomType.totalRooms) {
        return NextResponse.json(
          { error: "No rooms available" },
          { status: 400 }
        );
      }
      // FIND AVAILABILITY

      const availableIndex = findAvailableIndex(
        roomType.schedule,
        checkIn,
        checkOut
      );
      if (availableIndex === -1) {
        return NextResponse.json(
          { error: "No rooms available" },
          { status: 400 }
        );
      }

      const hotel = await prisma.hotel.findUnique({
        where: { id: hotelId },
      });
      if (!hotel) {
        return NextResponse.json({ error: "Invalid Hotel" }, { status: 400 });
      }

      const nights = Math.max(
        1,
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const totalHotelPrice = roomType.pricePerNight.mul(nights);

      hotelBooking = await prisma.hotelBooking.create({
        data: {
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          status: "PENDING",
          totalPrice: totalHotelPrice,
          hotelId: hotelId,
          bookingId: newBooking.id,
          roomTypeId: roomTypeId,
          roomIndexNumber: availableIndex,
        },
      });
      if (!hotelBooking) {
        return NextResponse.json(
          { error: "Hotel booking failed" },
          { status: 500 }
        );
      }
      hotelBookingId = hotelBooking.id;
      let ownerId = hotel.ownerId;
      totalBookingPrice += parseInt(totalHotelPrice, 10);
      if (ownerId) {
        const notifyRes = await fetch(notificationsUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Your Hotel room ${roomType.name} at ${hotel.name} has a new booking request.`,
            uid: ownerId,
          }),
        });
        if (!notifyRes || notifyRes.error) {
          return NextResponse.json({ error: notifyRes.error }, { status: 404 });
        }
      }
      if (userId) {
        const notifyRes = await fetch(notificationsUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Your Hotel room ${roomType.name} at ${hotel.name} booking has been requested.`,
            uid: userId,
          }),
        });
        if (!notifyRes || notifyRes.error) {
          return NextResponse.json({ error: notifyRes.error }, { status: 404 });
        }
      }
    }
    newBooking = await prisma.booking.update({
      where: { id: newBooking.id },
      data: {
        totalPrice: totalBookingPrice,
        flightBookingId: flightBookingId,
        hotelBookingId: hotelBookingId,
        flightBookings: flightBooking,
        hotelBookings: hotelBooking,
      },
    });

    return NextResponse.json({
      message: "Booking itinerary created successfully",
      booking: newBooking,
      hotelBooking: hotelBooking,
      flightBooking: flightBooking,
      flightBookingId: flightBookingId,
      hotelBookingId: hotelBookingId,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
