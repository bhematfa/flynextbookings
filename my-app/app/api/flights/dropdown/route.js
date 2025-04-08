import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    // Fetch matching cities
    const cities = await prisma.city.findMany({
      where: {
        city: { startsWith: query, mode: "insensitive" },
      },
      select: { id: true, city: true, country: true },
      take: 5, // Limit results
    });

    // Fetch matching airports
    const airports = await prisma.airport.findMany({
      where: {
        OR: [
          { name: { startsWith: query, mode: "insensitive" } },
          { code: { startsWith: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, code: true },
      take: 5, // Limit results
    });

    // Combine results
    const suggestions = [
      ...cities.map((city) => ({
        id: city.id,
        name: `${city.city}, ${city.country}`,
        value: city.city,
        type: "city",
      })),
      ...airports.map((airport) => ({
        id: airport.id,
        name: `${airport.name} (${airport.code})`,
        value: airport.code,
        type: "airport",
      })),
    ];

    return NextResponse.json(suggestions);
  } catch (err) {
    console.error("Error fetching location suggestions:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}