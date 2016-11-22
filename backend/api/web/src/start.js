'use strict'

const Server = require('./server/server')
const logger = require('./logger')
const mongoAdapter = require('./db/mongoAdapter')

const User = require('./db/models/user')

const server = new Server(process.env.HTTP_PORT)

server.start().then((port) => {
    console.log(` =========> Web app listening on port ${port}`)
    return mongoAdapter.connect()
}).then((address) => {
    console.log(` =========> DB connected to ${address}`)
    const userdict = {email: 'test@test.com', name: 'John Test', password: 'test123'}
    User.find({email: 'test@test.com'}, (err, results) => {
        if (results && results.length == 0) {
            console.log('Creating test user...')
            new User(userdict).save((err) => {
                if (err) { return console.log('Err while saving test user: ' + err)}
                console.log('Test user saved successfully!')
            })
        } else {
            console.log('Test user found!')
        }
    })
}).catch((err) => {
    console.error(` =========> Error on DB connect: ${err}`)
})