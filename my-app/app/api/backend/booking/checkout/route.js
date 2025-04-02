// app/api/bookings/checkout/route.js
/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseAndVerifyToken } from "@/utils/jwt";

function isCreditCardValid(cardNumber, expiry) {
  if (!cardNumber || !expiry) return false;
  const [mm, yy] = expiry.split("/");
  const expYear = parseInt(yy, 10) + 2000;
  const expMonth = parseInt(mm, 10);
  const now = new Date();
  const expDate = new Date(expYear, expMonth);
  const cardNumberStr = cardNumber.replace(/\D/g, "");
  let sum = 0;
  let shouldDouble = false;
  for (let i = cardNumberStr.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumberStr.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  if (sum % 10 !== 0) return false;
  if (isNaN(expYear) || isNaN(expMonth)) return false;
  if (expYear < now.getFullYear() || expMonth < 1 || expMonth > 12) {
    return false;
  }
  if (expYear === now.getFullYear() && expMonth < now.getMonth() + 1) {
    return false;
  }

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
        { error: "Invalid card or expiry date" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
    });
    console.log(booking);
    if (booking.userId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // const hotelBooking = await prisma.hotelBooking.update({
    //   where: { bookingId: bookingId },
    //   data: { status: "CONFIRMED" },
    // });
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
    let hotelBooking;
    if (booking.hotelBookingId) {
      hotelBooking = await prisma.hotelBooking.update({
        where: { id: booking.hotelBookingId },
        data: { status: "CONFIRMED" },
      });
    }

    if (hotelBooking?.length) {
      console.log("Payment validated");
    }

    return NextResponse.json({
      message: "Payment validated. Booking is confirmed.",
      bookingId,
      hotelBookingId: hotelBooking.id,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
