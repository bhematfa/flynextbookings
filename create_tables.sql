DROP TABLE IF EXISTS "Hotel" CASCADE;
  CREATE TABLE "Hotel" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT,
    address TEXT,
    city TEXT,
    location TEXT,
    "starRating" INT,
    "ownerId" TEXT
  );

  DROP TABLE IF EXISTS "RoomType" CASCADE;
  CREATE TABLE "RoomType" (
    id TEXT PRIMARY KEY,
    "hotelId" TEXT REFERENCES "Hotel"(id),
    name TEXT NOT NULL,
    amenities TEXT[],
    "pricePerNight" INT NOT NULL,
    "totalRooms" INT NOT NULL,
    schedule JSONB
  );
