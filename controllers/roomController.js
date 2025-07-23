require("dotenv").config()
const Room = require("../models/Room");


async function buildRoom(req, res) {
  const roomCode = req.params.code;
  // is this user the owner of the room?
  let isOwner = false;
  let displayName = "";
  if (res.locals.loggedIn) {
    const room = await Room.findOne({roomCode: roomCode}).exec();
    isOwner = room.ownerId === res.locals.loggedIn.googleId;
    displayName = res.locals.loggedIn.displayName;
  }

  // TODO: replace this with a card deck selection
  const fibonacci = ['1', '2', '3', '5', '8', '13', '?'];

  res.render("room/index", {
    title: "Your Point Is...",
    roomCode: roomCode,
    isOwner: isOwner,
    displayName: displayName,
    cardDeck: fibonacci
  });
}

module.exports = {
  buildRoom
}