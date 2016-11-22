'use strict'

const bcrypt = require('bcrypt')
const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name: String,
    password: String,
    email: {
        type: String,
        required: true,
        unique: true
    }
})

UserSchema.set('toJSON', {
    transform: (doc, ret, options) => {
        const retJson = {
            email: ret.email,
            name: ret.name
        }
        return retJson
    }
})

UserSchema.pre('save', (next) => {
    const user = this
    if (user.isModified('password') || user.isNew) {
        bcrypt.genSalt(10, (err, salt)  => {
            if (err) { return next(err) }
            bcrypt.hash(user.password, salt, (err, hash) => {
                if (err) { return next(err) }
                user.password = hash
                next()
            })
        })
    }
})

UserSchema.methods.comparePassword = function (password) {
    const user = this
    return new Promise((resolve, reject) => {
        if (process.env.APP_ENV == 'test') {
            resolve(password == user.password)
        } else {
            bcrypt.compare(password, user.password, function (err, isMatch) {
                if (err) { return reject(err) }
                resolve(isMatch)
            })
        }
    })
}

const User = mongoose.model('User', UserSchema)

module.exports = User 