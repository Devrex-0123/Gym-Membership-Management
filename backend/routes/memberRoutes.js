// routes/memberRoutes.js
const express = require('express');
const router = express.Router();
const { registerMember, getMembers, getMemberById, getMyMemberProfile } = require('../controllers/memberController');
const { getMemberDirectory } = require('../controllers/directoryController');
const { getRenewalCandidates, markReminderSent } = require('../controllers/renewalController');
const { protect, memberProtect, cashierOnly } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getMembers)
    .post(protect, registerMember);

router.get('/me', memberProtect, getMyMemberProfile);
router.get('/renewals', protect, getRenewalCandidates);
router.post('/renewals/:id/mark-sent', protect, markReminderSent);
router.get('/directory', protect, cashierOnly, getMemberDirectory);
router.get('/:id', protect, getMemberById);

module.exports = router;