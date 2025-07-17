require('dotenv').config()

async function buildWaitingRoom(req, res) {
  const roomCode = req.params.code;
  res.render("room/index", {title: "Your Point Is...", roomCode: roomCode})
}

module.exports = {
  buildWaitingRoom,
}