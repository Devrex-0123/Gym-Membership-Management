const mongoose = require('mongoose');
const Member = require('../models/Member');
const MembershipReminder = require('../models/MembershipReminder');
const Attendance = require('../models/Attendance');

const REMINDER_WINDOW_DAYS = 7;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const parsePositiveInteger = (value, defaultValue) => {
    if (value === undefined) return defaultValue;
    if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getRenewalCandidates = async (req, res) => {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, DEFAULT_PAGE_SIZE);
    const status = req.query.status || 'expiring';
    const search = req.query.search || '';
    if (page === null || page < 1 || limit === null || limit < 1 || limit > MAX_PAGE_SIZE) {
        return res.status(400).json({ message: 'Page must be positive and limit must be between 1 and 100' });
    }
    if (!['all', 'expiring', 'expired'].includes(status)) {
        return res.status(400).json({ message: 'Invalid renewal status filter' });
    }
    if (typeof search !== 'string' || search.length > 100) {
        return res.status(400).json({ message: 'Search must be 100 characters or fewer' });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const windowEnd = new Date(todayStart);
    windowEnd.setDate(windowEnd.getDate() + REMINDER_WINDOW_DAYS);
    windowEnd.setHours(23, 59, 59, 999);

    const filter = {
        membership_status: { $in: ['active', 'expired'] },
        is_blacklisted: { $ne: true }
    };
    const expiryFilter = {};
    if (status === 'expired') {
        expiryFilter.$lt = todayStart;
    } else if (status === 'expiring') {
        expiryFilter.$gte = todayStart;
        expiryFilter.$lte = windowEnd;
    } else {
        expiryFilter.$lte = windowEnd;
    }
    filter.expiry_date = expiryFilter;

    if (search.trim()) {
        const searchPattern = new RegExp(escapeRegex(search.trim()), 'i');
        filter.$or = [
            { first_name: searchPattern },
            { last_name: searchPattern },
            { phone: searchPattern },
            { member_code: searchPattern }
        ];
    }

    const [members, total] = await Promise.all([
        Member.find(filter)
            .select('member_code first_name last_name phone membership_status expiry_date')
            .sort({ expiry_date: 1, _id: 1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Member.countDocuments(filter)
    ]);

    if (members.length === 0) {
        return res.json({
            members: [],
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    }

    const reminderFilters = members.map((member) => ({
        member_id: member._id,
        expiry_date: member.expiry_date
    }));
    const [reminders, recentVisits] = await Promise.all([
        MembershipReminder.find({ $or: reminderFilters })
            .populate('sent_by', 'full_name')
            .sort({ sent_at: -1 }),
        Attendance.aggregate([
            { $match: { member_id: { $in: members.map((member) => member._id) } } },
            { $sort: { createdAt: -1 } },
            { $group: { _id: '$member_id', last_visit: { $first: '$createdAt' } } }
        ])
    ]);

    const reminderByMember = new Map(
        reminders.map((reminder) => [`${reminder.member_id}:${new Date(reminder.expiry_date).getTime()}`, reminder])
    );
    const visitByMember = new Map(recentVisits.map((visit) => [String(visit._id), visit.last_visit]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    res.json({
        members: members.map((member) => {
            const expiryDay = new Date(member.expiry_date);
            expiryDay.setHours(0, 0, 0, 0);
            const reminder = reminderByMember.get(`${member._id}:${new Date(member.expiry_date).getTime()}`);
            return {
                _id: member._id,
                member_code: member.member_code,
                full_name: `${member.first_name} ${member.last_name}`,
                phone: member.phone,
                membership_status: member.membership_status,
                expiry_date: member.expiry_date,
                renewal_status: expiryDay < today ? 'expired' : 'expiring',
                last_visit: visitByMember.get(String(member._id)) || null,
                reminder: reminder ? {
                    sent_at: reminder.sent_at,
                    sent_by: reminder.sent_by
                } : null
            };
        }),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
};

const markReminderSent = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid member ID' });
    }

    const member = await Member.findById(req.params.id)
        .select('member_code first_name last_name membership_status expiry_date is_blacklisted');
    if (!member) {
        return res.status(404).json({ message: 'Member not found' });
    }
    if (member.is_blacklisted) {
        return res.status(403).json({ message: 'Cannot record a reminder for a blacklisted member' });
    }
    if (!['active', 'expired'].includes(member.membership_status) || !member.expiry_date) {
        return res.status(400).json({ message: 'Member does not have a membership expiry to remind about' });
    }

    const reminderData = {
        member_id: member._id,
        expiry_date: member.expiry_date,
        sent_by: req.user._id
    };

    try {
        const reminder = await MembershipReminder.create(reminderData);
        return res.status(201).json({
            alreadySent: false,
            message: `Reminder recorded for ${member.first_name} ${member.last_name}.`,
            reminder
        });
    } catch (error) {
        if (error.code !== 11000) throw error;

        const existingReminder = await MembershipReminder.findOne({
            member_id: member._id,
            expiry_date: member.expiry_date
        }).populate('sent_by', 'full_name');
        if (!existingReminder) throw error;
        return res.json({
            alreadySent: true,
            message: 'A reminder has already been recorded for this membership expiry.',
            reminder: existingReminder
        });
    }
};

module.exports = { getRenewalCandidates, markReminderSent };
