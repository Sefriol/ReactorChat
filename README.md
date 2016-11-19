# mcc-2016-g10-p2

## Backend

`cd backend/`

### Backend deployment

SSH into the remote machine and run `sh deploy.sh`. This will configure NGINX proxy with letsecnrypt companion for generating TLS certificates, thus achieving end-to-end HTTPS communication.

### Other commands

Stop/remove all Docker containers:

`docker stop $(docker ps -a -q)`
`docker rm $(docker ps -a -q)`

Delete all images
`docker rmi $(docker images -q)`

Set up the external network:
`docker network create -d bridge nginx-proxy`

Run locally: 
`sh runserver.sh`

Run on remote:
`sh runserver.sh --deploy`