const assert = require('node:assert/strict');
const { beforeEach, test } = require('node:test');

const attendancePath = require.resolve('../models/Attendance');
const memberPath = require.resolve('../models/Member');
const staffPath = require.resolve('../models/Staff');
let member;
let createdRecords;
let findOneFilter;
let findFilter;
let aggregatePipeline;
let aggregateResults;
let existingAttendance;
let createError;
let listResults;
let listOptions;

const listQuery = {
    populate() { return this; },
    select(value) { listOptions.select = value; return this; },
    sort(value) { listOptions.sort = value; return this; },
    limit(value) { listOptions.limit = value; return this; },
    then(resolve, reject) { return Promise.resolve(listResults).then(resolve, reject); }
};

require.cache[attendancePath] = {
    id: attendancePath,
    filename: attendancePath,
    loaded: true,
    exports: {
        create: async (record) => {
            createdRecords.push(record);
            if (createError) throw createError;
            return { _id: 'attendance-id', ...record, createdAt: new Date() };
        },
        findOne: async (filter) => {
            findOneFilter = filter;
            return existingAttendance;
        },
        find: (filter) => { findFilter = filter; return listQuery; },
        aggregate: async (pipeline) => { aggregatePipeline = pipeline; return aggregateResults; }
    }
};

require.cache[memberPath] = {
    id: memberPath,
    filename: memberPath,
    loaded: true,
    exports: {
        findOne: () => ({ select: async () => member })
    }
};

require.cache[staffPath] = {
    id: staffPath,
    filename: staffPath,
    loaded: true,
    exports: { collection: { name: 'staff' } }
};

const {
    checkInMember,
    getTodayAttendance,
    getMyAttendance,
    getAttendanceReport
} = require('../controllers/attendanceController');

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
    member = {
        _id: 'member-id',
        member_code: 'GYM-1001',
        first_name: 'Jamie',
        last_name: 'Member',
        membership_status: 'active',
        expiry_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        is_blacklisted: false
    };
    createdRecords = [];
    findOneFilter = null;
    findFilter = null;
    aggregatePipeline = null;
    aggregateResults = [];
    existingAttendance = null;
    createError = null;
    listResults = [];
    listOptions = {};
});

test('check-in records a valid membership with the authenticated staff member', async () => {
    const res = createResponse();

    await checkInMember({
        body: { member_code: ' gym-1001 ' },
        user: { _id: 'cashier-id' }
    }, res);

    assert.equal(res.statusCode, 201);
    assert.equal(createdRecords.length, 1);
    assert.equal(createdRecords[0].member_id, 'member-id');
    assert.equal(createdRecords[0].checked_in_by, 'cashier-id');
    assert.match(createdRecords[0].attendance_date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(createdRecords[0].check_in_hour >= 0 && createdRecords[0].check_in_hour <= 23);
    assert.equal(res.body.alreadyCheckedIn, false);
    assert.equal(res.body.member.full_name, 'Jamie Member');
});

test('check-in rejects inactive, expired, and blacklisted members', async () => {
    const inactiveResponse = createResponse();
    member.membership_status = 'none';
    await checkInMember({ body: { member_code: 'GYM-1001' }, user: { _id: 'cashier-id' } }, inactiveResponse);
    assert.equal(inactiveResponse.statusCode, 403);
    assert.equal(createdRecords.length, 0);

    const expiredResponse = createResponse();
    member.membership_status = 'active';
    member.expiry_date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await checkInMember({ body: { member_code: 'GYM-1001' }, user: { _id: 'cashier-id' } }, expiredResponse);
    assert.equal(expiredResponse.statusCode, 403);
    assert.equal(createdRecords.length, 0);

    const blacklistedResponse = createResponse();
    member.expiry_date = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    member.is_blacklisted = true;
    await checkInMember({ body: { member_code: 'GYM-1001' }, user: { _id: 'cashier-id' } }, blacklistedResponse);
    assert.equal(blacklistedResponse.statusCode, 403);
    assert.equal(createdRecords.length, 0);
});

test('duplicate same-day check-ins return the existing visit without creating another', async () => {
    const res = createResponse();
    createError = { code: 11000 };
    existingAttendance = { _id: 'existing-attendance', attendance_date: '2026-11-22' };

    await checkInMember({ body: { member_code: 'GYM-1001' }, user: { _id: 'cashier-id' } }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.alreadyCheckedIn, true);
    assert.equal(res.body.attendance._id, 'existing-attendance');
    assert.equal(createdRecords.length, 1);
    assert.equal(findOneFilter.member_id, 'member-id');
    assert.equal(findOneFilter.attendance_date, createdRecords[0].attendance_date);
});

test('member attendance history is scoped to the authenticated member', async () => {
    const res = createResponse();
    const visits = [{ _id: 'visit-1' }];
    listResults = visits;

    await getMyAttendance({ member: { _id: 'member-id' } }, res);

    assert.deepEqual(findFilter, { member_id: 'member-id' });
    assert.deepEqual(listOptions, { select: 'attendance_date createdAt', sort: { createdAt: -1 }, limit: 20 });
    assert.equal(res.body, visits);
});

test('staff daily attendance lists the latest check-ins for the current server day', async () => {
    const res = createResponse();
    const visits = [{ _id: 'visit-1' }];
    listResults = visits;
    const today = new Date();
    const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    await getTodayAttendance({ user: { _id: 'cashier-id' } }, res);

    assert.deepEqual(findFilter, { attendance_date: expectedDate });
    assert.deepEqual(listOptions, { sort: { createdAt: -1 }, limit: 50 });
    assert.equal(res.body, visits);
});

test('admin attendance report validates dates and returns grouped attendance data', async () => {
    const report = {
        summary: [{ total_check_ins: 3, unique_members: 2 }],
        by_day: [{ date: '2026-11-22', check_ins: 3, unique_members: 2 }],
        by_cashier: [{ cashier_id: 'cashier-id', cashier_name: 'Cashier', check_ins: 3 }],
        by_hour: [{ hour: 9, check_ins: 3 }]
    };
    aggregateResults = [report];
    const res = createResponse();

    await getAttendanceReport({ query: { startDate: '2026-11-20', endDate: '2026-11-22' } }, res);

    assert.deepEqual(aggregatePipeline[0], {
        $match: { attendance_date: { $gte: '2026-11-20', $lte: '2026-11-22' } }
    });
    assert.equal(aggregatePipeline[1].$facet.by_cashier[1].$lookup.from, 'staff');
    assert.deepEqual(res.body.summary, report.summary[0]);
    assert.deepEqual(res.body.by_day, report.by_day);
    assert.deepEqual(res.body.by_cashier, report.by_cashier);
    assert.deepEqual(res.body.by_hour, report.by_hour);

    const invalidRange = createResponse();
    await getAttendanceReport({ query: { startDate: '2026-11-23', endDate: '2026-11-22' } }, invalidRange);
    assert.equal(invalidRange.statusCode, 400);

    const invalidDate = createResponse();
    await getAttendanceReport({ query: { startDate: '2026-02-31' } }, invalidDate);
    assert.equal(invalidDate.statusCode, 400);
});

test('admin attendance report returns zero totals for an empty period', async () => {
    aggregateResults = [{
        summary: [],
        by_day: [],
        by_cashier: [],
        by_hour: []
    }];
    const res = createResponse();

    await getAttendanceReport({ query: {} }, res);

    assert.deepEqual(res.body.summary, { total_check_ins: 0, unique_members: 0 });
    assert.deepEqual(res.body.by_day, []);
});
