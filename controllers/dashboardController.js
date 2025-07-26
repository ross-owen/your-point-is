require('dotenv').config();
const Room = require('../models/Room');

async function buildDashboard(req, res) {
  const userName = req.user.displayName || 'Guest';
  res.render('dashboard/index', { title: 'Dashboard', userName: userName });
}

async function getUserRooms(req, res)
{
  const userId = req.user.id;
  const rooms = await Room.find({ ownerId: userId }).sort({ _id: -1});
  res.json(rooms);
}

async function createRoom(req, res) {
  try {
    var codeFoundInDb = true;
    var room_code = '';
    while (codeFoundInDb) {
      room_code = Math.random().toString(36).substring(2, 7);
      codeFoundInDb = await validateCode(room_code);
    }
    const newRoom = new Room({
      roomCode: room_code,
      ownerId: req.user.id,
      guests: [],
    });
    await newRoom.save();
    res.redirect(`/room?${room_code}`);
  } catch (error) {
    res.status(500).send('Failed to create room');
  }
}

async function validateCode(code) {
  try {
    const room = await Room.findOne({ room_code: code });
    return room;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  buildDashboard,
  createRoom,
  getUserRooms
};
