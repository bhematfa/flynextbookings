/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import puppeteer from "puppeteer";
import { parseAndVerifyToken } from "@/utils/jwt";

// Reuse browser instance for better performance
let browserInstance = null;
const getBrowser = async () => {
  if (!browserInstance) {
    console.log("[Puppeteer] Launching browser...");
    console.log(
      "[Puppeteer] Executable path:",
      process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium"
    );
    browserInstance = await puppeteer
      .launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        executablePath:
          process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
        dumpio: true, // Enable browser output for debugging
      })
      .catch((err) => {
        console.error("[Puppeteer] Launch error:", err);
        throw err;
      });
    console.log("[Puppeteer] Browser launched successfully");
  }
  return browserInstance;
};

// HTML escape function to prevent XSS
const escapeHTML = (str) =>
  str
    ? str.replace(
        /[&<>"']/g,
        (char) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;", // Fixed: Use HTML entity for single quote
          }[char])
      )
    : "";

// Export the POST handler
export async function POST(request) {
  try {
    const queryparams = new URL(request.url).searchParams; // Fixed: Declare queryparams
    const bookingId = queryparams.get("bookingId"); // Extract bookingId from URL params
    const body = await request.json();
    const { hotelBookingId, flightBookingId } = body;

    console.log(
      `[Invoice] Starting invoice generation for bookingId: ${bookingId}`
    );
    console.log(`[Invoice] Request body:`, body);

    // Authentication
    console.log("[Invoice] Verifying token...");
    const user = parseAndVerifyToken(request);
    if (!user || user.err) {
      console.error("[Invoice] Authentication failed:", user?.err);
      return NextResponse.json(
        { error: "Unauthorized", details: user?.err },
        { status: 401 }
      );
    }
    console.log("[Invoice] User authenticated:", user.userId);

    // Fetch booking
    console.log("[Invoice] Fetching booking...");
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      console.error(`[Invoice] Booking not found: ${bookingId}`);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.userId !== user.userId) {
      console.error(
        `[Invoice] User ${user.userId} not authorized for booking ${bookingId}`
      );
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.log("[Invoice] Booking fetched:", booking.id);

    // Fetch hotel booking
    let hotelBooking = null;
    if (hotelBookingId) {
      console.log("[Invoice] Fetching hotel booking...");
      hotelBooking = await prisma.hotelBooking.findUnique({
        where: { id: hotelBookingId },
      });
      if (!hotelBooking) {
        console.error(`[Invoice] Hotel booking not found: ${hotelBookingId}`);
        return NextResponse.json(
          { error: "Hotel booking not found" },
          { status: 404 }
        );
      }
      console.log("[Invoice] Hotel booking fetched:", hotelBooking.id);
    }

    // Fetch flight booking
    let flightBooking = null;
    if (flightBookingId) {
      console.log("[Invoice] Fetching flight booking...");
      flightBooking = await prisma.flightBooking.findUnique({
        where: { id: flightBookingId },
      });
      if (!flightBooking) {
        console.error(`[Invoice] Flight booking not found: ${flightBookingId}`);
        return NextResponse.json(
          { error: "Flight booking not found" },
          { status: 404 }
        );
      }
      console.log("[Invoice] Flight booking fetched:", flightBooking.id);
    }

    // Generate HTML content
    console.log("[Invoice] Generating HTML content...");
    const formatCurrency = (amount) =>
      amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

    let htmlContent = `
      <html>
        <head>
          <title>Invoice ${bookingId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { color: #333; }
            p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <h1>Booking Invoice</h1>
          <p><strong>Booking ID:</strong> ${escapeHTML(booking.id)}</p>
          <p><strong>Status:</strong> ${escapeHTML(booking.status)}</p>
          <p><strong>Customer Last Name:</strong> ${escapeHTML(
            booking.customerLastName
          )}</p>
          <p><strong>Customer Email:</strong> ${escapeHTML(
            booking.customerEmail
          )}</p>
          <p><strong>Booking Date:</strong> ${new Date(
            booking.createdAt
          ).toLocaleDateString()}</p>
    `;

    if (flightBooking) {
      htmlContent += `
        <h2>Flight Booking</h2>
        <p><strong>Flight ID:</strong> ${escapeHTML(flightBooking.id)}</p>
        <p><strong>Status:</strong> ${escapeHTML(flightBooking.status)}</p>
      `;
    }

    if (hotelBooking) {
      htmlContent += `
        <h2>Hotel Booking</h2>
        <p><strong>Hotel ID:</strong> ${escapeHTML(hotelBooking.id)}</p>
        <p><strong>Status:</strong> ${escapeHTML(hotelBooking.status)}</p>
        <p><strong>Check-In:</strong> ${new Date(
          hotelBooking.checkIn
        ).toLocaleDateString()}</p>
        <p><strong>Check-Out:</strong> ${new Date(
          hotelBooking.checkOut
        ).toLocaleDateString()}</p>
        <p><strong>Room Number:</strong> ${escapeHTML(
          String(hotelBooking.roomIndexNumber)
        )}</p>
        <p><strong>Room Price:</strong> ${formatCurrency(
          hotelBooking.totalPrice
        )}</p>
      `;
    }

    if (flightBooking) {
      htmlContent += `
        <h2>Flight Details</h2>
        <p><strong>Flight Reference:</strong> ${escapeHTML(
          flightBooking.reference
        )}</p>
        <p><strong>Price:</strong> ${formatCurrency(flightBooking.price)}</p>
      `;
    }

    htmlContent += `
      <h2><strong>Total Amount:</strong> ${formatCurrency(
        booking.totalPrice
      )}</h2>
    </body></html>
    `;
    console.log("[Invoice] HTML content generated");

    // Generate PDF
    console.log("[Invoice] Generating PDF...");
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: "A4" });
    await page.close();
    console.log("[Invoice] PDF generated successfully");

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${bookingId}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[Invoice] Invoice generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate invoice", details: err.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

process.on("SIGTERM", async () => {
  if (browserInstance) {
    await browserInstance.close();
  }
});
