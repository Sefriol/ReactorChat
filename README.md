# ReaktorChat
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

###Database Schemas
````
Message
{
    id: "MongoID",
    user: "ForeignMongoID",
    channel: "ForeignMongoID",
    message: "...",
    time: Datetime
}
Channel
{
    id: "MongoID",
    owner: "ForeignMongoID",
    name: "channelname",
    users: ["ForeignMongoID",...],
    admins: ["ForeignMongoID",...],
}
User
{
    id: "MongoID"
    name: "...",
    password: "...",
    email: "..."
}
````
###Backend APIs
````
PUT "/api/users/register"
{
    name: "...", 
    password: "...", 
    email: "..."
}

Respond: Success 201
{
    message: "Success!", 
}

POST "/api/users/auth"
{
    email: "...", 
    password: "..."
}

Respond: Success
{
    token: "...", 
    channels: ["MongoID",...]
    user: {_id: "MongoID", name: "..."}
}
````
###Backend Websocket commands
````
Connection:
const socket = io('http://localhost/' + 'MongoID');
socket.on('connect',socket.emit('authenticate', {token: "authenticationstr"})

command:
socket.emit("chat", "...")
Response:
{
    channel: "MongoID",
    user: {id: "MongoID", name: "..."},
    message: "...",
    time: Datetime
}

command:
socket.emit("admin", {command: "addUser", email: "test@test.test"})
Response: Failure
'status', { event: 'error', message:'Incorrect command'}
'status', { event: 'error', message:'Unauthorized command'}
'status', { event: 'error', message:'AddUser command caused an error'}
Response: Success
'status',
{
    event: 'channels:update',
    channels: [{_id: "MongoID", name: "..."},...]
}
'status',
{
    event: 'success', 
    message: 'Successfully added an user'
}

command:
socket.emit("create", {name: "..."})
Response: Failure
'status', { event: 'error', message: 'Invalid channel name'}
'status', { event: 'error' }
Response: Success
'status',
{
    event: 'channels:update',
    channels: [{_id: "MongoID", name: "..."},...]
}

````
