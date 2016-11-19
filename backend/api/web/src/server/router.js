'use strict'

const userHandler = require('./handlers/userHandler')

/**
 * Applies the local routes to the express router.
 * 
 * @param {express.Router} expressRouter
 */
function configureRoutes(expressRouter) {
    applyLocalRoutes(userHandler, expressRouter, '/users')
}

/**
 * Applies the routes defined in own router classes to the express router.
 * 
 * @param {any} fromHandler
 * @param {express.Router} toRouter
 * @param {String} basePath
 */
function applyLocalRoutes(fromHandler, toRouter, basePath) {
    for (let method in fromHandler.routes) {
        for (let path in fromHandler.routes[method]) {
            let obj = toRouter.route(basePath + path)
            let handler = fromHandler.routes[method][path]
            switch(method) {
                case 'GET':
                    obj.get(handler)
                    break
                case 'POST':
                    obj.post(handler)
                    break
                case 'PUT':
                    obj.put(handler)
                    break
            }
        }
    }
}

module.exports = {configureRoutes}