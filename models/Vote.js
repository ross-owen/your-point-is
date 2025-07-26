const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        required: true
    },
    sessionId: {
        type: String,
        required: true
    },
    displayName: {
        type: String,
        required: true
    },
    vote: {
        type: String,
        required: true
    }
});

voteSchema.index({roomCode: 1, sessionId: 1}, {unique: true});

const Vote = mongoose.model('Vote', voteSchema);

module.exports = Vote;