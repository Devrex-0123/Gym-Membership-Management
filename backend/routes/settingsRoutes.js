const express = require('express');
const { getRates, getPublicMembershipRates, getPublicRates, updateRates } = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/public-membership-rates', getPublicMembershipRates);
router.get('/public-rates', getPublicRates);
router.get('/rates', protect, getRates);
router.put('/rates', protect, adminOnly, updateRates);

module.exports = router;
