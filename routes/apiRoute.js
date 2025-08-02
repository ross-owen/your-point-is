const express = require('express');
const router = new express.Router();
const controller = require('../controllers/apiController');
const utilities = require('../utilities');
const { ensureAuthenticated, ensureOwnedRoom } = require('../utilities');

router.get(
  '/rooms',
  ensureAuthenticated,
  utilities.handleErrors(controller.getUserRooms)
);

router.delete(
  '/room/:code',
  ensureAuthenticated,
  ensureOwnedRoom,
  utilities.handleErrors(controller.deleteRoom)
);

module.exports = router;
