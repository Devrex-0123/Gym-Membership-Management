const express = require('express');
const router = express.Router();
const { createExpense, getExpenses } = require('../controllers/expenseController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, adminOnly, getExpenses)
    .post(protect, adminOnly, createExpense);

module.exports = router;
