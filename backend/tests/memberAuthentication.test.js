const assert = require('node:assert/strict');
const { test } = require('node:test');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'member-auth-test-secret';

const staffPath = require.resolve('../models/Staff');
const memberPath = require.resolve('../models/Member');
const staffAccount = { _id: 'staff-id', role: 'cashier' };
const memberAccount = { _id: 'member-id', member_code: 'GYM-1001' };

require.cache[staffPath] = {
    id: staffPath,
    filename: staffPath,
    loaded: true,
    exports: { findById: () => ({ select: async () => staffAccount }) }
};

require.cache[memberPath] = {
    id: memberPath,
    filename: memberPath,
    loaded: true,
    exports: { findById: () => ({ select: async () => memberAccount }) }
};

const { memberProtect, protect } = require('../middleware/authMiddleware');

const createResponse = () => ({
    statusCode: 200,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    }
});

const requestWithToken = (token) => ({ headers: { authorization: `Bearer ${token}` } });
const createToken = (id, tokenType) => jwt.sign({ id, tokenType }, process.env.JWT_SECRET);

test('member tokens cannot access staff-protected routes', async () => {
    const res = createResponse();
    let nextCalled = false;

    await protect(requestWithToken(createToken('member-id', 'member')), res, () => {
        nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
});

test('staff tokens cannot access member-protected routes', async () => {
    const res = createResponse();
    let nextCalled = false;

    await memberProtect(requestWithToken(createToken('staff-id', 'staff')), res, () => {
        nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
});

test('member-protected routes receive the authenticated member', async () => {
    const req = requestWithToken(createToken('member-id', 'member'));
    const res = createResponse();
    let nextCalled = false;

    await memberProtect(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.member, memberAccount);
});
