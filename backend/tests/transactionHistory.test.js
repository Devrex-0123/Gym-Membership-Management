const assert = require('node:assert/strict');
const { beforeEach, test } = require('node:test');

const transactionPath = require.resolve('../models/Transaction');
const staffPath = require.resolve('../models/Staff');
const expensePath = require.resolve('../models/Expense');
let findFilter;
let countFilter;
let aggregationPipeline;
let transactionResults;
let aggregateResults;
let totalTransactions;
let queryOptions;
let expenseAggregationPipeline;
let expenseAggregateResults;

const transactionQuery = {
    populate() { return this; },
    sort(value) { queryOptions.sort = value; return this; },
    skip(value) { queryOptions.skip = value; return this; },
    limit(value) { queryOptions.limit = value; return this; },
    then(resolve, reject) { return Promise.resolve(transactionResults).then(resolve, reject); }
};

require.cache[transactionPath] = {
    id: transactionPath,
    filename: transactionPath,
    loaded: true,
    exports: {
        find: (filter) => { findFilter = filter; return transactionQuery; },
        countDocuments: async (filter) => { countFilter = filter; return totalTransactions; },
        aggregate: async (pipeline) => { aggregationPipeline = pipeline; return aggregateResults; }
    }
};

require.cache[staffPath] = {
    id: staffPath,
    filename: staffPath,
    loaded: true,
    exports: { collection: { name: 'staff' } }
};

require.cache[expensePath] = {
    id: expensePath,
    filename: expensePath,
    loaded: true,
    exports: {
        Expense: {
            aggregate: async (pipeline) => {
                expenseAggregationPipeline = pipeline;
                return expenseAggregateResults;
            }
        }
    }
};

const { getTransactionHistory, getTransactionReport } = require('../controllers/transactionController');

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
    findFilter = null;
    countFilter = null;
    aggregationPipeline = null;
    transactionResults = [{ _id: 'transaction-1' }];
    aggregateResults = [];
    totalTransactions = 41;
    queryOptions = {};
    expenseAggregationPipeline = null;
    expenseAggregateResults = [{
        summary: [],
        by_category: []
    }];
});

test('cashier history scopes results, filters by date and paginates', async () => {
    const res = createResponse();
    const startDate = '2026-03-01T00:00:00.000Z';
    const endDate = '2026-03-02T00:00:00.000Z';

    await getTransactionHistory({
        user: { _id: '65a000000000000000000001', role: 'cashier' },
        query: {
            page: '2',
            limit: '20',
            startDate,
            endDate,
            transactionType: 'walk_in',
            paymentMethod: 'cash',
            search: 'promo.*',
            cashierId: '65a000000000000000000002'
        }
    }, res);

    assert.equal(findFilter.cashier_id, '65a000000000000000000001');
    assert.deepEqual(findFilter.createdAt, {
        $gte: new Date(startDate),
        $lt: new Date(endDate)
    });
    assert.equal(findFilter.transaction_type, 'walk_in');
    assert.equal(findFilter.payment_method, 'cash');
    assert.equal(findFilter.$or[0].transaction_code.test('promo.*'), true);
    assert.equal(findFilter.$or[0].transaction_code.test('promox'), false);
    assert.deepEqual(countFilter, findFilter);
    assert.deepEqual(queryOptions, { sort: { createdAt: -1, _id: -1 }, skip: 20, limit: 20 });
    assert.deepEqual(res.body.pagination, { page: 2, limit: 20, total: 41, totalPages: 3 });
    assert.equal(res.body.transactions.length, 1);
});

