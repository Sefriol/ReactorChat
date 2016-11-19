#!/bin/sh

# RUN THIS SCRIPT ON THE REMOTE ONLY TO CONFIGURE HTTPS USING CERTIFICATE FROM LETSENCRYPT

if ! hash docker 2>/dev/null; then
  echo "\n======>>> Installing Docker...\n"
	sleep 1
  wget https://get.docker.com/ -O install_docker.sh
  /bin/sh install_docker.sh
fi

if ! hash docker-compose 2>/dev/null; then
  if hash apt-get 2>/dev/null; then
    if ! hash pip 2>/dev/null; then
      echo "\n======>>> Installing python pip...\n"
		  sleep 1
		  sudo apt-get update
		  yes | sudo apt-get install python-setuptools python-dev build-essential
		  sudo easy_install pip
    fi
    echo "\n======>>> Installing docker-compose through pip...\n"
    sleep 1
    sudo pip install docker-compose
  else
    echo "\ndocker-compose not found. Please install it and try again.\n"
    exit 1
  fi
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
