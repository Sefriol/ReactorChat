const Server = require('./server/server');
const Chats = require('./server/chats');
const Chat = require('./server/chat');
const logger = require('./logger');
const mongoAdapter = require('./db/mongoAdapter');

const User = require('./db/models/user');
const Channels = require('./db/models/channel');

const server = new Server(process.env.HTTP_PORT);

server.start().then((port) => {
    console.log(` =========> Web app listening on port ${port}`);
    return mongoAdapter.connect();
}).then((address) => {
    console.log(` =========> DB connected to ${address}`);
    server.io.on('connection', (socket) => {
        socket.on('disconnect', () => { });
    });
    const userdict = {
        email: process.env.ROOT_EMAIL,
        name: 'Root Admin',
        password: 'test123',
    };
    new Promise((resolve, reject) => {
        User.find({ email: userdict.email }, (err, results) => {
            if (results && results.length === 0) {
                console.log('Creating test user...');
                new User(userdict).save((err, usr) => {
                    if (err) { reject(logger.err(`Err while saving main user: ${err}`)); }
                    console.log('Test user saved successfully!');
                    resolve(usr._id);
                });
            } else {
                console.log('Main user found!');
                resolve(results[0]._id);
            }
        });
    })
    .then((result) => { if (result) { initUsers(result); } })
    .catch((err) => { throw Error(err); });
}).catch((err) => {
    console.error(` =========> Error on DB connect: ${err}`);
});

function initUsers(admin) {
    console.log('Requesting users..');
    User.find({}, (err, results) => {
        if (results && results.length === 0) {
            throw Error('No users?');
        } else {
            const array = [];
            results.forEach((result) => {
                array.push(result._id);
            });
            console.log('Users found!');
            return array;
        }
    }).then((result) => { initChannels(admin, result); });
}

function initChannels(admin, usrs) {
    console.log('Initializing Channels');
    const chats = new Chats(server.io);
    Channels.find({}, '', { populate: { path: 'users', select: 'name _id' } }, (err, channels) => {
        console.log('Search finished');
        if (err) {
            return logger.err(err);
        }
        if (channels && channels.length === 0) {
            console.log('Creating command channel...');
            new Channels({
                _id: process.env.MONGOID,
                owner: admin,
                admins: [admin],
                users: usrs,
                name: 'commands',
            }).save((err, chl) => {
                if (err) { return logger.err(`DbError while saving channel: ${err}`); }
                console.log('\x1b[36m', 'Command channel saved successfully!', '\x1b[0m');
                const chat = new Chat(
                    server,
                    `${chl.name}`,
                    `${chl._id}`,
                    chl.admins,
                    chl.users);
                chat.start();
                chats.addChat(chat);
                console.log('\x1b[36m', `Started channel(s): ${chl._id}`, '\x1b[0m');
            });
        } else {
            const consolechannels = [];
            console.log('Generating channel(s)...');
            channels.forEach((channel) => {
                const chat = new Chat(
                    server,
                    `${channel.name}`,
                    `${channel._id}`,
                    channel.admins,
                    channel.users);
                chat.start().then(consolechannels.push(channel._id));
                chats.addChat(chat);
            });
            console.log('\x1b[36m', `Started channel(s): ${consolechannels}`, '\x1b[0m');
        }
        server.setChats(chats);
    });
}
