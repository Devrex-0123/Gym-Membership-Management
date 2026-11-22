const assert = require('node:assert/strict');
const { beforeEach, test } = require('node:test');

const settingsPath = require.resolve('../models/Settings');
const transactionPath = require.resolve('../models/Transaction');
const memberPath = require.resolve('../models/Member');

let settings;
let createdTransactions;
let member;

require.cache[settingsPath] = {
    id: settingsPath,
    filename: settingsPath,
    loaded: true,
    exports: { findOne: async () => settings }
};

require.cache[transactionPath] = {
    id: transactionPath,
    filename: transactionPath,
    loaded: true,
    exports: {
        create: async (transaction) => {
            createdTransactions.push(transaction);
            return transaction;
        }
    }
};

require.cache[memberPath] = {
    id: memberPath,
    filename: memberPath,
    loaded: true,
    exports: { findById: async () => member }
};

const { processMembership, processWalkIn } = require('../controllers/transactionController');

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
    settings = {
        walk_in_rates: [
            { category_name: 'Morning Promo', price: 65, is_active: true },
            { category_name: 'Inactive Promo', price: 40, is_active: false }
        ],
        membership_rates: [
            { package_name: 'Monthly', duration_days: 30, price: 1600, is_active: true },
            { package_name: 'Paused', duration_days: 30, price: 1000, is_active: false }
        ]
    };
    createdTransactions = [];
    member = {
        _id: 'member-id',
        membership_status: 'none',
        expiry_date: null,
        save: async () => {}
    };
});

test('walk-in transactions use configured price instead of a client amount', async () => {
    const res = createResponse();

    await processWalkIn({
        body: { category_name: 'Morning Promo', amount: 1, payment_method: 'cash' },
        user: { _id: 'cashier-id' }
    }, res);

    assert.equal(res.statusCode, 201);
    assert.equal(createdTransactions[0].amount, 65);
});

test('walk-in transactions reject inactive rates', async () => {
    const res = createResponse();

    await processWalkIn({
        body: { category_name: 'Inactive Promo', amount: 40, payment_method: 'cash' },
        user: { _id: 'cashier-id' }
    }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(createdTransactions.length, 0);
});

test('membership transactions use configured package price', async () => {
    const res = createResponse();

    await processMembership({
        body: { member_id: 'member-id', package_name: 'Monthly', payment_method: 'cash' },
        user: { _id: 'cashier-id' }
    }, res);

    assert.equal(res.statusCode, 201);
    assert.equal(createdTransactions[0].amount, 1600);
});

test('membership transactions reject inactive packages', async () => {
    const res = createResponse();

    await processMembership({
        body: { member_id: 'member-id', package_name: 'Paused', payment_method: 'cash' },
        user: { _id: 'cashier-id' }
    }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(createdTransactions.length, 0);
});
