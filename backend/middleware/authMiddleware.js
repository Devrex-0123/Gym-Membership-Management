// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');
const Member = require('../models/Member');

const protect = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    let decoded;
    try {
        decoded = jwt.verify(authorization.split(' ')[1], process.env.JWT_SECRET);
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    if (decoded.tokenType && decoded.tokenType !== 'staff') {
        return res.status(401).json({ message: 'Not authorized for staff routes' });
    }

    const staff = await Staff.findById(decoded.id).select('-password');
    if (!staff) {
        return res.status(401).json({ message: 'Not authorized, staff account not found' });
    }

    req.user = staff;
    return next();
};

const memberProtect = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, no member token' });
    }

    let decoded;
    try {
        decoded = jwt.verify(authorization.split(' ')[1], process.env.JWT_SECRET);
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    if (decoded.tokenType !== 'member') {
        return res.status(401).json({ message: 'Not authorized for member routes' });
    }

    const member = await Member.findById(decoded.id).select('-password');
    if (!member) {
        return res.status(401).json({ message: 'Not authorized, member account not found' });
    }

    req.member = member;
    return next();
};

// Admin only middleware
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as admin' });
    }
};

module.exports = { protect, memberProtect, adminOnly };