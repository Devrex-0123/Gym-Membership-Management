// backend/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const {
    processWalkIn,
    processMembership,
    getDailySummary,
    getRecentTransactions,
    getTransactionHistory,
    getTransactionReport
} = require('../controllers/transactionController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/walk-in', protect, processWalkIn);
router.post('/membership', protect, processMembership);
router.get('/summary', protect, getDailySummary);
router.get('/history', protect, getTransactionHistory);
router.get('/report', protect, adminOnly, getTransactionReport);
router.get('/recent', protect, getRecentTransactions);

module.exports = router;