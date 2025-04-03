import axios from "axios";
import { NextResponse } from "next/server";

const AFS = "https://advanced-flights-system.replit.app/api/flights?";
const API_KEY = process.env.AFS_API_KEY;

let cities = [];
let airports = [];

// Checks whether the given location coresponds to a city or airport
const isValidLocation = (location) => {
  location = location.toLowerCase();
  return (
    cities.some((city) => city.city.toLowerCase() === location) ||
    airports.some(
      (airport) =>
        airport.code.toLowerCase() === location ||
        location === airport.name.toLowerCase()
    )
  );
};

// Checks if a give date is possible
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

// The POST handler
export async function POST(request) {
  try {
    const body = await request.json();
    const { origin, destination, date, type } = body;

    // Ensure all the required fields are provided and are of correct type
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
      !((type === "one-way" && date.length === 1) || (type === "round" && date.length === 2))
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    // Get all cities and airports in AFS
    if (cities.length === 0) {
      const citiesAFS = await axios.get(
        "https://advanced-flights-system.replit.app/api/cities",
        {
          headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json",
          },
        }
      );
      cities = citiesAFS.data;
    }

    if (airports.length === 0) {
      const airportsAFS = await axios.get(
        "https://advanced-flights-system.replit.app/api/airports",
        {
          headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json",
          },
        }
      );
      airports = airportsAFS.data;
    }

    // Check if the provided origin and destination are in AFS
    if (!isValidLocation(origin) || !isValidLocation(destination)) {
      console.log("Invalid origin or destination");
      return NextResponse.json(
        { error: "Invalid origin or destination" },
        { status: 400 }
      );
    }

    let allFlights = [];

    if (type === "one-way") {

      try {
        let response = await axios.get(
          AFS + `origin=${origin}&destination=${destination}&date=${date[0]}`,
          {
            headers: {
              "x-api-key": API_KEY,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(response.status, response.data);

        if (response.data?.results) {
          allFlights.push(response.data.results);
        }
      } catch (error) {
        console.log(error);
        return NextResponse.json(
          { error: "Error fetching data from AFS" },
          { status: 500 }
        );
      }
    }
    else {
      try {
        let response = await axios.get(
          AFS + `origin=${origin}&destination=${destination}&date=${date[0]}`,
          {
            headers: {
              "x-api-key": API_KEY,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(response.status, response.data);

        let back = await axios.get(
          AFS + `origin=${destination}&destination=${origin}&date=${date[1]}`,
          {
            headers: {
              "x-api-key": API_KEY,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data?.results && response.data.results.length > 0 && back.data?.results && back.data.results.length > 0) {
          allFlights.push(response.data.results);
          allFlights.push(back.data.results);
        }
      } catch (error) {
        console.log(error);
        return NextResponse.json(
          { error: "Error fetching data from AFS" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(allFlights);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
