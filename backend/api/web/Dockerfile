FROM node:latest

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . .

ARG HTTP_PORT=8080
ARG LOG_LEVEL=debug
ARG REDIS=redis://redis 
ARG SECRET=abc123defjkl

ENV HTTP_PORT ${HTTP_PORT}
ENV LOG_LEVEL ${LOG_LEVEL}
ENV REDIS ${REDIS}
ENV SECRET ${SECRET}

RUN npm install nodemon -g

CMD npm install && npm start