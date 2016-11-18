'use strict'

const userModel = require('../../db/models/user')
const logger = require('../../logger')
const jwt = require('jsonwebtoken')
const validator = require('validator')

const lengthValidatorOptions = {min: 5, max: 100}

function getDetails(req, res, next) {
    if (req.user) {
        return res.send(req.user)
    }
    return next(new Error('Invalid user!'))
}

function registerUser(req, res, next) {
    const email = req.body.email
    const password = req.body.password
    const name = req.body.name

    if (validator.isEmail(email) &&
        validator.isLength(password, lengthValidatorOptions) &&
        validator.isLength(name, lengthValidatorOptions)) 
        {
            userModel.create({email, password, name}, (err, user) => {
                if (err) {
                    return next(err)
                } else if (!user) {
                    return next(new Error('Could not create user!'))
                }
                res.status(201).send({ message: 'Success!' }) 
        })
    } else {
        next(new Error(`User sign up invalid payload!`))
    }
}

function authenticateUser(req, res, next) {
    
    const email = req.body.email
    const password = req.body.password

    if (validator.isEmail(email) && 
        validator.isLength(password, lengthValidatorOptions)) {
            // payload valid
            userModel.findOne({email}, (err, user) => {
                if (err) {
                    return next(err)
                } else if (!user) {
                    return res.status(403).send({ message: 'Authentication failed.' })
                }

                user.comparePassword(password).then((isValid) => {
                    if (isValid == true) {
                        const token = jwt.sign(user.toJSON(), process.env.SECRET)
                        res.send({token})
                    } else {
                        return res.status(403).send({ message: 'Authentication failed.' })
                    }
                }).catch((err) => {
                    next(err)
                })
            })
        } else {
            next(new Error(`User login invalid payload!`))
        }
}

const routes = { GET: {'/details' : getDetails},
                 POST: {'/auth' : authenticateUser},
                 PUT: {'/register' : registerUser}
               }


module.exports = {routes}