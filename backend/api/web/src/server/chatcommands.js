const validator = require('validator');
const logger = require('../logger');

function ValidateUser(issuer, channel) {
    if (issuer
        && validator.isMongoId(issuer.id)
        && channel) {
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

function AddUser(socket, channel, userid) {
    if (ValidateUser(socket.decoded_token, channel) === 0) {
        if (channel.users.indexOf(userid) === -1) {
            channel.AddUser(userid)
                .catch((reason) => {
                    logger.err(`Adding an user to the channel caused an error: ${reason}`);
                    socket.emit('status', 'AddUser command caused an error');
                })
                .then(() => {
                    socket.emit('status', 'Successfully added an user');
                });
        }
    }
}

const CommandMap = {
    'addUser': AddUser,
    'addAdmin': AddAdmin,
};

module.exports = { CommandMap, ValidateUser };
