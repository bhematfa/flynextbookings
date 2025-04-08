#!/bin/bash

set -a
source .env
set +a

# Ensure the web service is running
echo "Starting web service..."
docker-compose up -d web

# Run the data-import service
echo "Running data import..."
docker-compose up data-import

# Check the exit code of the data-import service
if [ $? -eq 0 ]; then
  echo "Data import completed successfully!"
else
  echo "Error importing data"
  exit 1
fi