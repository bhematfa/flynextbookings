import  prisma  from "@/lib/prisma";
import { NextResponse } from "next/server";
import { parseAndVerifyToken } from "../../../utils/jwt.js";

//As a user, I want to add my hotel to the platform. A hotel has name, logo, address, location, star-rating, and several images.
export async function POST(request) {
    try {
        const {name, logo, address, location, city, starRating, images} = await request.json();
        const userDec = await parseAndVerifyToken(request);

        if (userDec.err) {
            return NextResponse.json (
                {error : "Unauthorized"},
                {status: 401}
            )
        }

        const user = await prisma.user.findUnique({
            where: {id: userDec.userId},
        });

        if (!user) {
            return NextResponse.json (
                {error : "Unauthorized"},
                {status: 401}
            )
        }

        if (!name || !logo || !address || !location || !city || !starRating) {
            return NextResponse.json (
                {"Error" : "Invalid Field"},
                {status: 400}
            )
        }

        const hotel = await prisma.hotel.create({
            data: {
              name: name,
              logo: logo,
              address: address,
              location: location,
              city: city,
              starRating: starRating,
              images: images,
              owner: {
                connect: {
                  id: user.id
                }
              }
            }
          });
          

        return NextResponse.json (
            { hotel }
        );
    }
    catch (error) {
        console.log(error.stack);
        return NextResponse.json (
            {error : "Internal server error"},
            {status: 500}
        );
    }

}

//As a visitor, I want to search for hotels by check-in date, check-out date, and city. 
//I also want to filter them by name, star-rating, and price range. 
//Search results should display in a list that shows the hotel information, 
//starting price, and a location pinpoint on a map. The results should only reflect available rooms.
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const checkIn = searchParams.get("checkIn");
        const checkOut = searchParams.get("checkOut");
        const city = searchParams.get("city");
        const name = searchParams.get("name");
        const starRating = parseInt(searchParams.get("starRating"), 10);
        const priceRange = searchParams.get("priceRange")?.split("-");
    
        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);

        if (!startDate || !endDate || !city || !name || !starRating || !priceRange) {
            return NextResponse.json(
                { error: "Invalid Field" },
                { status: 400 }
            );
        }

        const whereClause = {
        ...(city && { city }),
        ...(name && { name }),
        ...(starRating && { starRating }),
        };

        // Query made with Co Pilot
        const result = await prisma.hotel.findMany({
            where: whereClause,
            include: {
                roomTypes: {
                where: {
                    AND: [
                    {
                        pricePerNight: {
                        gte: priceRange ? parseFloat(priceRange[0]) : undefined,
                        lte: priceRange ? parseFloat(priceRange[1]) : undefined,

                        },
                    },
                    {
                        hotelBookings: {
                        none: {
                            AND: [
                            { checkIn: { lt: endDate } }, // Booking starts before the end date
                            { checkOut: { gt: startDate } }, // Booking ends after the start date
                            ],
                        },
                        },
                    },
                    ],
                },
                },
            },
        });

        const availableHotels = result.filter((hotel) => hotel.roomTypes.length > 0);

        return NextResponse.json({ 
            availableHotels
        });
        
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
