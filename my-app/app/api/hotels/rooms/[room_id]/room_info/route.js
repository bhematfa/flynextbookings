import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { parseAndVerifyToken } from "@/utils/jwt.js";

export async function GET(request, { params }) {
  try {
    const { room_id } = await params;

    const userDec = await parseAndVerifyToken(request);

    if (userDec.err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userDec.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "You are not authorized." },
        { status: 401 }
      );
    }

    const room = await prisma.roomType.findUnique({
      where: { id: room_id },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room Does not Exist" },
        { status: 404 }
      );
    }

    const hotel = await prisma.hotel.findUnique({
      where: {
        id: room.hotelId,
      },
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found." }, { status: 404 });
    }

    if (hotel.ownerId !== user.id) {
      return NextResponse.json(
        { error: "You are not authorized." },
        { status: 403 }
      );
    }

    return NextResponse.json(room);
  } catch (error) {
    console.log(error.stack);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
