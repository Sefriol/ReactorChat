const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const util = require('util');
const jwt = require('express-jwt');
const router = require('./router');
const logger = require('../logger');

const DEFAULT_PORT_VALUE = 8081;
const BASE_URL = '/api';
class Chats {
    constructor() {
        this.chats = [];
    }
    addChat(newchat) {
        const self = this;
        return new Promise((resolve, reject) => {
            if (self.chats.map(chat => chat.id).indexOf(newchat.id) === -1) {
                self.chats.push(newchat);
                resolve();
            } else { reject(); }
        });
    }
    removeChat(rmchat) {
        const self = this;
        return new Promise((resolve, reject) => {
            const idx = self.chats.map(chat => chat.id).indexOf(rmchat.id);
            if (idx === -1) {
                reject();
            } else {
                self.chats[idx].stop();
                self.chats.splice(idx, 1);
                resolve();
            }
        });
    }
    getChat(chatId) {
        const self = this;
        return new Promise((resolve, reject) => {
            const idx = self.chats.map(chat => chat.id).indexOf(chatId);
            if (idx === -1) {
                reject();
            } else {
                resolve(self.chats[idx]);
            }
        });
    }
}

class Server {
    constructor(port = DEFAULT_PORT_VALUE) {
        this.port = port;
        this.app = express();
        this.server = require('http').createServer(this.app);
    }

    start() {
        const self = this;
        return new Promise((resolve, reject) => {
            const app = self.server.listen(self.port);
            self.io = require('socket.io').listen(app);
            _configure(self.app, self.getChat);
            resolve(self.port);
        });
    }

    stop() {
        const self = this;
        return new Promise((resolve, reject) => {
            self.httpsServer.close();
        });
    }

    setChats(chats) {
        const self = this;
        return new Promise((resolve, reject) => {
            self.app.set('socketio', chats);
        });
    }
}

function _configure(app, functions) {
    app.use(morgan('dev'));

    app.use(bodyParser.json({ limit: '50mb' }));

    app.use(jwt({ secret: process.env.SECRET })
      .unless({
          path: [`${BASE_URL}/users/auth`, `${BASE_URL}/users/register`],
      })
    );
    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

        console.log(`Sending headers:\n\n${  console.log(JSON.stringify(res.headers))}`);
        next();
    });
    const expressRouter = express.Router();
    app.use(BASE_URL, expressRouter);
    router.configureRoutes(expressRouter);
  // config error middleware
    app.use((err, req, res, next) => {
        const headers = util.inspect(req.headers, false, null);
        const body = util.inspect(req.body, false, null);
        logger.err(`======= Request error =======
      \n\n--- URL ---\t${req.url}
      \n\n--- Headers ---\n\n${headers}
      \n\n--- Body ---\n\n${body}
      \n\n-- Error ---\n\n${err}
      \n\n===============================`);
        res.status(500).send({ msg: 'Unknown error' });
    });
}

module.exports = Server;
