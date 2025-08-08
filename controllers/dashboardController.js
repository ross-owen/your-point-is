require('dotenv').config();
const Room = require('../models/Room');

async function buildDashboard(req, res) {
  const userName = req.user.displayName || 'Guest';
  res.render('dashboard/index', { title: 'Dashboard', userName: userName });
}

async function getUserRooms(req, res) {
  const userId = req.user.id;
  const rooms = await Room.find({ ownerId: userId }).sort({ _id: -1 });
  res.json(rooms);
}

//function to create new room instance in db and redirect to room controller
async function createRoom(req, res) {
  try {
    var codeFoundInDb = true;
    var room_code = '';
    //generate a random code making sure it doesnt exist in the db yet
    while (codeFoundInDb) {
      room_code = Math.random().toString(36).substring(2, 7);
      codeFoundInDb = await validateCode(room_code);
    }

    //new instance of room using Room model
    const newRoom = new Room({
      roomCode: room_code,
      ownerId: req.user.id,
      guests: [],
      cardDeck: req.body.deck || 'fibonacci',
      roomName: req.body.roomName || 'New Room',
      date: new Date()
    });

    //store new room in db
    await newRoom.save();
    //res.redirect(`/room/${room_code}`);
    res.status(201).json({
      roomCode: room_code,
      roomName: newRoom.roomName,
      date: newRoom.date,
      cardDeck: newRoom.cardDeck, 
      message: 'Room created successfully' 
    });
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
  getUserRooms,
};
