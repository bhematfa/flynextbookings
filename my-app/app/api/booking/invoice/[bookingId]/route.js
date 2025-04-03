// app/api/bookings/invoice/[bookingId]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import PDFDocument from "pdfkit";
import { Readable } from "stream";
import { parseAndVerifyToken } from "@/utils/jwt";
/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/

export async function POST(request) {
  try {
    const body = await request.json();
    const user = parseAndVerifyToken(request);
    if (!user || user.err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, hotelBookingId, flightBookingId } = body;
    console.log(bookingId);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    console.log(booking);
    if (booking.userId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let hotelBooking;
    let hotel;
    let flightBooking;
    if (hotelBookingId) {
      hotelBooking = await prisma.hotelBooking.findUnique({
        where: { id: hotelBookingId },
      });
      console.log(hotelBooking);
      if (!hotelBooking) {
        return NextResponse.json(
          { error: "Invalid HotelBooking ID" },
          { status: 400 }
        );
      }
      hotel = await prisma.booking.findUnique({
        where: { id: hotelBooking.hotelId },
      });
    }

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (flightBookingId) {
      flightBooking = await prisma.flightBooking.findUnique({
        where: { id: flightBookingId },
      });
    }

    const doc = new PDFDocument({ margin: 50 });
    let chunks = [];
    const stream = doc.pipe(new Readable({ read() {} }));
    stream.on("data", (chunk) => chunks.push(chunk));

    // Header
    doc.fontSize(20).text("Booking Invoice", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Booking ID: ${booking.id}`);
    doc.text(`Name: ${booking.firstName} ${booking.lastName}`);
    doc.text(`Email: ${booking.email}`);
    doc.text(`Status: ${booking.status}`);
    doc.moveDown();

    if (flightBooking) {
      doc.text("Flight Bookings:");
      doc.text(`- Reference Number: ${flightBooking.reference}`);
      doc.text(`  Total: $${flightBooking.totalPrice}`);
      doc.moveDown();
    }
    if (hotelBooking) {
      doc.text("Hotel Bookings:");
      doc.text(`- Hotel: ${hotel.name}, City: ${hotel.location}`);
      doc.text(
        `  CheckIn: ${hotelBooking.checkIn}, CheckOut: ${hotelBooking.checkOut}`
      );
      doc.text(`  Total: $${hotelBooking.totalPrice}`);
      doc.moveDown();
    }

    doc.end();

    return new Promise((resolve) => {
      stream.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(
          new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="invoice-${bookingId}.pdf"`,
            },
          })
        );
      });
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
