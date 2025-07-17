const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    id: mongoose.Types.ObjectId,
    room_code: String,
    host_name: String,
    host_socket_id: String,
    guests: Array,
})

module.exports = mongoose.model('Room', roomSchema);