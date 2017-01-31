const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const UserSchema = new mongoose.Schema({
    name: String,
    password: String,
    meta: Array,
    email: {
        type: String,
        required: true,
        unique: true,
    },
});

UserSchema.set('toJSON', {
    transform (doc, ret, options) {
        const retJson = {
            id: ret._id,
            email: ret.email,
            name: ret.name,
        };
        return retJson;
    },
});

UserSchema.pre('save', function (next) {
    const user = this;
    if (user.isModified('password') || user.isNew) {
        bcrypt.genSalt(10, (err, salt) => {
            if (err) { return next(err); }
            bcrypt.hash(user.password, salt, (err, hash) => {
                if (err) { return next(err); }
                user.password = hash;
                next();
            });
        });
    }
});

UserSchema.methods.comparePassword = function (password) {
    const user = this;
    return new Promise((resolve, reject) => {
        if (process.env.APP_ENV === 'test') {
            resolve(password === user.password);
        } else {
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) { return reject(err); }
                resolve(isMatch);
            });
        }
    });
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
