#! /bin/bash

#Black='\033[0;30m'        # Black
#Red='\033[0;31m'          # Red
#Green='\033[0;32m'        # Green
#Yellow='\033[0;33m'       # Yellow
#Blue='\033[0;34m'         # Blue
#Purple='\033[0;35m'       # Purple
#Cyan='\033[0;36m'         # Cyan
#White='\033[0;37m'        # White

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# contract
if [ -n "$1" ]; then
  contract=$1
  if [ -d "./contracts/$contract" ]; then
    echo -e "${GREEN}>>> Building $contract contract...${NC}"
  else
    echo -e "${RED}Error: Directory ./contracts/$contract does not exists.${NC}"
    exit 0
  fi
else
  echo -e "${RED}Error: contract needed, use ./build.sh <contract name>${NC}"
  exit 0
fi

mkdir -p build
mkdir -p build/$contract

# eosio.cdt v1.7.0
# -contract=<string>       - Contract name
# -o=<string>              - Write output to <file>
# -abigen                  - Generate ABI
# -I=<string>              - Add directory to include search path
# -L=<string>              - Add directory to library search path
# -R=<string>              - Add a resource path for inclusion

eosio-cpp -I="./contracts/$contract/" -R="./contracts/$contract/resources" -o="./build/$contract/$contract.wasm" -contract="$contract" -abigen ./contracts/$contract/$contract.cpp
