const express = require('express');
const router = express.Router();
const { loginStaff, loginMember, registerStaff } = require('../controllers/authController');
const { getCashierDirectory } = require('../controllers/directoryController');
const { protect, adminOnly } = require('../middleware/authMiddleware'); // Add adminOnly here

router.post('/staff-login', loginStaff);
router.post('/member-login', loginMember);
router.post('/register-staff', protect, adminOnly, registerStaff); // Protected: Admin only
router.get('/staff', protect, adminOnly, getCashierDirectory);

module.exports = router;
