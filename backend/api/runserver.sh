#!/bin/sh

remove=false
deployment=false

while [ $# -gt 0 ]
do
key="$1"

case $key in
    -rm|--remove)
    remove=true
    shift # past argument
    ;;
    -d|--deploy)
    deployment=true
    shift # past argument
    ;;
    *)
            # unknown option
    ;;
esac
done

echo "\n======>>> Stopping all docker containers...\n"
sleep 1
docker-compose stop
#docker stop $(docker ps -a -q)

if [ $remove = true ]; then 
  echo "\n======>>> Removing all docker containers...\n"
  sleep 1
  docker rm $(docker ps -a -q)
fi

if [ $deployment = true ]; then
  echo "\n======>>> Running docker-compose in deployment mode...\n"
  sleep 1
  docker-compose -f docker-compose.yml -f deploy.yml up --build -d
else
  echo "\n======>>> Running docker-compose in development mode...\n"
  sleep 1
  docker-compose -f docker-compose.yml -f dev.yml up --build -d
fi

