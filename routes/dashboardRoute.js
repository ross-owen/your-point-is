const express = require('express');
const router = new express.Router();
const controller = require('../controllers/dashboardController');
const utilities = require('../utilities');
const { ensureAuthenticated } = require('../utilities');

router.get(
  '/',
  ensureAuthenticated,
  utilities.handleErrors(controller.buildDashboard)
);

router.post(
  '/',
  ensureAuthenticated,
  utilities.handleErrors(controller.createRoom)
);
module.exports = router;
