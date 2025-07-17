const mongoose = require('mongoose');

const votesListSchema = new mongoose.Schema({
    id: mongoose.Types.ObjectId,
    room_code: String,
    story_id: String,
    vote_average: String,
    votes: Array,
})

module.exports = mongoose.model('Votes List', votesListSchema);