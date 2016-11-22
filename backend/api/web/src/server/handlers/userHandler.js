'use strict'

const userModel = require('../../db/models/user')
const imageModel = require('../../db/models/image')
const recordModel = require('../../db/models/record')
const logger = require('../../logger')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const tesseract = require('node-tesseract')
const fs = require('fs')
const kue = require('kue')
const easyimg = require('easyimage');

const jobs = kue.createQueue({ redis: 'redis://redis:6379' })
const lengthValidatorOptions = { min: 5, max: 100 }

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
        validator.isLength(name, lengthValidatorOptions)) {
        userModel.create({ email, password, name }, (err, user) => {
            if (err) {
                return next(err)
            } else if (!user) {
                return next(new Error('Could not create user!'))
            }
            res.status(201).send({ message: 'Success!' })
        })
    } else {
        next(new Error(`email ${validator.isEmail(email)
            } pwd ${validator.isLength(password, lengthValidatorOptions)
            } name ${validator.isLength(name, lengthValidatorOptions)}User sign up invalid payload!`))
    }
}

function authenticateUser(req, res, next) {
    const email = req.body.email
    const password = req.body.password

    if (validator.isEmail(email) &&
        validator.isLength(password, lengthValidatorOptions)) {
        // payload valid
        userModel.findOne({ email }, (err, user) => {
            if (err) {
                return next(err)
            } else if (!user) {
                return res.status(403).send({ message: 'Authentication failed.' })
            }

            user.comparePassword(password).then((isValid) => {
                if (isValid == true) {
                    const token = jwt.sign(user.toJSON(), process.env.SECRET)
                    res.send({ token })
                } else {
                    return res.status(403).send({ message: 'Authentication failed.' })
                }
            }).catch((err) => {
                next(err)
            })
        })
    } else {
        next(new Error('User login invalid payload!'))
    }
}

function getHistory(req, res, next) {
    const email = req.user.email
    if (validator.isEmail(email)) {
        userModel.findOne({ email }, (err, user) => {
            if (err) {
                return next(err)
            } else if (!user) {
                return res.status(403).send({ message: 'User not found' })
            }
            recordModel.find({ owner: user }, (errrec, records) => {
                if (errrec) {
                    return next(errrec)
                } else if (!records) {
                    return res.status(403).send({ message: 'No records found' })
                }
                let result = []
                records.forEach((record) => {
                    record.populate('images', (err2, data) => {
                        if (err2) {
                            return next(err2)
                        } else if (!records) {
                            return res.status(403).send({ message: 'populate failed' })
                        }
                        let resultrecord = {
                            id: data.id,
                            thumbnail: data.thumbnail,
                            creationtime: data.creationtime,
                            ocrlist: []
                        }
                        data.images.forEach((image) => {
                            resultrecord.ocrlist.push(image.ocr)
                        })
                        result.push(resultrecord)
                        if (result.length === records.length) {
                            return res.status(201).send(result)
                        }
                    })
                })
            })
        })   
    }
}

