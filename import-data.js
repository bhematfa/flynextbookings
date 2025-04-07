const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  // Load the mock data from the JSON file
  const data = JSON.parse(fs.readFileSync('fake_hotels_with_rooms_limited.json', 'utf8'));

  for (const hotel of data) {
    await prisma.hotel.create({
      data: {
        name: hotel.name,
        logo: hotel.logo,
        address: hotel.address,
        city: hotel.city,
        location: hotel.location,
        starRating: hotel.starRating,
        images: hotel.images,
        ownerId: hotel.ownerId,
        roomTypes: {
          create: hotel.roomTypes.map(room => ({
            name: room.name,
            amenities: room.amenities,
            pricePerNight: room.pricePerNight,
            images: room.images,
            totalRooms: room.totalRooms,
            schedule: room.schedule
          }))
        }
      }
    });
  }
  console.log('Data imported successfully!');
}

main().catch(e => {
  console.error(e);
}).finally(async () => {
  await prisma.$disconnect();
});