// app/api/booking/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseAndVerifyToken } from "@/utils/jwt";

/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/

export async function GET(request) {
  try {
    const verifiedUser = parseAndVerifyToken(request);
    if (!verifiedUser || verifiedUser.err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // pagination: 5 per page
    const { searchParams } = new URL(request.url);
    let page = parseInt(searchParams.get("page") || "1", 10);
    if (isNaN(page) || page < 1) page = 1;
    const pageSize = 5;

    //ordered newest-first
    const localBookings = await prisma.booking.findMany({
      where: { userId: verifiedUser.userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    });

    if (!localBookings || localBookings.length === 0) {
      return NextResponse.json({ error: "No bookings found" }, { status: 404 });
    }

    const detailedBookings = [];
    for (const booking of localBookings) {
      const bookingData = {
        ...booking,
        flightDetails: null,
        hotelDetails: null,
        roomTypeDetails: null,
      };

      // Flight booking
      if (booking.flightBookingId) {
        const flightBooking = await prisma.flightBooking.findUnique({
          where: { id: booking.flightBookingId },
        });
        bookingData.flightBooking = flightBooking || null;

        if (flightBooking?.reference && bookingData.customerLastName) {
          const aFSurl = new URL(
            `${process.env.AFS_BASE_URL}api/bookings/retrieve`
          );
          aFSurl.searchParams.append(
            "bookingReference",
            flightBooking.reference
          );
          aFSurl.searchParams.append("lastName", bookingData.customerLastName);
          const respAFS = await fetch(aFSurl.toString(), {
            method: "GET",
            headers: { "x-api-key": process.env.AFS_API_KEY },
          });
          if (respAFS.ok) {
            const temp = await respAFS.json();
            bookingData.flightDetails = {
              ticketNumber: temp.ticketNumber,
              flights: temp.flights.map((f) => ({
                flightNumber: f.flightNumber,
                airline: f.airline.name,
                departureCity: f.origin.city,
                departureAirport: f.origin.airport,
                departureCode: f.origin.code,
                departureCountry: f.origin.country,
                departureTime: f.departureTime,
                destinationCity: f.destination.city,
                destinationAirport: f.destination.airport,
                destinationCountry: f.destination.country,
                destinationCode: f.destination.code,
                arrivalTime: f.arrivalTime,
                duration: f.duration,
                price: f.price,
                currency: f.currency,
                status: f.status,
              })),
              status: flightBooking.status,
            };
            // console.log(
            //   "Flight booking details retrieved successfully",
            //   bookingData.flightDetails
            // );
          }
        }
      }

      // Hotel booking
      if (booking.hotelBookingId) {
        const hotelBooking = await prisma.hotelBooking.findUnique({
          where: { id: booking.hotelBookingId },
        });
        bookingData.hotelBooking = hotelBooking || null;

        if (hotelBooking) {
          const roomType = await prisma.roomType.findUnique({
            where: { id: hotelBooking.roomTypeId },
          });
          const hotel = await prisma.hotel.findUnique({
            where: { id: hotelBooking.hotelId },
          });
          if (roomType && hotel) {
            bookingData.roomTypeDetails = {
              roomTypeName: roomType.name,
              roomTypePrice: roomType.pricePerNight,
              roomTypeAmenities: roomType.amenities,
            };
            bookingData.hotelDetails = {
              hotelName: hotel.name,
              hotelAddress: hotel.address,
              hotelStarRating: hotel.starRating,
              hotelLogo: hotel.logo,
              address: hotel.address,
              city: hotel.city,
              location: hotel.location,
            };
          }
        }
      }

      detailedBookings.push(bookingData);
    }

    return NextResponse.json({
      page,
      pageSize,
      results: detailedBookings,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
