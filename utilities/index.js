require("dotenv").config()
const Room = require("../models/Room");

const Util = {}

Util.handleErrors = fn => (req, res, next) => Promise
    .resolve(fn(req, res, next))
    .catch(next)

Util.checkLogin = (req, res, next) => {
  if (res.locals.loggedIn) {
    next()
  } else {
    req.flash("notice", "Please log in")
    return res.redirect("/auth/login")
  }
}

Util.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
};

function roomNotFound(roomCode, next) {
  console.warn(`Room "${roomCode}" is not found.`);

  const error = new Error("Room Not Found")
  error.status = 404;

  return next(error)
}

Util.requireRoom = (req, res, next) => {
  const roomCode = req.params.code;
  if (!roomCode) {
    return roomNotFound("", next);
  }

  Room.findOne({roomCode: roomCode})
      .then(room => {
        if (room) {
          next();
        } else {
          return roomNotFound(roomCode, next);
        }
      })
      .catch(err => {
        console.error("Error finding room:", err);
        const error = new Error("Database Error while searching for room.");
        error.status = 500; // Internal Server Error
        return next(error);
      });
};

module.exports = Util