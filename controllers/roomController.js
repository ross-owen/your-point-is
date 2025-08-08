require('dotenv').config();
const Room = require('../models/Room');

async function buildRoom(req, res) {
  const roomCode = req.params.code;
  // is this user the owner of the room?
  let isOwner = false;
  let displayName = '';
  const room = await Room.findOne({ roomCode: roomCode }).exec();
  if (res.locals.loggedIn) {
    isOwner = room.ownerId === req.user.id;
    displayName = res.locals.loggedIn.displayName;
  }

  const fibonacci = ['1', '2', '3', '5', '8', '13', '?'];
  const scrum = ['0', '½', '1', '2', '3', '5', '8', '13', '?'];
  const t_shirt = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '?'];
  const power_of_two = ['1', '2', '4', '8', '16', '32', '64', '?'];

  const deck = room.cardDeck;
  let cardDeck = [];
  if (!deck) {
    return res.status(400).send('No card deck specified for the room');
  } else {
    cardDeck = deck === 'scrum' ? scrum :
    deck === 't_shirt' ? t_shirt :
    deck === 'power_of_two' ? power_of_two : fibonacci;
  }

  res.render('room/index', {
    title: 'Your Point Is...',
    roomCode: roomCode,
    isOwner: isOwner,
    displayName: displayName,
    cardDeck: cardDeck,
    location: req.protocol + '://' + req.get('host') + req.originalUrl,
  });
}

module.exports = {
  buildRoom,
};