test('history rejects invalid date ranges, filters and pagination', async () => {
    const invalidDate = createResponse();
    await getTransactionHistory({
        user: { _id: '65a000000000000000000001', role: 'cashier' },
        query: { startDate: 'not-a-date' }
    }, invalidDate);
    assert.equal(invalidDate.statusCode, 400);

    const dateOnly = createResponse();
    await getTransactionHistory({
        user: { _id: '65a000000000000000000001', role: 'cashier' },
        query: { startDate: '2026-03-01' }
    }, dateOnly);
    assert.equal(dateOnly.statusCode, 400);

    const reversedDates = createResponse();
    await getTransactionHistory({
        user: { _id: '65a000000000000000000001', role: 'cashier' },
        query: {
            startDate: '2026-03-02T00:00:00.000Z',
            endDate: '2026-03-01T00:00:00.000Z'
        }
    }, reversedDates);
    assert.equal(reversedDates.statusCode, 400);

    const invalidType = createResponse();
    await getTransactionHistory({
        user: { _id: '65a000000000000000000001', role: 'cashier' },
        query: { transactionType: 'unknown' }
    }, invalidType);
    assert.equal(invalidType.statusCode, 400);

    const invalidPage = createResponse();
    await getTransactionHistory({
        user: { _id: '65a000000000000000000001', role: 'cashier' },
        query: { page: '0' }
    }, invalidPage);
    assert.equal(invalidPage.statusCode, 400);

    const malformedPage = createResponse();
    await getTransactionHistory({
        user: { _id: '65a000000000000000000001', role: 'cashier' },
        query: { page: '1abc' }
    }, malformedPage);
    assert.equal(malformedPage.statusCode, 400);
});

test('admin report aggregates totals and grouped summaries for the selected period', async () => {
    const expectedReport = {
        summary: [{
            total_revenue: 2600,
            transaction_count: 2,
            total_walk_ins: 1,
            total_new_members: 1,
            total_renewals: 0
        }],
        by_cashier: [{ cashier_id: 'cashier-1', cashier_name: 'Cashier One', transaction_count: 2, total_revenue: 2600 }],
        by_payment_method: [{ payment_method: 'cash', transaction_count: 2, total_revenue: 2600 }],
        by_transaction_type: [{ transaction_type: 'walk_in', transaction_count: 1, total_revenue: 100 }]
    };
    aggregateResults = [expectedReport];
    const expectedExpenseReport = {
        summary: [{ total_expenses: 3000, expense_count: 2 }],
        by_category: [{ category: 'utilities', expense_count: 2, total_amount: 3000 }]
    };
    expenseAggregateResults = [expectedExpenseReport];
    const res = createResponse();
    const startDate = '2026-03-01T00:00:00.000Z';
    const endDate = '2026-03-02T00:00:00.000Z';

    await getTransactionReport({
        query: {
            startDate,
            endDate,
            expenseStartDate: '2026-03-01',
            expenseEndDate: '2026-03-02'
        }
    }, res);

    assert.deepEqual(aggregationPipeline[0], {
        $match: { createdAt: { $gte: new Date(startDate), $lt: new Date(endDate) } }
    });
    assert.equal(aggregationPipeline[1].$facet.by_cashier[1].$lookup.from, 'staff');
    assert.deepEqual(expenseAggregationPipeline[0], {
        $match: { expense_date: { $gte: '2026-03-01', $lte: '2026-03-02' } }
    });
    assert.equal(res.body.summary.total_revenue, 2600);
    assert.equal(res.body.summary.total_expenses, 3000);
    assert.equal(res.body.summary.expense_count, 2);
    assert.equal(res.body.summary.net_profit, -400);
    assert.deepEqual(res.body.by_cashier, expectedReport.by_cashier);
    assert.deepEqual(res.body.by_payment_method, expectedReport.by_payment_method);
    assert.deepEqual(res.body.by_transaction_type, expectedReport.by_transaction_type);
    assert.deepEqual(res.body.by_expense_category, expectedExpenseReport.by_category);

    const invalidExpenseRange = createResponse();
    await getTransactionReport({
        query: { expenseStartDate: '2026-03-03', expenseEndDate: '2026-03-02' }
    }, invalidExpenseRange);
    assert.equal(invalidExpenseRange.statusCode, 400);

    const mismatchedExpenseRange = createResponse();
    await getTransactionReport({
        query: { startDate, endDate }
    }, mismatchedExpenseRange);
    assert.equal(mismatchedExpenseRange.statusCode, 400);
});

test('admin report returns zero totals when the period has no transactions', async () => {
    aggregateResults = [{
        summary: [],
        by_cashier: [],
        by_payment_method: [],
        by_transaction_type: []
    }];
    const res = createResponse();

    await getTransactionReport({ query: {} }, res);

    assert.deepEqual(res.body.summary, {
        total_revenue: 0,
        transaction_count: 0,
        total_walk_ins: 0,
        total_new_members: 0,
        total_renewals: 0,
        total_expenses: 0,
        expense_count: 0,
        net_profit: 0
    });
    assert.deepEqual(res.body.by_cashier, []);
    assert.deepEqual(res.body.by_expense_category, []);
});
