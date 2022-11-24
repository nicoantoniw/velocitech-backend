const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const certificateSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    licenseRegistrationDate: {
        type: Date,
        required: true
    },
    licenseExpirationDate: {
        type: Date,
        required: true
    },
    licenseCode: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Certificate', certificateSchema);
