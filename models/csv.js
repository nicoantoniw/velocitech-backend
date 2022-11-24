const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const csvSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
    },
    key: {
        type: String,
    },
    processed: {
        type: String,
        default: 'Not processed',
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Csv', csvSchema);
