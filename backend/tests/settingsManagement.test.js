const assert = require('node:assert/strict');
const { beforeEach, test } = require('node:test');

const settingsPath = require.resolve('../models/Settings');
let settings;
let saveCount;

require.cache[settingsPath] = {
    id: settingsPath,
    filename: settingsPath,
    loaded: true,
    exports: {
        findOne: () => ({
            select: async () => settings,
            then: (resolve, reject) => Promise.resolve(settings).then(resolve, reject)
        })
    }
};

const { getRates, getPublicMembershipRates, getPublicRates, updateRates } = require('../controllers/settingsController');

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
    saveCount = 0;
    settings = {
        walk_in_rates: [
            { category_name: 'Morning Promo', price: 50, is_active: true },
            { category_name: 'Archived Walk-in', price: 40, is_active: false }
        ],
        membership_rates: [
            { package_name: 'Monthly', duration_days: 30, price: 1500, is_active: true },
            { package_name: 'Archived Plan', duration_days: 60, price: 2500, is_active: false }
        ],
        save: async () => { saveCount += 1; }
    };
});

test('cashier rate reads return active entries only', async () => {
    const res = createResponse();

    await getRates({ user: { role: 'cashier' } }, res);

    assert.deepEqual(res.body.walk_in_rates.map((rate) => rate.category_name), ['Morning Promo']);
    assert.deepEqual(res.body.membership_rates.map((rate) => rate.package_name), ['Monthly']);
});

test('admin rate reads include inactive entries for editing', async () => {
    const res = createResponse();

    await getRates({ user: { role: 'admin' } }, res);

    assert.equal(res.body.walk_in_rates.length, 2);
    assert.equal(res.body.membership_rates.length, 2);
});

test('public membership plan reads include only active plan details', async () => {
    const res = createResponse();

    await getPublicMembershipRates({}, res);

    assert.deepEqual(res.body, {
        membership_rates: [
            { package_name: 'Monthly', duration_days: 30, price: 1500 }
        ]
    });
});

test('public membership plan reads report missing pricing configuration', async () => {
    settings = null;
    const res = createResponse();

    await getPublicMembershipRates({}, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: 'Membership plans are not configured' });
});

test('public rates include only active walk-in and membership details', async () => {
    const res = createResponse();

    await getPublicRates({}, res);

    assert.deepEqual(res.body, {
        walk_in_rates: [
            { category_name: 'Morning Promo', price: 50 }
        ],
        membership_rates: [
            { package_name: 'Monthly', duration_days: 30, price: 1500 }
        ]
    });
});

test('public rates report missing settings', async () => {
    settings = null;
    const res = createResponse();

    await getPublicRates({}, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: 'Gym pricing is not configured' });
});

test('admin rate updates persist validated walk-in and membership settings', async () => {
    const res = createResponse();

    await updateRates({
        body: {
            walk_in_rates: [{ category_name: 'Morning Promo', price: 70, is_active: true }],
            membership_rates: [{ package_name: 'Monthly', duration_days: 31, price: 1700, is_active: true }]
        }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(saveCount, 1);
    assert.equal(settings.walk_in_rates[0].price, 70);
    assert.equal(settings.membership_rates[0].duration_days, 31);
    assert.equal(settings.membership_rates[0].price, 1700);
});

test('rate updates reject duplicate names and invalid package duration', async () => {
    const duplicateResponse = createResponse();
    await updateRates({
        body: {
            walk_in_rates: [
                { category_name: 'Morning Promo', price: 50, is_active: true },
                { category_name: ' morning promo ', price: 60, is_active: true }
            ],
            membership_rates: [{ package_name: 'Monthly', duration_days: 30, price: 1500, is_active: true }]
        }
    }, duplicateResponse);

    assert.equal(duplicateResponse.statusCode, 400);
    assert.equal(saveCount, 0);

    const durationResponse = createResponse();
    await updateRates({
        body: {
            walk_in_rates: [{ category_name: 'Morning Promo', price: 50, is_active: true }],
            membership_rates: [{ package_name: 'Monthly', duration_days: 0, price: 1500, is_active: true }]
        }
    }, durationResponse);

    assert.equal(durationResponse.statusCode, 400);
    assert.equal(saveCount, 0);
});
