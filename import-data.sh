#!/bin/bash

# Set up environment variables for database
DB_HOST="localhost"        # Replace with your host, e.g., container name if in Docker
DB_PORT="5432"             # Replace with your database port
DB_NAME="your_database"    # Replace with your database name
DB_USER="your_username"    # Replace with your database username
DB_PASS="your_password"    # Replace with your database password

# JSON file containing mock data
JSON_FILE="fake_hotels_with_rooms_limited.json"

# Insert data into PostgreSQL
echo "Starting data import..."
while IFS= read -r line; do
  # Parse JSON and generate SQL INSERT commands
  name=$(echo "$line" | jq -r '.name')
  logo=$(echo "$line" | jq -r '.logo[0]')
  address=$(echo "$line" | jq -r '.address')
  city=$(echo "$line" | jq -r '.city')
  location=$(echo "$line" | jq -r '.location')
  starRating=$(echo "$line" | jq -r '.starRating')
  images=$(echo "$line" | jq -r '.images[0]')

  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    INSERT INTO hotels (name, logo, address, city, location, starRating, images)
    VALUES ('$name', '$logo', '$address', '$city', '$location', $starRating, '$images');
  "
done < <(jq -c '.[]' "$JSON_FILE")

echo "Data import completed successfully!"