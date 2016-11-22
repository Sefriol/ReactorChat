'use strict'

const mongoose = require('mongoose')

const ImageSchema = new mongoose.Schema({
    record: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Record',
        required: true
    },
    base64: String,
    ocr: String

})

const Image = mongoose.model('Image', ImageSchema)

module.exports = Image 