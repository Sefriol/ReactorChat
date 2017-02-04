# ReaktorChat

## Summary

ReactorChat is a chat application with NodeJS backend which supported by Socket.io, ExpressJS and MongoDB. Frontend is done with ReactJS and styling follows Google's Materialize.

Backend provides a possibility for users to create channels and invite registered users by giving their email. User are divided into two groups: channel admins and users. Currently the UI supports only adding users to the channel, but backend has support for adding admins as well.

## Backend

`cd backend/`

### Other commands

Stop/remove all Docker containers:

`docker stop $(docker ps -a -q)`
`docker rm $(docker ps -a -q)`

Delete all images
`docker rmi $(docker images -q)`

Run locally: 
`sh runserver.sh`

Run on remote:
`sh runserver.sh --deploy`

### Database Schemas

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
### Backend APIs
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
### Backend Websocket commands
````javascript
Connection:
const socket = io('http://localhost/' + 'MongoID');
socket.on('connect', socket.emit('authenticate', {token: 'authenticationstr'})

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

## Frontend

`cd frontend/`

### Other commands

Stop/remove all Docker containers:

`docker stop $(docker ps -a -q)`
`docker rm $(docker ps -a -q)`

Delete all images
`docker rmi $(docker images -q)`

Run: 
`sh runfront.sh`
