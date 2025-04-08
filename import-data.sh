#!/bin/bash
set -a
source .env
set +a

JSON_FILE="realistic_hotels_with_rooms.json"
DATABASE_URL=${DATABASE_URL:-"postgresql://your_render_user:your_render_password@your_render_host:5432/flynext"}

if [ ! -f "$JSON_FILE" ]; then
  echo "Error: $JSON_FILE does not exist."
  exit 1
fi

echo "Importing data from $JSON_FILE into Render PostgreSQL..."

# Use a temporary Postgres container with jq
docker run --rm -v $(pwd):/data -w /data postgres:15 bash -c "
  apt-get update && apt-get install -y jq && \

  # Preprocess the Hotel data (escape quotes and handle nulls)
  jq -r '.[] | [.id, .name, .logo, .address, .city, .location, .starRating, .ownerId] | map(if . == null then \"\" else . end) | @csv' /data/$JSON_FILE > /data/hotel_data.csv && \

  # Preprocess the RoomType data (escape quotes, handle arrays and JSON)
  jq -r '.[] | .roomTypes[] | [.id, .hotelId, .name, (.amenities | join(\"|\")), .pricePerNight, .totalRooms, (.schedule | tojson)] | map(if . == null then \"\" else . end) | @csv' /data/$JSON_FILE > /data/roomtype_data.csv && \

  # Create a SQL script for table creation
  echo 'DROP TABLE IF EXISTS \"Hotel\" CASCADE;
  CREATE TABLE \"Hotel\" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT,
    address TEXT,
    city TEXT,
    location TEXT,
    \"starRating\" INT,
    \"ownerId\" TEXT
  );

  DROP TABLE IF EXISTS \"RoomType\" CASCADE;
  CREATE TABLE \"RoomType\" (
    id TEXT PRIMARY KEY,
    \"hotelId\" TEXT REFERENCES \"Hotel\"(id),
    name TEXT NOT NULL,
    amenities TEXT[],
    \"pricePerNight\" INT NOT NULL,
    \"totalRooms\" INT NOT NULL,
    schedule JSONB
  );' > /data/create_tables.sql && \

  # Execute the table creation
  psql '$DATABASE_URL' -f /data/create_tables.sql && \

  # Use \COPY commands with psql -c to import data
  psql '$DATABASE_URL' -c \"\\\COPY \\\"Hotel\\\"(id, name, logo, address, city, location, \\\"starRating\\\", \\\"ownerId\\\") FROM '/data/hotel_data.csv' WITH (FORMAT csv, HEADER false, QUOTE '\\\"', ESCAPE '\\\\')\" && \

  psql '$DATABASE_URL' -c \"\\\COPY \\\"RoomType\\\"(id, \\\"hotelId\\\", name, amenities, \\\"pricePerNight\\\", \\\"totalRooms\\\", schedule) FROM '/data/roomtype_data.csv' WITH (FORMAT csv, HEADER false, QUOTE '\\\"', ESCAPE '\\\\')\" && \

  echo 'Data import successful'
"

if [ $? -eq 0 ]; then
  echo "Data import complete!"
else
  echo "Error importing data"
  exit 1
fi