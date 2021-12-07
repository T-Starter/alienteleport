#! /bin/bash

# docker rm -f teleport
# docker build -t teleport .
# docker run --name teleport -dt teleport

# docker-compose down
docker-compose -f docker-compose.mainnet.yaml up -d