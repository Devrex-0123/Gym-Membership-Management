const express = require('express');
const { getRates, updateRates } = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/rates', protect, getRates);
router.put('/rates', protect, adminOnly, updateRates);

module.exports = router;
