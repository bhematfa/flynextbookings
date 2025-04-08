#!/bin/bash
cd ./my-app
node fetch.js
cd ../

docker-compose up -d --build
