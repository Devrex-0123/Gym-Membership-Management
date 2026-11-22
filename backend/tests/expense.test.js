const assert = require('node:assert/strict');
const { beforeEach, test } = require('node:test');

const expensePath = require.resolve('../models/Expense');
let createdExpenses;
let findFilter;
let countFilter;
let expenseResults;
let totalExpenses;
let queryOptions;

const expenseQuery = {
    populate() { return this; },
    sort(value) { queryOptions.sort = value; return this; },
    skip(value) { queryOptions.skip = value; return this; },
    limit(value) { queryOptions.limit = value; return this; },
    then(resolve, reject) { return Promise.resolve(expenseResults).then(resolve, reject); }
};

require.cache[expensePath] = {
    id: expensePath,
    filename: expensePath,
    loaded: true,
    exports: {
        Expense: {
            create: async (expense) => {
                createdExpenses.push(expense);
                return { _id: 'expense-id', ...expense };
            },
            find: (filter) => { findFilter = filter; return expenseQuery; },
            countDocuments: async (filter) => { countFilter = filter; return totalExpenses; }
        },
        EXPENSE_CATEGORIES: ['rent', 'utilities', 'payroll', 'maintenance', 'supplies', 'marketing', 'equipment', 'other']
    }
};

const { createExpense, getExpenses } = require('../controllers/expenseController');
const { adminOnly } = require('../middleware/authMiddleware');

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
    createdExpenses = [];
    findFilter = null;
    countFilter = null;
    expenseResults = [];
    totalExpenses = 42;
    queryOptions = {};
});

test('admin expense creation stores validated values and recording staff', async () => {
    const res = createResponse();

    await createExpense({
        body: {
            category: 'utilities',
            description: '  Monthly electricity  ',
            vendor: '  Power Co  ',
            amount: 1250.5,
            expense_date: '2026-11-20'
        },
        user: { _id: 'admin-id' }
    }, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(createdExpenses[0], {
        category: 'utilities',
        description: 'Monthly electricity',
        vendor: 'Power Co',
        amount: 1250.5,
        expense_date: '2026-11-20',
        recorded_by: 'admin-id'
    });
});

test('expense creation rejects invalid categories, amounts, and dates', async () => {
    const invalidCategory = createResponse();
    await createExpense({ body: { category: 'anything', description: 'Test', amount: 50, expense_date: '2026-11-20' }, user: { _id: 'admin-id' } }, invalidCategory);
    assert.equal(invalidCategory.statusCode, 400);

    const invalidAmount = createResponse();
    await createExpense({ body: { category: 'rent', description: 'Test', amount: 0, expense_date: '2026-11-20' }, user: { _id: 'admin-id' } }, invalidAmount);
    assert.equal(invalidAmount.statusCode, 400);

    const invalidDate = createResponse();
    await createExpense({ body: { category: 'rent', description: 'Test', amount: 50, expense_date: '2026-02-31' }, user: { _id: 'admin-id' } }, invalidDate);
    assert.equal(invalidDate.statusCode, 400);
    assert.equal(createdExpenses.length, 0);
});

test('expense history filters and paginates results', async () => {
    const results = [{ _id: 'expense-id', amount: 1250 }];
    expenseResults = results;
    const res = createResponse();

    await getExpenses({
        query: {
            page: '2',
            limit: '20',
            startDate: '2026-11-01',
            endDate: '2026-11-30',
            category: 'utilities',
            search: 'power.*'
        }
    }, res);

    assert.deepEqual(findFilter.expense_date, { $gte: '2026-11-01', $lte: '2026-11-30' });
    assert.equal(findFilter.category, 'utilities');
    assert.equal(findFilter.$or[0].description.test('power.*'), true);
    assert.equal(findFilter.$or[0].description.test('power company'), false);
    assert.deepEqual(countFilter, findFilter);
    assert.deepEqual(queryOptions, { sort: { expense_date: -1, createdAt: -1 }, skip: 20, limit: 20 });
    assert.deepEqual(res.body.pagination, { page: 2, limit: 20, total: 42, totalPages: 3 });
    assert.equal(res.body.expenses, results);
});

test('expense history rejects invalid date ranges and categories', async () => {
    const reversedDates = createResponse();
    await getExpenses({ query: { startDate: '2026-11-30', endDate: '2026-11-01' } }, reversedDates);
    assert.equal(reversedDates.statusCode, 400);

    const badCategory = createResponse();
    await getExpenses({ query: { category: 'unknown' } }, badCategory);
    assert.equal(badCategory.statusCode, 400);
});

test('admin route gate rejects cashiers and accepts admins', () => {
    const cashierResponse = createResponse();
    let cashierNextCalled = false;
    adminOnly({ user: { role: 'cashier' } }, cashierResponse, () => { cashierNextCalled = true; });
    assert.equal(cashierResponse.statusCode, 403);
    assert.equal(cashierNextCalled, false);

    const adminResponse = createResponse();
    let adminNextCalled = false;
    adminOnly({ user: { role: 'admin' } }, adminResponse, () => { adminNextCalled = true; });
    assert.equal(adminNextCalled, true);
});
