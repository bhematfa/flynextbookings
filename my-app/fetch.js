import { connect } from "http2";
import { prisma } from "./utils/db.js";
import axios from "axios";

const API_KEY = process.env.AFS_API_KEY;


export async function fetch() {


    const cityCount = await prisma.city.count();
    const airportCount = await prisma.airport.count();

    if (cityCount === 0 && airportCount === 0){

    const airportsAFS = await axios.get(
        "https://advanced-flights-system.replit.app/api/airports",
        {
          headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json",
          },
        }
      );
    
    const citiesAFS = await axios.get(
        "https://advanced-flights-system.replit.app/api/cities",
        {
          headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json",
          },
        }
    );

    for (const c of citiesAFS.data){
        await prisma.city.create({data: c})
    }

    for (const a of airportsAFS.data){

      const cityRecord = await prisma.city.findUnique({
        where: { city: a.city },
        select: { id: true },
      });

      if (!cityRecord) {
        continue; // Skip if the city is not found
      }

        await prisma.airport.create({data: {name:a.name, code: a.code, cityId: cityRecord.id}})
    }
}
}
fetch();