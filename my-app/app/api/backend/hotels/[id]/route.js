import  prisma  from "@/lib/prisma";
import { NextResponse } from "next/server";


//As a visitor, I want to view detailed hotel information, including room types, amenities, and pricing.
export async function GET(request, { params }) {

    try {
        const {id} = await params;

        const hotel = await prisma.hotel.findUnique({
            where : {id},
            include : {
                roomTypes: {
                    select: {
                        name: true,
                        amenities: true,
                        pricePerNight: true,
                        images: true,
                    }
                }
            }
        });

        if (!hotel) {
            return NextResponse.json(
                {error: "Hotel Does not Exist"},
                {status: 404}
            )
        };

        return NextResponse.json(
            {hotel}
        );
    }
    catch(error) {
        return NextResponse.json(
            {error : "Internal server error"},
            {status: 500}
        )
    }
}