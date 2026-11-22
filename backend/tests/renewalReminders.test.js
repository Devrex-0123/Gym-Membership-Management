const assert = require('node:assert/strict');
const { beforeEach, test } = require('node:test');

const memberPath = require.resolve('../models/Member');
const reminderPath = require.resolve('../models/MembershipReminder');
const attendancePath = require.resolve('../models/Attendance');
let memberFilter;
let memberCountFilter;
let memberResults;
let selectedMember;
let reminderResults;
let createdReminders;
let existingReminder;
let createError;
let attendanceResults;
let attendancePipeline;
let reminderFindFilter;
let options;

const memberQuery = {
    select(value) { options.select = value; return this; },
    sort(value) { options.sort = value; return this; },
    skip(value) { options.skip = value; return this; },
    limit(value) { options.limit = value; return this; },
    then(resolve, reject) { return Promise.resolve(memberResults).then(resolve, reject); }
};

const reminderQuery = {
    populate() { return this; },
    sort(value) { options.reminderSort = value; return this; },
    then(resolve, reject) { return Promise.resolve(reminderResults).then(resolve, reject); }
};

const reminderFindOneQuery = {
    populate() { return this; },
    then(resolve, reject) { return Promise.resolve(existingReminder).then(resolve, reject); }
};

require.cache[memberPath] = {
    id: memberPath,
    filename: memberPath,
    loaded: true,
    exports: {
        find: (filter) => { memberFilter = filter; return memberQuery; },
        countDocuments: async (filter) => { memberCountFilter = filter; return 1; },
        findById: () => ({ select: async () => selectedMember })
    }
};

require.cache[reminderPath] = {
    id: reminderPath,
    filename: reminderPath,
    loaded: true,
    exports: {
        find: (filter) => { reminderFindFilter = filter; return reminderQuery; },
        create: async (record) => {
            createdReminders.push(record);
            if (createError) throw createError;
            return { _id: 'reminder-id', sent_at: new Date(), ...record };
        },
        findOne: () => reminderFindOneQuery
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

const { getRenewalCandidates, markReminderSent } = require('../controllers/renewalController');

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
    memberFilter = null;
    memberCountFilter = null;
    memberResults = [];
    selectedMember = {
        _id: '65a000000000000000000001',
        member_code: 'GYM-1001',
        first_name: 'Jamie',
        last_name: 'Member',
        membership_status: 'active',
        expiry_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        is_blacklisted: false
    };
    reminderResults = [];
    createdReminders = [];
    existingReminder = null;
    createError = null;
    attendanceResults = [];
    attendancePipeline = null;
    reminderFindFilter = null;
    options = {};
});

test('renewal candidates include last visit and reminder details for expiring members', async () => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 2);
    selectedMember.expiry_date = expiryDate;
    memberResults = [{
        _id: selectedMember._id,
        member_code: selectedMember.member_code,
        first_name: selectedMember.first_name,
        last_name: selectedMember.last_name,
        phone: '5550100',
        membership_status: 'active',
        expiry_date: expiryDate
    }];
    const sentAt = new Date();
    reminderResults = [{
        member_id: selectedMember._id,
        expiry_date: expiryDate,
        sent_at: sentAt,
        sent_by: { full_name: 'Front Desk' }
    }];
    const lastVisit = new Date(Date.now() - 24 * 60 * 60 * 1000);
    attendanceResults = [{ _id: selectedMember._id, last_visit: lastVisit }];
    const res = createResponse();

    await getRenewalCandidates({ query: { status: 'expiring', page: '1', limit: '25', search: 'GYM-.*' } }, res);

    assert.ok(memberFilter.expiry_date.$gte instanceof Date);
    assert.ok(memberFilter.expiry_date.$lte instanceof Date);
    assert.deepEqual(memberCountFilter, memberFilter);
    assert.equal(memberFilter.$or[3].member_code.test('GYM-.*'), true);
    assert.equal(memberFilter.$or[3].member_code.test('GYM-1001'), false);
    assert.deepEqual(reminderFindFilter.$or, [{ member_id: selectedMember._id, expiry_date: expiryDate }]);
    assert.deepEqual(attendancePipeline[0].$match.member_id.$in, [selectedMember._id]);
    assert.equal(res.body.members[0].renewal_status, 'expiring');
    assert.equal(res.body.members[0].last_visit, lastVisit);
    assert.equal(res.body.members[0].reminder.sent_by.full_name, 'Front Desk');
    assert.equal(res.body.pagination.total, 1);
});

test('renewal candidate status filters use the correct date ranges', async () => {
    const expiredResponse = createResponse();
    await getRenewalCandidates({ query: { status: 'expired' } }, expiredResponse);
    assert.ok(memberFilter.expiry_date.$lt instanceof Date);
    assert.equal(memberFilter.expiry_date.$gte, undefined);

    const allResponse = createResponse();
    await getRenewalCandidates({ query: { status: 'all' } }, allResponse);
    assert.ok(memberFilter.expiry_date.$lte instanceof Date);
    assert.equal(memberFilter.expiry_date.$lt, undefined);

    const invalidStatusResponse = createResponse();
    await getRenewalCandidates({ query: { status: 'active' } }, invalidStatusResponse);
    assert.equal(invalidStatusResponse.statusCode, 400);
});

test('marking a reminder records the current expiry and authenticated staff member', async () => {
    const res = createResponse();

    await markReminderSent({
        params: { id: selectedMember._id },
        user: { _id: 'cashier-id' }
    }, res);

    assert.equal(res.statusCode, 201);
    assert.equal(createdReminders.length, 1);
    assert.equal(createdReminders[0].member_id, selectedMember._id);
    assert.equal(createdReminders[0].expiry_date, selectedMember.expiry_date);
    assert.equal(createdReminders[0].sent_by, 'cashier-id');
    assert.equal(res.body.alreadySent, false);
});

test('marking a reminder is idempotent and rejects members without a membership', async () => {
    const duplicateResponse = createResponse();
    createError = { code: 11000 };
    existingReminder = { _id: 'existing-reminder' };

    await markReminderSent({
        params: { id: selectedMember._id },
        user: { _id: 'cashier-id' }
    }, duplicateResponse);

    assert.equal(duplicateResponse.statusCode, 200);
    assert.equal(duplicateResponse.body.alreadySent, true);

    const noMembershipResponse = createResponse();
    selectedMember.membership_status = 'none';
    await markReminderSent({
        params: { id: selectedMember._id },
        user: { _id: 'cashier-id' }
    }, noMembershipResponse);
    assert.equal(noMembershipResponse.statusCode, 400);
});
