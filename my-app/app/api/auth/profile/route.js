// app/api/auth/profile/route.js
/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/

// app/api/profile/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseAndVerifyToken } from "@/utils/jwt";

export async function GET(request) {
  const decoded = await parseAndVerifyToken(request);
  if (!decoded || !decoded.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        profilePicture: false,
        role: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (err) {
    console.error("Profile GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const decoded = await parseAndVerifyToken(request);
  if (!decoded || !decoded.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { firstName, lastName, phoneNumber } = body;

    // validations
    if (firstName && typeof firstName !== "string") {
      return NextResponse.json({ error: "Invalid firstName" }, { status: 400 });
    }
    if (lastName && typeof lastName !== "string") {
      return NextResponse.json({ error: "Invalid lastName" }, { status: 400 });
    }
    if (phoneNumber && typeof phoneNumber !== "string") {
      return NextResponse.json(
        { error: "Invalid phoneNumber" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phoneNumber: phoneNumber || undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (err) {
    console.error("Profile PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
