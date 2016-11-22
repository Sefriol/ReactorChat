#!bin/sh

set -e

if ! hash docker 2>/dev/null; then
  echo "\n======>>> Installing Docker...\n"
	sleep 1
  wget https://get.docker.com/ -O install_docker.sh
  /bin/sh install_docker.sh
  rm install_docker.sh
  sudo usermod -aG docker $USER
  echo "\n======>>> In order to be able to use docker, you'll have to log in and out again, please do so and run this script again...\n"
  sleep 1
  exit 0
fi

echo "\n======>>> Creating nginx-proxy network for Docker"
sleep 1
docker network create -d bridge nginx-proxy

echo "\n======>>> Starting up NGINX & LETSENCRYPT proxy"
sleep 1

cd ./nginx-proxy
docker-compose stop
docker-compose up -d

echo "\n======>>> Starting up NGINX & LETSENCRYPT proxy"

cd ../api
sh runserver.sh --deploy
