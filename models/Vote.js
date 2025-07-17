const mongoose = require('mongoose');

// The schema includes a unique Id for identifying, the session id of the 
// voter, and the room code
// The vote is a string because there could be a question mark

const voteSchema = new mongoose.Schema({
    id: mongoose.Types.ObjectId,
    room_code: String,
    session_id: String,
    vote: String,
})

module.exports = mongoose.model('Vote', voteSchema);