'use strict'

const mongoose = require('mongoose')

const RecordSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    images: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image',
    }],
    thumbnail: String,
    creationtime: Date
})

const Record = mongoose.model('Record', RecordSchema)

module.exports = Record