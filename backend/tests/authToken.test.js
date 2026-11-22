const assert = require('node:assert/strict');
const { test } = require('node:test');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'auth-token-test-secret';

const staffPath = require.resolve('../models/Staff');
const memberPath = require.resolve('../models/Member');

const staffAccount = {
    _id: 'staff-id',
    username: 'cashier',
    full_name: 'Test Cashier',
    role: 'cashier',
    matchPassword: async () => true
};
const memberAccount = {
    _id: 'member-id',
    member_code: 'GYM-1001',
    first_name: 'Jamie',
    last_name: 'Santos',
    membership_status: 'active',
    expiry_date: new Date('2026-12-22T00:00:00.000Z'),
    matchPassword: async () => true
};

require.cache[staffPath] = {
    id: staffPath,
    filename: staffPath,
    loaded: true,
    exports: { findOne: async () => staffAccount }
};

require.cache[memberPath] = {
    id: memberPath,
    filename: memberPath,
    loaded: true,
    exports: { findOne: async () => memberAccount }
};

const { loginMember, loginStaff } = require('../controllers/authController');

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

test('member login returns a member-typed token and role', async () => {
    const res = createResponse();

    await loginMember({ body: { phone: '09171234567', password: 'secure-pass' } }, res);

    assert.equal(res.body.role, 'member');
    assert.equal(res.body.full_name, 'Jamie Santos');
    assert.equal(jwt.verify(res.body.token, process.env.JWT_SECRET).tokenType, 'member');
});

test('staff login returns a staff-typed token', async () => {
    const res = createResponse();

    await loginStaff({ body: { username: 'cashier', password: 'secure-pass' } }, res);

    assert.equal(res.body.role, 'cashier');
    assert.equal(jwt.verify(res.body.token, process.env.JWT_SECRET).tokenType, 'staff');
});
