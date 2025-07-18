const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
<<<<<<< Updated upstream
    id: mongoose.Types.ObjectId,
    room_code: String,
    host_name: String,
    host_socket_id: String,
    guests: Array,
})
=======
  id: String,
  code: String,
});
>>>>>>> Stashed changes

module.exports = mongoose.model('Room', roomSchema);