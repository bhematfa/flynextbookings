#!/bin/bash

# Stop any existing containers
./stop.sh

# Build the web service first
echo "Building web service..."
docker-compose build web

# Start the web and nginx services
echo "Starting web and nginx services..."
docker-compose up -d web nginx

echo "App started. Run ./import-data.sh to import data."