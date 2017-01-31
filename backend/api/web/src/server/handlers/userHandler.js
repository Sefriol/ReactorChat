const userModel = require('../../db/models/user');
const channelModel = require('../../db/models/channel');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const lengthValidatorOptions = { min: 5, max: 100 };

function getDetails(req, res, next) {
    if (req.user) {
        return res.send(req.user);
    }
    return next(new Error('Invalid user!'));
}

function registerUser(req, res, next) {
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    // console.log(req.app.get('socketio').getChat('587a09eabcc9a83b498a63b3'));
    if (validator.isEmail(email) &&
        validator.isLength(password, lengthValidatorOptions) &&
        validator.isLength(name, lengthValidatorOptions)) {
        userModel.create({ email, password, name }, (err, user) => {
            if (err) {
                return next(err);
            } else if (!user) {
                return next(new Error('Could not create user!'));
            }
            req.app.get('socketio').getChat(`${process.env.MONGOID}`).then((chat) => {
                chat.addUser(user._id).then(res.status(201).send({ message: 'Success!' }));
            });
        });
    } else {
        next(new Error(`email ${validator.isEmail(email)
            } pwd ${validator.isLength(password, lengthValidatorOptions)
            } name ${validator.isLength(name, lengthValidatorOptions)}User sign up invalid payload!`));
    }
}

function authenticateUser(req, res, next) {
    const email = req.body.email;
    const password = req.body.password;

    if (validator.isEmail(email) &&
        validator.isLength(password, lengthValidatorOptions)) {
        // payload valid
        userModel.findOne({ email }, (err, user) => {
            if (err) {
                return next(err);
            } else if (!user) {
                return res.status(403).send({ message: 'Authentication failed.' });
            }

            user.comparePassword(password).then((isValid) => {
                if (isValid) {
                    const token = jwt.sign(user.toJSON(), process.env.SECRET);
                    channelModel.find({ users: user._id }, 'id name', (err, channels) => {
                        if (err || !channels) return res.status(403).send({ message: 'This user account doesn\'t have valid channels' });
                        else if (channels) return res.send({ token, channels, user: user.toJSON() });
                    });
                } else {
                    return res.status(403).send({ message: 'Authentication failed.' });
                }
            }).catch((err) => {
                next(err);
            });
        });
    } else {
        next(new Error('User login invalid payload!'));
    }
}

const routes = {
    GET: { '/details': getDetails },
    POST: { '/auth': authenticateUser },
    PUT: { '/register': registerUser },
};

module.exports = { routes };
