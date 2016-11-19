'use strict'

const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const util = require('util')
const jwt = require('express-jwt')

const router = require('./router')
const logger = require('../logger')

const DEFAULT_PORT_VALUE = 8081
const BASE_URL = '/api'

class Server {
  constructor(port = DEFAULT_PORT_VALUE) {
    this.port = port
    this.app = express()
    _configure(this.app)
  }

  start() {
    return new Promise((resolve, reject) => {
      this.srv = this.app.listen(this.port, () => {
        resolve(this.port)
      })
    })
  }

  stop() {
    return new Promise((resolve, reject) => {
      this.srv.close(() => {
        this.srv = null
        resolve()
      })
    })
  }
}

function _configure(app) {

  app.use(morgan('dev'))

  app.use(bodyParser.json())

  app.use(jwt({ secret: process.env.SECRET })
    .unless({
      path: [`${BASE_URL}/users/auth`,
      `${BASE_URL}/users/register`]
    })
  )

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')

    console.log('Sending headers:\n\n' + console.log(JSON.stringify(res.headers)))
    next()
  })

  const expressRouter = express.Router()
  app.use(BASE_URL, expressRouter)
  router.configureRoutes(expressRouter)
  // config error middleware
  app.use((err, req, res, next) => {
    const headers = util.inspect(req.headers, false, null)
    const body = util.inspect(req.body, false, null)
    logger.err(`======= Request error =======
      \n\n--- URL ---\t${req.url}
      \n\n--- Headers ---\n\n${headers}
      \n\n--- Body ---\n\n${body}
      \n\n-- Error ---\n\n${err}
      \n\n===============================`)

    // if (process.env.APP_ENV == 'test') {
    //   logger.err(err.stack)
    // }
    res.status(500).send({ "msg": 'Unknown error' })
  })
}

module.exports = Server