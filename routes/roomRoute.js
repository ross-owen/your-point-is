const express = require('express')
const router = new express.Router()
const controller = require('../controllers/roomController')
const utilities = require('../utilities')


router.get('/:code', utilities.requireRoom, utilities.handleErrors(controller.buildRoom))


module.exports = router
