require("dotenv").config();
const Room = require("./models/Room");

async function buildDashboard(req, res) {
  res.render("dashboard/index", { title: "Dashboard" });
}

async function createRoom(req, res) {
  try {
    const room_code = "";
    const newRoom = new Room({
      room_code: room_code,
      host_name: req.user.displayName,
      host_socket_id: "",
      guests: [],
    });
    await newRoom.save();
    res.redirect(`/room?${room_code}`);
  } catch (error) {
    res.status(500).send("Failed to create room");
  }
}

module.exports = {
  buildDashboard,
  createRoom,
};
