#!/bin/bash

# Define the Docker container name and JSON file path
CONTAINER_NAME="flynext-db"
JSON_FILE="fake_hotels_with_rooms_limited.json"

# Check if the JSON file exists
if [ ! -f "$JSON_FILE" ]; then
  echo "Error: $JSON_FILE does not exist."
  exit 1
fi

# Import the JSON data into PostgreSQL database
echo "Importing data from $JSON_FILE into the database..."

docker exec -i $CONTAINER_NAME psql -U postgres -d flynext <<EOF
-- Drop and recreate the hotels table
DROP TABLE IF EXISTS hotels CASCADE;
CREATE TABLE hotels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  address TEXT,
  city TEXT,
  location TEXT,
  star_rating NUMERIC,
  owner_id TEXT
);

-- Drop and recreate the room_types table (linked to hotels)
DROP TABLE IF EXISTS room_types CASCADE;
CREATE TABLE room_types (
  id TEXT PRIMARY KEY,
  hotel_id TEXT REFERENCES hotels(id),
  name TEXT NOT NULL,
  amenities TEXT[],
  price_per_night NUMERIC NOT NULL,
  total_rooms INT NOT NULL,
  schedule JSONB
);

-- Insert data into the hotels table
-- Iterate through the JSON file (adjust the path in COPY if needed)
\COPY hotels(id, name, logo, address, city, location, star_rating, owner_id)
FROM PROGRAM 'jq -r ".[] | [.id, .name, .logo, .address, .city, .location, .starRating, .ownerId] | @csv" $JSON_FILE'
WITH (FORMAT csv);

-- Insert data into the room_types table
\COPY room_types(id, hotel_id, name, amenities, price_per_night, total_rooms, schedule)
FROM PROGRAM 'jq -r ".[] | .roomTypes[] | [.id, .hotelId, .name, (.amenities | join(\"|\")), .pricePerNight, .totalRooms, (.schedule | tojson)] | @csv" $JSON_FILE'
WITH (FORMAT csv);

EOF

echo "Data import complete!"