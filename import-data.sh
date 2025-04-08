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
  apk add jq && \
  psql '$DATABASE_URL' <<EOF
  DROP TABLE IF EXISTS \\\"Hotel\\\" CASCADE;
  CREATE TABLE \\\"Hotel\\\" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT,
    address TEXT,
    city TEXT,
    location TEXT,
    \\\"starRating\\\" INT,
    \\\"ownerId\\\" TEXT
  );

  DROP TABLE IF EXISTS \\\"RoomType\\\" CASCADE;
  CREATE TABLE \\\"RoomType\\\" (
    id TEXT PRIMARY KEY,
    \\\"hotelId\\\" TEXT REFERENCES \\\"Hotel\\\"(id),
    name TEXT NOT NULL,
    amenities TEXT[],
    \\\"pricePerNight\\\" INT NOT NULL,
    \\\"totalRooms\\\" INT NOT NULL,
    schedule JSONB
  );

  \\\\COPY \\\"Hotel\\\"(id, name, logo, address, city, location, \\\"starRating\\\", \\\"ownerId\\\")
  FROM PROGRAM 'jq -r \\".[] | [.id, .name, .logo, .address, .city, .location, .starRating, .ownerId] | @csv\\" /data/$JSON_FILE'
  WITH (FORMAT csv);

  \\\\COPY \\\"RoomType\\\"(id, \\\"hotelId\\\", name, amenities, \\\"pricePerNight\\\", \\\"totalRooms\\\", schedule)
  FROM PROGRAM 'jq -r \\".[] | .roomTypes[] | [.id, .hotelId, .name, (.amenities | join(\\\"|\\\")), .pricePerNight, .totalRooms, (.schedule | tojson)] | @csv\\" /data/$JSON_FILE'
  WITH (FORMAT csv);
EOF
"

if [ $? -eq 0 ]; then
  echo "Data import complete!"
else
  echo "Error importing data"
  exit 1
fi