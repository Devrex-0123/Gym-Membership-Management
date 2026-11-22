// controllers/memberController.js
const Member = require('../models/Member');

// @desc    Register new member
// @route   POST /api/members
const registerMember = async (req, res) => {
    const { first_name, last_name, phone, password } = req.body;

    // Check if member exists
    const memberExists = await Member.findOne({ phone });
    if (memberExists) {
        return res.status(400).json({ message: 'Member already exists with this phone number' });
    }

    // Generate unique member code (e.g., GYM-1001)
    const lastMember = await Member.findOne().sort({ createdAt: -1 });
    const member_code = lastMember ? `GYM-${parseInt(lastMember.member_code.split('-')[1]) + 1}` : 'GYM-1001';

    const member = await Member.create({
        member_code,
        first_name,
        last_name,
        phone,
        password, // Mongoose pre-save hook will hash this automatically
    });

    if (member) {
        res.status(201).json({
            _id: member._id,
            member_code: member.member_code,
            first_name: member.first_name,
            last_name: member.last_name,
            phone: member.phone,
            membership_status: member.membership_status,
            expiry_date: member.expiry_date
        });
    } else {
        res.status(400).json({ message: 'Invalid member data' });
    }
};

// @desc    Get/Search members
// @route   GET /api/members
const getMembers = async (req, res) => {
    const { search } = req.query;
    
    let query = {};
    if (search) {
        // Search by name or phone
        query = {
            $or: [
                { first_name: { $regex: search, $options: 'i' } },
                { last_name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { member_code: { $regex: search, $options: 'i' } }
            ]
        };
    }

    const members = await Member.find(query).select('-password').sort({ createdAt: -1 });
    res.json(members);
};

// @desc    Get member by ID (for QR scan)
// @route   GET /api/members/:id
const getMemberById = async (req, res) => {
    const member = await Member.findById(req.params.id).select('-password');
    if (member) {
        res.json(member);
    } else {
        res.status(404).json({ message: 'Member not found' });
    }
};

const getMyMemberProfile = (req, res) => {
    const { _id, member_code, first_name, last_name, phone, photo_url, membership_status, expiry_date } = req.member;
    res.json({
        _id,
        member_code,
        first_name,
        last_name,
        full_name: `${first_name} ${last_name}`,
        phone,
        photo_url,
        membership_status,
        expiry_date
    });
};

module.exports = { registerMember, getMembers, getMemberById, getMyMemberProfile };