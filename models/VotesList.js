const mongoose = require('mongoose');

const votesListSchema = new mongoose.Schema({
    id: mongoose.Types.ObjectId,
    roomCode: String,
    storyId: String,
    voteAverage: String,
    votes: Array,
})

module.exports = mongoose.model('Votes List', votesListSchema);