import { NextResponse } from "next/server";
import { parseAndVerifyToken } from "@/utils/jwt";
/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/

export async function POST(request) {
  try {
    const decoded = parseAndVerifyToken(request);
    if (!decoded || decoded.err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { flightId } = body;
    if (!flightId) {
      return NextResponse.json(
        { error: "No flightId provided" },
        { status: 400 }
      );
    }

    const url = new URL(
      `https://advanced-flights-system.replit.app/api/flights/${flightId}`
    );
    const res = await fetch(url, {
      headers: { "x-api-key": process.env.AFS_API_KEY },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "AFS flight not found" },
        { status: 404 }
      );
    }

    const flightData = await res.json();
    return NextResponse.json({
      flightId,
      status: flightData.status,
      flightData,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
