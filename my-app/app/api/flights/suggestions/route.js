// app/api/flights/suggestions/route.js
import { NextResponse } from "next/server";
import { isValidDate } from "@/utils/validations";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const originCity = searchParams.get("origin");
    const destinationCity = searchParams.get("destination");
    const date = searchParams.get("date");
    if (!destinationCity || !originCity || !date) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }
    if (
      typeof destinationCity !== "string" ||
      typeof originCity !== "string" ||
      !isValidDate(date)
    ) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    const url = new URL(`${process.env.AFS_BASE_URL}api/flights`);
    url.searchParams.set("origin", originCity);
    url.searchParams.set("destination", destinationCity);
    url.searchParams.set("date", date);

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
