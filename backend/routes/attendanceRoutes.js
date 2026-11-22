const express = require('express');
const router = express.Router();
const {
    checkInMember,
    getTodayAttendance,
    getMyAttendance,
    getAttendanceReport
} = require('../controllers/attendanceController');
const { protect, memberProtect, adminOnly } = require('../middleware/authMiddleware');

router.post('/check-in', protect, checkInMember);
router.get('/today', protect, getTodayAttendance);
router.get('/me', memberProtect, getMyAttendance);
router.get('/report', protect, adminOnly, getAttendanceReport);

module.exports = router;
