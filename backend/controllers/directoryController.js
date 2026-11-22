const Staff = require('../models/Staff');
const Member = require('../models/Member');
const Attendance = require('../models/Attendance');

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const MEMBER_STATUSES = ['all', 'active', 'expiring', 'expired', 'none'];

const parsePositiveInteger = (value, defaultValue) => {
    if (value === undefined) return defaultValue;
    if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getCashierDirectory = async (req, res) => {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, DEFAULT_PAGE_SIZE);
    const status = req.query.status || 'all';
    const search = req.query.search || '';
    if (page === null || page < 1 || limit === null || limit < 1 || limit > MAX_PAGE_SIZE) {
        return res.status(400).json({ message: 'Page must be positive and limit must be between 1 and 100' });
    }
    if (!['all', 'active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: 'Invalid cashier status filter' });
    }
    if (typeof search !== 'string' || search.length > 100) {
        return res.status(400).json({ message: 'Search must be 100 characters or fewer' });
    }

    const filter = { role: 'cashier' };
    if (status !== 'all') filter.is_active = status === 'active';
    if (search.trim()) {
        const searchPattern = new RegExp(escapeRegex(search.trim()), 'i');
        filter.$or = [
            { full_name: searchPattern },
            { username: searchPattern }
        ];
    }

    const [staff, total] = await Promise.all([
        Staff.find(filter)
            .select('full_name username role shift_tag is_active createdAt')
            .sort({ full_name: 1, _id: 1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Staff.countDocuments(filter)
    ]);

    res.json({
        staff: staff.map((account) => ({
            _id: account._id,
            full_name: account.full_name,
            username: account.username,
            role: account.role,
            shift_tag: account.shift_tag,
            is_active: account.is_active,
            createdAt: account.createdAt
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
};

const getMemberDirectory = async (req, res) => {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, DEFAULT_PAGE_SIZE);
    const status = req.query.status || 'all';
    const search = req.query.search || '';
    if (page === null || page < 1 || limit === null || limit < 1 || limit > MAX_PAGE_SIZE) {
        return res.status(400).json({ message: 'Page must be positive and limit must be between 1 and 100' });
    }
    if (!MEMBER_STATUSES.includes(status)) {
        return res.status(400).json({ message: 'Invalid member status filter' });
    }
    if (typeof search !== 'string' || search.length > 100) {
        return res.status(400).json({ message: 'Search must be 100 characters or fewer' });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const expiringEnd = new Date(todayStart);
    expiringEnd.setDate(expiringEnd.getDate() + 7);
    expiringEnd.setHours(23, 59, 59, 999);
    const conditions = [];

    if (status === 'none') {
        conditions.push({
            $or: [
                { membership_status: 'none' },
                { expiry_date: null }
            ]
        });
    } else if (status === 'expired') {
        conditions.push({
            membership_status: { $in: ['active', 'expired'] },
            expiry_date: { $lt: todayStart }
        });
    } else if (status === 'expiring') {
        conditions.push({
            membership_status: { $in: ['active', 'expired'] },
            expiry_date: { $gte: todayStart, $lte: expiringEnd }
        });
    } else if (status === 'active') {
        conditions.push({
            membership_status: { $in: ['active', 'expired'] },
            expiry_date: { $gt: expiringEnd }
        });
    }

    if (search.trim()) {
        const searchPattern = new RegExp(escapeRegex(search.trim()), 'i');
        conditions.push({
            $or: [
                { first_name: searchPattern },
                { last_name: searchPattern },
                { phone: searchPattern },
                { member_code: searchPattern }
            ]
        });
    }

    const filter = conditions.length === 0 ? {} : conditions.length === 1 ? conditions[0] : { $and: conditions };
    const [members, total] = await Promise.all([
        Member.find(filter)
            .select('member_code first_name last_name phone membership_status expiry_date is_blacklisted createdAt')
            .sort({ first_name: 1, last_name: 1, _id: 1 })
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

    const lastVisits = await Attendance.aggregate([
        { $match: { member_id: { $in: members.map((member) => member._id) } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$member_id', last_visit: { $first: '$createdAt' } } }
    ]);
    const lastVisitByMember = new Map(lastVisits.map((visit) => [String(visit._id), visit.last_visit]));

    res.json({
        members: members.map((member) => {
            let directoryStatus = 'none';
            if (member.membership_status !== 'none' && member.expiry_date) {
                const expiryDay = new Date(member.expiry_date);
                expiryDay.setHours(0, 0, 0, 0);
                directoryStatus = expiryDay < todayStart ? 'expired' : expiryDay <= expiringEnd ? 'expiring' : 'active';
            }

            return {
                _id: member._id,
                member_code: member.member_code,
                full_name: `${member.first_name} ${member.last_name}`,
                phone: member.phone,
                membership_status: member.membership_status,
                directory_status: directoryStatus,
                expiry_date: member.expiry_date,
                is_blacklisted: member.is_blacklisted,
                createdAt: member.createdAt,
                last_visit: lastVisitByMember.get(String(member._id)) || null
            };
        }),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
};

module.exports = { getCashierDirectory, getMemberDirectory };
