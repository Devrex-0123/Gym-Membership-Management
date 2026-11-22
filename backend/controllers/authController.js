// controllers/authController.js
const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');
const Member = require('../models/Member');

// Generate JWT
const generateToken = (id, tokenType) => {
    return jwt.sign({ id, tokenType }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Login Staff (Cashier/Admin)
// @route   POST /api/auth/staff-login
const loginStaff = async (req, res) => {
    const { username, password } = req.body;

    const staff = await Staff.findOne({ username });

    if (staff && (await staff.matchPassword(password))) {
        res.json({
            _id: staff._id,
            username: staff.username,
            full_name: staff.full_name,
            role: staff.role,
            token: generateToken(staff._id, 'staff'),
        });
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
};

// @desc    Login Member (Gym Rat)
// @route   POST /api/auth/member-login
const loginMember = async (req, res) => {
    const { phone, password } = req.body;

    const member = await Member.findOne({ phone });

    if (member && (await member.matchPassword(password))) {
        res.json({
            _id: member._id,
            member_code: member.member_code,
            full_name: `${member.first_name} ${member.last_name}`,
            role: 'member',
            membership_status: member.membership_status,
            expiry_date: member.expiry_date,
            token: generateToken(member._id, 'member'),
        });
    } else {
        res.status(401).json({ message: 'Invalid phone number or password' });
    }
};

// @desc    Register a new staff member (Admin only)
// @route   POST /api/auth/register-staff
const registerStaff = async (req, res) => {
    const { username, password, full_name, role, shift_tag } = req.body;

    const userExists = await Staff.findOne({ username });
    if (userExists) {
        return res.status(400).json({ message: 'Username already exists' });
    }

    const staff = await Staff.create({
        username,
        password, // The pre-save hook will hash this automatically
        full_name,
        role: role || 'cashier',
        shift_tag: shift_tag || 'flexible'
    });

    if (staff) {
        res.status(201).json({
            _id: staff._id,
            username: staff.username,
            full_name: staff.full_name,
            role: staff.role,
        });
    } else {
        res.status(400).json({ message: 'Invalid staff data' });
    }
};

// Don't forget to add it to the exports at the bottom!
module.exports = { loginStaff, loginMember, registerStaff };
