FROM node:latest

COPY . /src
WORKDIR /src

RUN npm install
RUN npm install http-server -g
RUN npm run webpack
CMD npm start