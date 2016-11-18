'use strict'

const request = require('request')
const Server = require('../server')
const expect = require('chai').expect

const mongoAdapter = require('../../db/mongoAdapter')
const fixtures = require('../../db/fixtures')

const dummyPort = 8081

const baseURL = `http://localhost:${dummyPort}/api/users`
const authURL = `${baseURL}/auth`
const registerURL = `${baseURL}/register`
const detailsURL = `${baseURL}/details`
const getVMSURL = `${baseURL}/vms`
const vmsStopURL = `${baseURL}/vms/stop`
const vmsStartURL = `${baseURL}/vms/start`

describe('User handler spec', function () {

    var server
    var user

    beforeEach(done => {
        // deep copy hack
        user = JSON.parse(JSON.stringify(fixtures.collections.users[0]))
        
        server = new Server(dummyPort)
        server.start().then((result) => {
            console.log(`Server started: ${result}`)
            return mongoAdapter.connect()
        }).then(() => {
            console.log('Database initialized!')
            return mongoAdapter.dropDatabase()
        }).then(() => {
            console.log('Database reset!')
            return mongoAdapter.loadFixtures(fixtures)
        }).then(() => {
            console.log('Fixtures loaded!')
            done()
        })
    })

    afterEach(done => {
        server.stop().then(() => {
            server = null
            return mongoAdapter.disconnect()
        }).then(() => {
            done()
        })
    })

    // =======>>> Tests for /api/users/auth 

    it('should respond status 200 to a POST request at /api/users/auth', done => {

        req(authURL, 'POST', null, user, (err, res, body) => {
            expect(res.statusCode).to.equal(200)
            expect(body.token).to.not.be.undefined
            done()
        })
    })

    it('should respond status 403 to a POST request at /api/users/auth - wrong password', done => {
        user.password = "dfjdlsjfldskjflkds"

        req(authURL, 'POST', null, user, (err, res, body) => {
            expect(res.statusCode).to.equal(403)
            expect(body.token).to.be.undefined
            done()
        })
    })

    it('should respond status 403 to a POST request at /api/users/auth - wrong email', done => {
        user.email = "ffff@yahoo.com"

        req(authURL, 'POST', null, user, (err, res, body) => {
            expect(res.statusCode).to.equal(403)
            expect(body.token).to.be.undefined
            done()
        })
    })

    it('should respond status 500 to a POST request at /api/users/auth - missing email', done => {
        delete user.email

        req(authURL, 'POST', null, user, (err, res, body) => {
            expect(res.statusCode).to.equal(500)
            expect(body.token).to.be.undefined
            done()
        })
    })

    it('should respond status 500 to a POST request at /api/users/auth - missing password', done => {
        delete user.password

        req(authURL, 'POST', null, user, (err, res, body) => {
            expect(res.statusCode).to.equal(500)
            expect(body.token).to.be.undefined
            done()
        })
    })

    it('should respond status 500 to a POST request at /api/users/auth - invalid password', done => {
        user.password = 'a'

        req(authURL, 'POST', null, user, (err, res, body) => {
            expect(res.statusCode).to.equal(500)
            expect(body.token).to.be.undefined
            done()
        })
    })

    it('should respond status 500 to a POST request at /api/users/auth - invalid email', done => {
        user.email = 'me@.com'

        req(authURL, 'POST', null, user, (err, res, body) => {
            expect(res.statusCode).to.equal(500)
            expect(body.token).to.be.undefined
            done()
        })
    })

    it('should getTokenFromAuth = ok', done => {

        console.log('SENDING: ' + JSON.stringify(user))

        getTokenFromAuth(user, (token) => {
            expect(token).to.not.be.undefined
            expect(token.length).to.be.above(10)
            done()
        })
    })

    it('should getTokenFromAuth = nok', done => {
        delete user.password
        getTokenFromAuth(user, (token) => {
            expect(token).to.be.undefined
            done()
        })
    })
    
    // =======>>> Tests for /api/users/register

    it('should register successfully at PUT /api/users/register', done => {
        user.email = 'something@something.com'

        req(registerURL, 'PUT', null, user, (err, res, body) => {
            expect(res.statusCode).to.equal(201)
            expect(body.message).to.equal('Success!')
            done()
        })
    })

    it('should not register when missing email at PUT /api/users/register', done => {
        delete user.email 

        req(registerURL, 'PUT', null, user, (err, res, body) => {
            expect(res.statusCode).to.equal(500)
            done()
        })
    })

    it('should not register when missing name at PUT /api/users/register', done => {
        delete user.name 

        req(registerURL, 'PUT', null, user, (err, res, body) => {
            expect(res.statusCode).to.equal(500)
            done()
        })
    })

    it('should not register when missing password at PUT /api/users/register', done => {
        delete user.password 

        req(registerURL, 'PUT', null, user, (err, res, body) => {
            expect(res.statusCode).to.equal(500)
            done()
        })
    })

    it('should not register when invalid password at PUT /api/users/register', done => {
       user.password = 'a' 

        req(registerURL, 'PUT', null, user, (err, res, body) => {
            expect(res.statusCode).to.equal(500)
            done()
        })
    })

    it('should not register when invalid email at PUT /api/users/register', done => {
       user.email = 'antilope@.m' 

        req(registerURL, 'PUT', null, user, (err, res, body) => {
            expect(res.statusCode).to.equal(500)
            done()
        })
    })
    
    it('should not register when invalid name at PUT /api/users/register', done => {
       user.password = 'aa' 

        req(registerURL, 'PUT', null, user, (err, res, body) => {
            expect(res.statusCode).to.equal(500)
            done()
        })
    })

    it('should not register when invalid name non string at PUT /api/users/register', done => {
       user.name = 123456 

        req(registerURL, 'PUT', null, user, (err, res, body) => {
            expect(res.statusCode).to.equal(500)
            done()
        })
    })

    // =======>>> Tests for /api/users/details

    it('should send 500 to missing token at GET /api/users/details', done => {
        req(detailsURL, 'GET', null, null, (err, res, body) => {
            expect(res.statusCode).to.equal(500)
            done()
        })
    })

    it('should send 500 to invalid token at GET /api/users/details', done => {
        const auth = {'Authorization' : 'Bearer dfjkhsdfhsdkjfdsjk'}
        req(detailsURL, 'GET', auth, null, (err, res, body) => {
            expect(res.statusCode).to.equal(500)
            done()
        })
    })

    it('should send details when token is correct GET /api/users/details', done => {
        getTokenFromAuth(user, (token) => {
            expect(token).to.not.be.undefined
            const auth = {'Authorization' : `Bearer ${token}`}
            req(detailsURL, 'GET', auth, null, (err, res, body) => {
                expect(res.statusCode).to.equal(200)
                expect(body.name).to.equal(user.name)
                expect(body.email).to.equal(user.email)
                done()
            })
        })
    })
    // =======>>> Tests for /api/users/details

    it ('should get a list of vms', done => {
        getTokenFromAuth(user, token => {
            expect(token).to.not.be.undefined
            const auth = {'Authorization' : `Bearer ${token}`}
            req(getVMSURL, 'GET', auth, null, (err, res, body) => {
                expect(res.statusCode).to.equal(200)
                expect(body.length).to.equal(2)
                done()
            })
        })
    })

    it ('should not get a list of vms', done => {
        getTokenFromAuth(user, token => {
            expect(token).to.not.be.undefined
            const auth = {'Authorization' : `Bearer ${token}dfdsfds`}
            req(getVMSURL, 'GET', auth, null, (err, res, body) => {
                expect(res.statusCode).to.equal(500)
                done()
            })
        })
    })

    const instance = 'ubuntu-xenial-openoffice'

    it ('should stop the vm', done => {
        getTokenFromAuth(user, token => {
            expect(token).to.not.be.undefined
            const auth = {'Authorization' : `Bearer ${token}`}
            req(vmsStopURL, 'POST', auth, {instance}, (err, res, body) => {
                expect(res.statusCode).to.equal(200)
                done()
            })
        })
    })

    it ('should error when stop the vm', done => {
        getTokenFromAuth(user, token => {
            expect(token).to.not.be.undefined
            const auth = {'Authorization' : `Bearer ${token}`}
            req(vmsStopURL, 'POST', auth, null, (err, res, body) => {
                expect(res.statusCode).to.equal(500)
                done()
            })
        })
    })

    it ('should start the vm', done => {
        getTokenFromAuth(user, token => {
            expect(token).to.not.be.undefined
            const auth = {'Authorization' : `Bearer ${token}`}
            req(vmsStartURL, 'POST', auth, {instance}, (err, res, body) => {
                expect(res.statusCode).to.equal(200)
                done()
            })
        })
    })

    it ('should error when start the vm', done => {
        getTokenFromAuth(user, token => {
            expect(token).to.not.be.undefined
            const auth = {'Authorization' : `Bearer ${token}`}
            req(vmsStartURL, 'POST', auth, {'instance' : 'aaaa'}, (err, res, body) => {
                expect(res.statusCode).to.equal(500)
                done()
            })
        })
    })
})

function req(url, method, headers, json, callback) {

    var httpHeaders = headers || {}
    httpHeaders['content-type'] = 'application/json'

    var options = {
        url: url,
        method: method,
        json: true,
        headers: httpHeaders
    }

    if (json) {
        options.json = json
    }

    request(options, callback)
}

function getTokenFromAuth(json, callback) {
    req(authURL, 'POST', null, json, (err, res, body) => {
        callback(body.token)
    })
}