// app/api/booking/invoice/[bookingId]/route.js

/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import puppeteer from "puppeteer";
import { parseAndVerifyToken } from "@/utils/jwt";

export async function POST(request) {
  try {
    const body = await request.json();
    const user = parseAndVerifyToken(request);
    if (!user || user.err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, hotelBookingId, flightBookingId } = body;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.userId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let hotelBooking = null;
    let flightBooking = null;
    if (hotelBookingId) {
      hotelBooking = await prisma.hotelBooking.findUnique({
        where: { id: hotelBookingId },
      });
      if (!hotelBooking) {
        return NextResponse.json(
          { error: "Hotel booking not found" },
          { status: 404 }
        );
      }
    }
    if (flightBookingId) {
      flightBooking = await prisma.flightBooking.findUnique({
        where: { id: flightBookingId },
      });
      if (!flightBooking) {
        return NextResponse.json(
          { error: "Flight booking not found" },
          { status: 404 }
        );
      }
    }

    let htmlContent = `
      <html>
        <head><title>Invoice ${bookingId}</title></head>
        <body>
          <h1>Booking Invoice</h1>
          <p><strong>Booking ID:</strong> ${booking.id}</p>
          <p><strong>Status:</strong> ${booking.status}</p>
          <p><strong>Customer Last Name:</strong> ${
            booking.customerLastName
          }</p>
          <p><strong>Customer Email:</strong> ${booking.customerEmail}</p>
          <p><strong>Booking Date:</strong> ${new Date(
            booking.createdAt
          ).toLocaleDateString()}</p>
          <!-- Add flight/hotel details as needed -->
        </body>
      </html>
    `;
    if (flightBooking) {
      htmlContent += `
        <h2>Flight Booking</h2>
        <p><strong>Flight ID:</strong> ${flightBooking.id}</p>
        <p><strong>Status:</strong> ${flightBooking.status}</p>
      `;
    }
    if (hotelBooking) {
      htmlContent += `
        <h2>Hotel Booking</h2>
        <p><strong>Hotel ID:</strong> ${hotelBooking.id}</p>
        <p><strong>Status:</strong> ${hotelBooking.status}</p>
        <p><strong>Check-In:</strong> ${new Date(
          hotelBooking.checkIn
        ).toLocaleDateString()}</p>
        <p><strong>Check-Out:</strong> ${new Date(
          hotelBooking.checkOut
        ).toLocaleDateString()}</p>
        <p><strong>Room Number:</strong> ${hotelBooking.roomIndexNumber}</p>
        <p><strong>Room Price:</strong> ${hotelBooking.totalPrice}</p>
      `;
    }
    if (flightBooking) {
      htmlContent += `
        <h2>Flight Details</h2>
        <p><strong>Flight Reference:</strong> ${flightBooking.reference}</p>
        <p><strong>Price:</strong> ${flightBooking.price}</p>
      `;
    }

    htmlContent += `
      <h2><strong>Total Amount:</strong> ${booking.totalPrice}</strong></h2>
    `;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${bookingId}.pdf"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
