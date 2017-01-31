const validator = require('validator');
const logger = require('../logger');
const Validator = require('better-validator');
const User = require('../db/models/user');

function ValidateUser(issuer, channel) {
    if (issuer
        && validator.isMongoId(issuer.id)
        && channel) {
        //console.log(channel.channelname, issuer.id, channel.users)
        if (channel.users.map(user => user.id).indexOf(issuer.id) === -1) {
            return -1; // User is not a member of this channel
        } else if (channel.admins.indexOf(issuer.id) !== -1) {
            return 0; // User is an admin to this channel
        }
        return 1; // Normal user
    }
}

function AddAdmin(socket, channel, userid) {
    if (ValidateUser(socket.decoded_token, channel) === 0) {
        if (channel.admins.indexOf(userid) === -1) {
            channel.AddAdmin(userid)
                .catch((reason) => {
                    logger.err(`Adding an admin to the channel caused an error: ${reason}`);
                    socket.emit('status', 'AddAdmin command caused an error');
                })
                .then(() => {
                    socket.emit('status', 'Successfully added an admin');
                });
        }
    }
}

function AddUser(socket, channel, object) {
    if (ValidateUser(socket.decoded_token, channel) === 0) {
        const val = new Validator();
        val(object).isObject((obj) => {
            obj('command')
                .required()
                .isString()
                .isAlpha()
                .isEqual('addUser');
            obj('email').isString().isEmail();
            obj('userid').isString().isMongoId();
        });
        if (val.run().length === 0 && object.userid && channel.users.indexOf(object.userid) === -1) {
            channel.addUser(object.userid)
                .catch((reason) => {
                    logger.err(`Adding an user to the channel caused an error: ${reason}`);
                    socket.emit('status', 'AddUser command caused an error');
                })
                .then(() => {
                    socket.emit('status', 'Successfully added an user');
                });
        } else if (val.run().length === 0 && object.email) {
            User.findOne({ email: object.email }, (err, usr) => {
                if (err || !usr) socket.emit('status', 'No user found');
                if (usr) {
                    channel.addUser(usr._id.toString())
                    .catch((reason) => {
                        logger.err(`Adding an user to the channel caused an error: ${reason}`);
                        socket.emit('status', 'AddUser command caused an error');
                    })
                    .then(() => {
                        socket.emit('status', 'Successfully added an user');
                    });
                }
            });
        } else {
            socket.emit('status', 'Invalid command');
        }
    }
}


const CommandMap = {
    'addUser': AddUser,
    'addAdmin': AddAdmin,
};

module.exports = { CommandMap, ValidateUser };
