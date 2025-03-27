// app/api/flights/suggestions/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const date = searchParams.get("date");
    if (!city) {
      return NextResponse.json(
        { error: "Missing city param" },
        { status: 400 }
      );
    }

    const url = new URL(`${process.env.AFS_BASE_URL}api/flights`);
    url.searchParams.set("destination", city);
    if (date) {
      url.searchParams.set("date", date);
    }

    const res = await fetch(url, {
      headers: { "x-api-key": process.env.AFS_API_KEY },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "AFS error" }, { status: 500 });
    }
    const data = await res.json();

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
