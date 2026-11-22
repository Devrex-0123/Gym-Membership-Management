const assert = require('node:assert/strict');
const { beforeEach, test } = require('node:test');

const staffPath = require.resolve('../models/Staff');
const memberPath = require.resolve('../models/Member');
const attendancePath = require.resolve('../models/Attendance');
let staffFilter;
let staffResults;
let staffCountFilter;
let memberFilter;
let memberResults;
let memberCountFilter;
let attendancePipeline;
let attendanceResults;
let queryOptions;

const staffQuery = {
    select(value) { queryOptions.staffSelect = value; return this; },
    sort(value) { queryOptions.staffSort = value; return this; },
    skip(value) { queryOptions.staffSkip = value; return this; },
    limit(value) { queryOptions.staffLimit = value; return this; },
    then(resolve, reject) { return Promise.resolve(staffResults).then(resolve, reject); }
};

const memberQuery = {
    select(value) { queryOptions.memberSelect = value; return this; },
    sort(value) { queryOptions.memberSort = value; return this; },
    skip(value) { queryOptions.memberSkip = value; return this; },
    limit(value) { queryOptions.memberLimit = value; return this; },
    then(resolve, reject) { return Promise.resolve(memberResults).then(resolve, reject); }
};

require.cache[staffPath] = {
    id: staffPath,
    filename: staffPath,
    loaded: true,
    exports: {
        find: (filter) => { staffFilter = filter; return staffQuery; },
        countDocuments: async (filter) => { staffCountFilter = filter; return 31; }
    }
};

require.cache[memberPath] = {
    id: memberPath,
    filename: memberPath,
    loaded: true,
    exports: {
        find: (filter) => { memberFilter = filter; return memberQuery; },
        countDocuments: async (filter) => { memberCountFilter = filter; return memberResults.length; }
    }
};

require.cache[attendancePath] = {
    id: attendancePath,
    filename: attendancePath,
    loaded: true,
    exports: {
        aggregate: async (pipeline) => { attendancePipeline = pipeline; return attendanceResults; }
    }
};

const { getCashierDirectory, getMemberDirectory } = require('../controllers/directoryController');
const { cashierOnly } = require('../middleware/authMiddleware');

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
    staffFilter = null;
    staffResults = [];
    staffCountFilter = null;
    memberFilter = null;
    memberResults = [];
    memberCountFilter = null;
    attendancePipeline = null;
    attendanceResults = [];
    queryOptions = {};
});

test('admin cashier directory filters to cashier accounts and returns safe paginated fields', async () => {
    staffResults = [{
        _id: 'cashier-1',
        full_name: 'Taylor Cashier',
        username: 'taylor',
        role: 'cashier',
        shift_tag: 'morning',
        is_active: true,
        createdAt: new Date(),
        password: 'should-not-be-returned'
    }];
    const res = createResponse();

    await getCashierDirectory({ query: { status: 'active', search: 'tay.*', page: '2', limit: '20' } }, res);

    assert.equal(staffFilter.role, 'cashier');
    assert.equal(staffFilter.is_active, true);
    assert.equal(staffFilter.$or[0].full_name.test('tay.*'), true);
    assert.equal(staffFilter.$or[0].full_name.test('Taylor'), false);
    assert.deepEqual(staffCountFilter, staffFilter);
    assert.equal(queryOptions.staffSelect.includes('password'), false);
    assert.deepEqual(res.body.pagination, { page: 2, limit: 20, total: 31, totalPages: 2 });
    assert.equal(res.body.staff[0].password, undefined);
    assert.equal(res.body.staff[0].username, 'taylor');
});

test('cashier member directory filters, paginates, and includes last visit without credentials', async () => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 2);
    memberResults = [{
        _id: 'member-1',
        member_code: 'GYM-1001',
        first_name: 'Casey',
        last_name: 'Member',
        phone: '5550100',
        membership_status: 'active',
        expiry_date: expiry,
        is_blacklisted: false,
        createdAt: new Date(),
        password: 'should-not-be-returned'
    }];
    attendanceResults = [{ _id: 'member-1', last_visit: new Date() }];
    const res = createResponse();

    await getMemberDirectory({ query: { status: 'expiring', search: 'GYM-.*', page: '1', limit: '25' } }, res);

    assert.ok(memberFilter.$and[0].expiry_date.$gte instanceof Date);
    assert.equal(memberFilter.$and[1].$or[3].member_code.test('GYM-.*'), true);
    assert.equal(memberFilter.$and[1].$or[3].member_code.test('GYM-1001'), false);
    assert.deepEqual(memberCountFilter, memberFilter);
    assert.equal(queryOptions.memberSelect.includes('password'), false);
    assert.equal(attendancePipeline[0].$match.member_id.$in[0], 'member-1');
    assert.equal(res.body.members[0].directory_status, 'expiring');
    assert.ok(res.body.members[0].last_visit instanceof Date);
    assert.equal(res.body.members[0].password, undefined);
});

test('directory status and pagination inputs are validated', async () => {
    const invalidStatus = createResponse();
    await getMemberDirectory({ query: { status: 'blocked' } }, invalidStatus);
    assert.equal(invalidStatus.statusCode, 400);

    const invalidPagination = createResponse();
    await getCashierDirectory({ query: { page: '1x' } }, invalidPagination);
    assert.equal(invalidPagination.statusCode, 400);
});

test('only cashiers can access the member directory role gate', () => {
    const adminResponse = createResponse();
    let adminNextCalled = false;
    cashierOnly({ user: { role: 'admin' } }, adminResponse, () => { adminNextCalled = true; });
    assert.equal(adminResponse.statusCode, 403);
    assert.equal(adminNextCalled, false);

    const cashierResponse = createResponse();
    let cashierNextCalled = false;
    cashierOnly({ user: { role: 'cashier' } }, cashierResponse, () => { cashierNextCalled = true; });
    assert.equal(cashierNextCalled, true);
});
