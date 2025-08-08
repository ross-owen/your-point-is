const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    id: mongoose.Types.ObjectId,
    roomCode: String,
    ownerId: String,
    guests: Array,
    cardDeck: String,
    roomName: String,
    date : Date
})

module.exports = mongoose.model('Room', roomSchema);