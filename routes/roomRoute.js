const express = require('express')
const router = new express.Router()
const controller = require('../controllers/roomController')
const utilities = require('../utilities')


router.get('/:code', utilities.handleErrors(controller.buildWaitingRoom))


module.exports = router
