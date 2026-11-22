// routes/memberRoutes.js
const express = require('express');
const router = express.Router();
const { registerMember, getMembers, getMemberById, getMyMemberProfile } = require('../controllers/memberController');
const { getRenewalCandidates, markReminderSent } = require('../controllers/renewalController');
const { protect, memberProtect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getMembers)
    .post(protect, registerMember);

router.get('/me', memberProtect, getMyMemberProfile);
router.get('/renewals', protect, getRenewalCandidates);
router.post('/renewals/:id/mark-sent', protect, markReminderSent);
router.get('/:id', protect, getMemberById);

module.exports = router;