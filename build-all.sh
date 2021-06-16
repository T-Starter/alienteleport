#!/bin/bash

GREEN='\033[0;32m'
NC='\033[0m'

declare -a contracts=( "teleporteos" )

for contract in "${contracts[@]}"
do
    echo -e "${GREEN}>>> ./build.sh $contract ...${NC}"
    ./build.sh $contract
done
