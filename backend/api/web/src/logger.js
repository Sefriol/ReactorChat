const winston = require('winston');

winston.level = process.env.LOG_LEVEL;

function progress(message) {
    process.stdout.write(message);
}

function debug(message) {
    winston.log('debug', message);
}

function err(message) {
    winston.log('error', message);
}

function warn(message) {
    winston.log('warn', message);
}

module.exports = {
    debug,
    warn,
    err,
    progress,
};
