const socketioJwt = require('socketio-jwt');
const Validator = require('better-validator');
const Channel = require('../db/models/channel');
const User = require('../db/models/user');
const Message = require('../db/models/message');
const ChatCommands = require('./chatcommands');
const logger = require('../logger');

class Chat {
    constructor(server, name, id, admins, users) {
        this.server = server;
        this.channelname = name;
        this.io = server.io;
        this.id = id;
        this.admins = admins;
        this.users = users.map(usr => ({ id: usr.id.toString(), name: usr.name, sockets: [] }));
    }
    start() {
        const self = this;
        return new Promise((resolve, reject) => {
            self.channel = self.io.of(`${self.id}`);
            if (self.channel) {
                self.channel.on('connection', socketioJwt.authorize({
                    secret: process.env.SECRET,
                    timeout: 5000,
                })).on('authenticated', (socket) => {
                    if (ChatCommands.ValidateUser(socket.decoded_token, self) === -1) socket.disconnect('unauthorized channel');
                    else {
                        console.log(`Client ${socket.decoded_token.name} joined!`);
                        handleConnection(self, socket);
                    }
                });
                resolve();
            } else {
                reject();
            }
        });
    }
    stop() {
        const self = this;
        return new Promise((resolve, reject) => {
            // Doesn't do anything atm
            resolve();
        });
    }
    addUser(userid) {
        const self = this;
        return new Promise((resolve, reject) => {
            const validator = new Validator();
            validator(userid).isString().isMongoId();
            if (validator.run().length > 0) return reject('Given UserID is not a MongoID');
            else if (self.users.map(user => user.id).indexOf(userid) === -1) {
                return dbAddUser(self, userid, false)
                    .catch((reason) => {
                        self.users
                            .splice(
                                self.users.map(socket => socket.decoded_token.id).indexOf(userid),
                                1);
                        return reject(reason);
                    })
                    .then(resolve());
            }
            return reject('User is already a member');
        });
    }
    addAdmin(userid) {
        const self = this;
        return new Promise((resolve, reject) => {
            const validator = new Validator();
            validator(userid).isString().isMongoId();
            if (validator.run().length > 0) return reject('Given UserID is not a MongoID');
            else if (self.admins.indexOf(userid) === -1) {
                return dbAddUser(self.id, userid, true)
                    .catch((reason) => {
                        self.admins.splice(self.admins.indexOf(userid), 1);
                        return reject(reason);
                    })
                    .then(resolve());
            }
            return reject('User is already a member');
        });
    }
    getUser(id) {
        const self = this;
        return self.users[self.users.map(user => user.id).indexOf(id)];
    }
}

function handleConnection(chat, socket) {
    socket.emit('status', {
        event: 'connected',
        channel: chat.channelname,
        users: chat.users.map(user => (
            {
                id: user.id.toString(),
                name: user.name,
                online: user.sockets.length > 0,
            })),
        user: socket.decoded_token });
    chat.channel.emit('status', {
        event: 'user:join',
        user: { name: socket.decoded_token.name, id: socket.decoded_token.id },
    });
    Message.find({ channel: chat.id },
        'message time user channel',
        { limit: 10, sort: '-time', populate: { path: 'user', select: 'name _id' } },
        (err, msgs) => {
            if (err) {
                socket.emit('status', { event: 'error', message: `Couldn't receive messages for channel ${chat.channelname}` });
            } else {
                msgs.reverse().map(oldestfirst => chat.channel.emit('chat', oldestfirst));
            }
        });
    chat.getUser(socket.decoded_token.id).sockets.push(socket);
    socket
        .on('disconnect', () => {
            chat.getUser(socket.decoded_token.id).sockets
                .splice(chat.getUser(socket.decoded_token.id).sockets.indexOf(socket), 1);
            chat.channel.emit('status', {
                event: 'user:left',
                user: { name: socket.decoded_token.name, id: socket.decoded_token.id },
            });
        })
        .on('chat', (msg) => {
            const validator = new Validator();
            validator(msg).isString();
            if (validator.run().length === 0) {
                const msgObj = {
                    channel: chat.id,
                    user: socket.decoded_token.id,
                    message: msg,
                    time: new Date(),
                };
                new Message(msgObj).save((err) => { if (err) console.log('\x1b[31m', `DbError while saving a msg: ${err}`, '\x1b[0m'); });
                msgObj.user = {
                    id: socket.decoded_token.id,
                    name: socket.decoded_token.name,
                };
                chat.channel.emit('chat', msgObj);
            }
        })
        .on('admin', (msg) => {
            if (chat.admins.indexOf(socket.decoded_token.id) !== -1) {
                const validator = new Validator();
                validator(msg).isObject((obj) => {
                    obj('command').required().isString().isAlpha();
                });
                if (validator.run().length === 0) {
                    try {
                        ChatCommands.CommandMap[msg.command](socket, chat, msg);
                    } catch (error) {
                        console.log(error);
                        socket.emit('status', { event: 'error', message: 'Incorrect command' });
                    }
                }
            } else {
                socket.emit('status', { event: 'error', message: 'Unauthorized command' });
            }
        })
        .on('create', (msg) => {
            const validator = new Validator();
            validator(msg).isObject((child) => {
                child('name').required().isString().isAlphanumeric();
            });
            if (validator.run().length === 0) {
                const channelObject = {
                    owner: socket.decoded_token.id,
                    admins: [socket.decoded_token.id],
                    users: [socket.decoded_token.id],
                    name: msg.name,
                };
                new Channel(channelObject).save((err, channel) => {
                    if (err) {
                        logger.err(`Adding a channel to database caused an error: ${err}`);
                    } else {
                        const newchat = new Chat(
                        chat.server,
                        `${channel.name}`,
                        `${channel._id}`,
                        [socket.decoded_token.id],
                        [socket.decoded_token]);
                        newchat.start();
                        chat.server.app.get('socketio').addChat(newchat);
                        Channel.find({ users: socket.decoded_token.id }, 'id name', (err, channels) => {
                            if (err || !channels) socket.emit('status', { event: 'error' });
                            else if (channels) socket.emit('status', { event: 'channels:update', channels });
                        });
                    }
                });
            } else {
                socket.emit('status', { event: 'error', message: 'Invalid channel name' });
                console.log(validator.run());
            }
        });
}

function dbAddUser(chat, userid, admin) {
    const UpdateObject = admin ? { $push: { admins: userid } } : { $push: { users: userid } };
    return new Promise((resolve, reject) => {
        User.findById(userid, (err, usr) => {
            if (err) return reject(err);
            else if (!usr) return reject('User not found');
            return Channel.findByIdAndUpdate(chat.id, UpdateObject, (errUpdate) => {
                if (errUpdate) {
                    return reject(errUpdate);
                } else if (admin) {
                    chat.admins.push(usr._id.toString());
                    return resolve();
                }
                chat.users.push({ id: usr._id.toString(), name: usr.name, sockets: [] });
                chat.server.app.get('socketio').getChat(`${process.env.MONGOID}`).then((chl) => {
                    const newusr = chl.getUser(usr._id.toString()).sockets;
                    if (newusr[0]) {
                        Channel.find({ users: newusr[0].decoded_token.id }, 'id name', (errFind, channels) => {
                            if (channels) newusr[0].emit('status', { event: 'channels:update', channels });
                        });
                    }
                });
                return resolve();
            });
        });
    });
}
module.exports = Chat;
