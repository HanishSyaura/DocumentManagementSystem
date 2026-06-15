const express = require('express')
const epcRegistryController = require('../controllers/epcRegistryController')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

router.use(authenticate)

router.get('/status', epcRegistryController.getStatus)
router.get('/', epcRegistryController.listRecords)
router.get('/export', epcRegistryController.exportRecords)

module.exports = router
