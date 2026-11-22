const assert = require('node:assert/strict');
const { beforeEach, test } = require('node:test');

const memberPath = require.resolve('../models/Member');
let createdMember;
let existingMember;

require.cache[memberPath] = {
    id: memberPath,
    filename: memberPath,
    loaded: true,
    exports: {
        findOne: (criteria) => criteria
            ? Promise.resolve(existingMember)
            : { sort: async () => null },
        create: async (memberData) => {
            createdMember = {
                _id: 'member-id',
                ...memberData,
                password: 'hashed-password'
            };
            return createdMember;
        }
    }
};

const { registerMember } = require('../controllers/memberController');

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

beforeEach(() => {
    createdMember = null;
    existingMember = null;
});

test('member registration returns the new member without the password hash', async () => {
    const res = createResponse();

    await registerMember({
        body: { first_name: 'Jamie', last_name: 'Santos', phone: '09171234567', password: 'secure-pass' }
    }, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.member_code, 'GYM-1001');
    assert.equal(res.body.phone, '09171234567');
    assert.equal(Object.hasOwn(res.body, 'password'), false);
    assert.equal(createdMember.password, 'hashed-password');
});

test('member registration rejects a duplicate phone number', async () => {
    existingMember = { _id: 'existing-member' };
    const res = createResponse();

    await registerMember({
        body: { first_name: 'Jamie', last_name: 'Santos', phone: '09171234567', password: 'secure-pass' }
    }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Member already exists with this phone number');
    assert.equal(createdMember, null);
});
