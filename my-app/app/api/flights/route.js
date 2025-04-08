import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();
const AFS_BASE_URL = "https://advanced-flights-system.replit.app/api/flights?";
const API_KEY = process.env.AFS_API_KEY;

// Checks if a given date is valid (unchanged)
const isValidDate = (date) => {
  if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) return false;

  const [year, month, day] = date.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() + 1 === month &&
    parsedDate.getDate() === day
  );
};

// Checks if a location is valid against the database
const isValidLocation = async (location) => {
  location = location.toLowerCase();

  // Check if it matches a city
  const city = await prisma.city.findFirst({
    where: { city: { equals: location, mode: "insensitive" } },
  });
  if (city) return true;

  // Check if it matches an airport by code or name
  const airport = await prisma.airport.findFirst({
    where: {
      OR: [
        { code: { equals: location, mode: "insensitive" } },
        { name: { equals: location, mode: "insensitive" } },
      ],
    },
  });
  return !!airport;
};

// POST handler
export async function POST(request) {
  try {
    const body = await request.json();
    const { origin, destination, date, type } = body;

    // Ensure all required fields are provided and valid
    if (
      !origin ||
      typeof origin !== "string" ||
      !destination ||
      typeof destination !== "string" ||
      !date ||
      !Array.isArray(date) ||
      !date.every(isValidDate) ||
      !type ||
      typeof type !== "string" ||
      !(
        (type === "one-way" && date.length === 1) ||
        (type === "round" && date.length === 2)
      )
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    // Validate origin and destination against the database
    const [originValid, destinationValid] = await Promise.all([
      isValidLocation(origin),
      isValidLocation(destination),
    ]);

    if (!originValid || !destinationValid) {
      console.log("Invalid origin or destination");
      return NextResponse.json(
        { error: "Invalid origin or destination" },
        { status: 400 }
      );
    }

    let allFlights = [];

    // Fetch flights from AFS
    if (type === "one-way") {
      try {
        const response = await axios.get(
          `${AFS_BASE_URL}origin=${origin}&destination=${destination}&date=${date[0]}`,
          {
            headers: {
              "x-api-key": API_KEY,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.data?.results) {
          allFlights.push(response.data.results);
        }
      } catch (error) {
        console.log("AFS error for one-way:", error);
        return NextResponse.json(
          { error: "Error fetching data from AFS" },
          { status: 500 }
        );
      }
    } else if (type === "round") {
      try {
        const outboundResponse = await axios.get(
          `${AFS_BASE_URL}origin=${origin}&destination=${destination}&date=${date[0]}`,
          {
            headers: {
              "x-api-key": API_KEY,
              "Content-Type": "application/json",
            },
          }
        );
        const returnResponse = await axios.get(
          `${AFS_BASE_URL}origin=${destination}&destination=${origin}&date=${date[1]}`,
          {
            headers: {
              "x-api-key": API_KEY,
              "Content-Type": "application/json",
            },
          }
        );

        if (
          outboundResponse.data?.results &&
          outboundResponse.data.results.length > 0 &&
          returnResponse.data?.results &&
          returnResponse.data.results.length > 0
        ) {
          allFlights.push(outboundResponse.data.results);
          allFlights.push(returnResponse.data.results);
        }
      } catch (error) {
        console.log("AFS error for round trip:", error);
        return NextResponse.json(
          { error: "Error fetching data from AFS" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(allFlights);
  } catch (error) {
    console.log("Internal server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}