function saveImage(req, res, next) {
    const images = req.body.images
    const email = req.user.email
    if (!Array.isArray(images)) {
        return res.status(403).send({ message: 'You didn\'t submit a list of images' })
    }
    const validateimgs = images.forEach((img) => { if (!validator.isBase64(img.base64.replace(/^data:image\/(jpeg|png);base64,/, ''))) { return false } })

    if (validateimgs === false) { return res.status(403).send({ message: 'Image is not base64' })}
    userModel.findOne({ email }, (err, user) => {
        if (err) {
            return next(err)
        } else if (!user) {
            return res.status(403).send({ message: 'User not found' })
        }
        recordModel.create({ owner: user, creationtime: new Date() }, (err2, record) => {
            if (err2) {
                return next(err2)
            } else if (!record) {
                return next(new Error('Could not create a record!'))
            }

            const channel = randomString()
            sendMessage(req.app.get('socketio').of(`${channel}`), {
                status: 'initialize channel'
            })
            console.log(channel, req.app.get('socketio').of(`${channel}`).connected)
            res.status(201).send({ wschannel: `${channel}` })
            images.forEach((img, i) => {
                imageModel.create({ record: record.id, base64: img.base64.replace(/^data:image\/(jpeg|png);base64,/, '') }, (err3, image) => {
                    if (err3) {
                        return sendMessage(req.app.get('socketio').of(`${channel}`), {
                            record: record.id,
                            status: 'error'
                        })
                    } else if (!image) {
                        return sendMessage(req.app.get('socketio').of(`${channel}`), {
                            record: record.id,
                            status: 'error'
                        })
                    }
                    if (i === 0) {
                        const thumbnail = jobs.create('thumbnailJob', {
                            title: `converting ${image.id} into thumbnail`,
                            img: image.id
                        })
                        thumbnail.on('complete', (result) => {
                            logger.debug(`completed job ${thumbnail.id} with a result: ${result}`);
                            sendMessage(req.app.get('socketio').of(`${channel}`), {
                                record: image.record,
                                image: image.id,
                                status: `Thumbnail ${image.id} finished`,
                                thumbnail: result.thumbnail
                            })
                        })
                        thumbnail.save((err4) => {
                            if (err4) {
                                logger.err(`failed to queue job ${thumbnail.id}: ${err4}`);
                            } else {
                                logger.debug(`queued job ${thumbnail.id}`)
                            }
                        })
                    }

                    record.images.push(image._id)
                    record.save((err4) => {
                        if (err4) {
                            logger.err(`failed to push to record ${record.id}: ${err4}`);
                        } else {
                            logger.debug(`Record updated ${record.id}`)
                        }
                    })
                    sendMessage(req.app.get('socketio').of(`${channel}`), {
                            record: image.record,
                            image: image.id,
                            status: 'in queue'
                        })
                    const job = jobs.create('imageJob', {
                        title: `converting ${image.id} to text`,
                        img: image.id
                    })
                    job.on('complete', (result) => {
                        try {
                            logger.debug(`completed job ${job.id} with a result: ${result}`);
                            sendMessage(req.app.get('socketio').of(`${channel}`), {
                                record: image.record,
                                image: image.id,
                                status: 'finished',
                                result: result.text,
                                benchmark: new Date().getMilliseconds() - result.starttime
                            })
                        } catch (error) {
                            logger.err(`result validation failed on job ${job.id} with a result: ${result}`);   
                        }
                    })
                    job.save((err4) => {
                        if (err4) {
                            logger.err(`failed to queue job ${job.id}: ${err4}`);
                        } else {
                            logger.debug(`queued job ${job.id}`)
                        }
                    })
                })
            })
        })
    })
}

jobs.process('thumbnailJob', (job, done) => {
    try {
        const random = Math.floor(Math.random() * 100000000000)
        imageModel.findById({ _id: job.data.img }, (err, image) => {
            if (err) {
                logger.err(`image not found: ${err}`)
                return done(err)
            } else {
                logger.debug(`${new Date()}: image ${image._id} found`)
                job.progress(0, 2)
                fs.writeFile(`${__dirname}/temp${random}.jpg`, image.base64, 'base64', (errfile) => {
                    if (errfile) {
                        return done(errfile)
                    } else {
                        logger.debug(`${new Date()}: ${__dirname}/temp${random}.jpg created`)
                        job.progress(1, 2)
                        easyimg.thumbnail({
                            src: `${__dirname}/temp${random}.jpg`, dst: `${__dirname}/thumbnail${random}.jpg`,
                            width: 128, height: 128,
                            x: 0, y: 0
                        }).then((file, reject) => {
                            if (reject) {
                                fs.unlink(`${__dirname}/temp${random}.jpg`, (err2) => {
                                    if (err2) {
                                        return done(`${new Date()}: ${err} error occured and couldn't delete temp${random}.jpg!`)
                                    } else {
                                        return done(`${new Date()}: ${err} error occured and temp${random}.jpg deleted`)
                                    }
                                })
                            } else {
                                const bitmap = fs.readFileSync(file.path)
                                const base64 = new Buffer(bitmap).toString('base64')
                                recordModel.findByIdAndUpdate(image.record, { $set: { thumbnail: base64 } }, { new: true }, (err3, doc) => {
                                    if (err3) {
                                        logger.err(`${new Date()}: save thumbnail to database ${err3}`)
                                        return done(`${new Date()}:: save thumbnail to database ${file.path}!`)
                                    } else {
                                        logger.debug(`${new Date()}: saved thumbnail to database ${doc._id}`)
                                    }
                                })
                                fs.unlink(`${__dirname}/temp${random}.jpg`, (err2) => {
                                    if (err2) {
                                        return done(`${new Date()}: ${err} error occured and couldn't delete temp${random}.jpg!`)
                                    } else {
                                        return done(`${new Date()}: ${err} error occured and temp${random}.jpg deleted`)
                                    }
                                })
                                fs.unlink(`${__dirname}/thumbnail${random}.jpg`, (err2) => {
                                    if (err2) {
                                        return done(`${new Date()}: ${err} error occured and couldn't delete temp${random}.jpg!`)
                                    } else {
                                        return done(`${new Date()}: ${err} error occured and temp${random}.jpg deleted`)
                                    }
                                })
                                job.progress(2, 2)
                                done(null, { thumbnail: base64 })
                            }
                        })
                    }
                })
            }
        })
    } catch (ex) {
        console.error('Error at thumbnailJob: ', ex)
    }
})

