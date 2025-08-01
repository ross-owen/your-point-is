require('dotenv').config();
const Room = require('../models/Room');

async function getUserRooms(req, res) {
  const userId = req.user.id;
  const rooms = await Room.find({ ownerId: userId }).sort({ _id: -1 });
  res.status(200).json(rooms);
}

async function deleteRoom(req, res) {
  try {
    await Room.deleteOne({roomCode: req.params.code});
    res.status(200);
  } catch (e) {
    if (e.status) {
      res.status(400);
    } else {
      res.status(500);
    }
  }
}

module.exports = {
  getUserRooms,
  deleteRoom,
};
