const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    id: mongoose.Types.ObjectId,
    roomCode: String,
    ownerId: String,
    guests: Array,
    date : Date
})

module.exports = mongoose.model('Room', roomSchema);