jobs.process('imageJob', (job, done) => {
    try {
        const startTime = new Date().getMilliseconds()
        const random = Math.floor(Math.random() * 100000000000)
        imageModel.findById({ _id: job.data.img }, (err, image) => {
            if (err) {
                logger.err('image not found:' + err)
                return done(err)
            } else {
                logger.debug(`${new Date()}: image ${image._id} found`)
                job.progress(0, 2)
                fs.writeFile(`${__dirname}/temp${random}.jpg`, image.base64, 'base64', (errfile) => {
                    if (errfile) {
                        return done(errfile)
                    } else {
                        logger.debug(`${new Date()}: ${__dirname}/temp${random}.jpg created`)
                        job.progress(1, 2)
                        tesseract.process(`${__dirname}/temp${random}.jpg`, (errtess, text) => {
                            if (errtess) {
                                logger.err(errtess)
                                fs.unlink(`${__dirname}/temp${random}.jpg`, (err2) => {
                                    if (err2) {
                                        return done(`${new Date()}: ${err} error occured and couldn't delete temp${random}.jpg!`)
                                    } else {
                                        return done(`${new Date()}: ${err} error occured and temp${random}.jpg deleted`)
                                    }
                                })
                            } else {
                                fs.unlink(`${__dirname}/temp${random}.jpg`, (err2) => {
                                    if (err2) {
                                        return done(`${new Date()}:: Couldn't delete temp${random}.jpg!`)
                                    } else {
                                        logger.debug(`${new Date()}: tesseract succeed and temp${random}.jpg deleted`)
                                    }
                                })
                                logger.debug(`${new Date()}: image ${image._id} found`)
                                imageModel.findByIdAndUpdate(job.data.img, { $set: { ocr: text } }, { new: true }, (err3, doc) => {
                                    if (err3) {
                                        logger.err(`${new Date()}: save text to database ${err3}`)
                                        return done(`${new Date()}:: Couldn't delete temp${random}.jpg!`)
                                    } else {
                                        logger.debug(`${new Date()}: saved text to database ${doc._id}`)
                                        job.progress(2, 2)
                                        done(null, {text: text, starttime: startTime})
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    } catch (ex) {
        console.error('Error at imageJob: ', ex)
    }
})
function sendMessage(io, message) {
    if(Object.keys(io.connected).length === 0) {
        io.on('connection', function(socket){
            io.emit('news', message)
        })
    } else {
        io.emit('news', message)
    }
}

function randomString() {

    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 10; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text
}

const routes = {
    GET: { '/details': getDetails, '/history': getHistory },
    POST: { '/auth': authenticateUser, '/ocr/post': saveImage },
    PUT: { '/register': registerUser }
}

module.exports = { routes }