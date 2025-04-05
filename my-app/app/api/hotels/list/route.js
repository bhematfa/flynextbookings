import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { parseAndVerifyToken } from "@/utils/jwt.js";

export async function GET(request) {
  try {
    const userDec = await parseAndVerifyToken(request);

    const user = await prisma.user.findUnique({
      where: { id: userDec.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hotels = await prisma.hotel.findMany({
      where: {
        ownerId: userDec.userId,
      },
    });

    return NextResponse.json(hotels);
  } catch (error) {
    console.log(error.stack);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
