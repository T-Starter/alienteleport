FROM node:14-alpine

RUN apk update

RUN apk add --no-cache bash

COPY ./oracle/*  /home/node/app/reporter/

WORKDIR /home/node/app/reporter

RUN yarn install

# CMD ["node", "reporter-eos.js"]