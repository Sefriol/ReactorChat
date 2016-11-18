#!/bin/sh

remove=false

if [ $# -gt 1 ]; then
    echo "\nIllegal number of parameters.\n"
    exit 1
elif [ $# -eq 1 ]; then
    if [ $1 == "-rm" ]; then
      remove=true
    else
      echo "\nUnrecognized parameter: '$1'.\n"            
      exit 1
    fi
fi

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

echo "\n======>>> Stopping all docker containers...\n"
sleep 1
docker-compose stop
#docker stop $(docker ps -a -q)

if [ $remove = true ]; then 
  echo "\n======>>> Removing all docker containers...\n"
  sleep 1
  docker rm $(docker ps -a -q)
fi

echo "\n======>>> Running docker-compose...\n"
sleep 1
docker-compose up --build -d

