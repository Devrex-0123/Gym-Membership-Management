// controllers/transactionController.js
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Member = require('../models/Member');
const Settings = require('../models/Settings');
const Staff = require('../models/Staff');
const { Expense } = require('../models/Expense');

const TRANSACTION_TYPES = ['walk_in', 'membership_new', 'membership_renewal'];
const PAYMENT_METHODS = ['cash', 'gcash', 'paymaya', 'card'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

const parseIsoDate = (value) => {
    if (typeof value !== 'string' || !ISO_DATE_TIME_PATTERN.test(value)) return null;
    const date = new Date(value);
    const datePart = value.split('T')[0];
    const normalizedDate = new Date(`${datePart}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || normalizedDate.toISOString().slice(0, 10) !== datePart) {
        return null;
    }
    return date;
};

const isValidDateOnly = (value) => {
    if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const parseDateRange = (query) => {
    const filter = {};
    const createdAt = {};

    if (query.startDate) {
        const startDate = parseIsoDate(query.startDate);
        if (!startDate) {
            return { error: 'startDate must be a valid ISO date' };
        }
        createdAt.$gte = startDate;
    }

    if (query.endDate) {
        const endDate = parseIsoDate(query.endDate);
        if (!endDate) {
            return { error: 'endDate must be a valid ISO date' };
        }
        createdAt.$lt = endDate;
    }

    if (createdAt.$gte && createdAt.$lt && createdAt.$gte >= createdAt.$lt) {
        return { error: 'startDate must be earlier than endDate' };
    }
    if (Object.keys(createdAt).length > 0) {
        filter.createdAt = createdAt;
    }

    return { filter };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const parsePositiveInteger = (value, defaultValue) => {
    if (value === undefined) return defaultValue;
    if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
};

// Helper to generate transaction code
const generateTxnCode = () => {
    const date = new Date();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TXN-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}-${random}`;
};

// @desc    Process Walk-in
// @route   POST /api/transactions/walk-in
const processWalkIn = async (req, res) => {
    const { category_name, payment_method } = req.body;

    const settings = await Settings.findOne();
    if (!settings) {
        return res.status(503).json({ message: 'Gym pricing is not configured' });
    }

    const walkInRate = settings.walk_in_rates.find(
        rate => rate.category_name === category_name && rate.is_active
    );
    if (!walkInRate) {
        return res.status(400).json({ message: 'Invalid or inactive walk-in rate' });
    }

    const transaction = await Transaction.create({
        transaction_code: generateTxnCode(),
        cashier_id: req.user._id,
        transaction_type: 'walk_in',
        category_name,
        amount: walkInRate.price,
        payment_method
    });

    res.status(201).json(transaction);
};

// @desc    Process Membership (New or Renewal)
// @route   POST /api/transactions/membership
const processMembership = async (req, res) => {
    const { member_id, package_name, payment_method } = req.body;

    // 1. Get the package details from Settings to know the duration and price
    const settings = await Settings.findOne();
    if (!settings) {
        return res.status(503).json({ message: 'Gym pricing is not configured' });
    }

    const packageDetails = settings.membership_rates.find(
        item => item.package_name === package_name && item.is_active
    );

    if (!packageDetails) {
        return res.status(400).json({ message: 'Invalid membership package' });
    }

    // 2. Determine transaction type and calculate new expiry date
    let transaction_type = 'membership_new';
    let newExpiryDate = new Date();

    const member = await Member.findById(member_id);
    
    if (member && member.membership_status === 'active' && member.expiry_date > new Date()) {
        // It's a renewal, extend from current expiry date
        transaction_type = 'membership_renewal';
        newExpiryDate = new Date(member.expiry_date);
    }
    
    // Add duration to the base date
    newExpiryDate.setDate(newExpiryDate.getDate() + packageDetails.duration_days);

    // 3. Create Transaction
    const transaction = await Transaction.create({
        transaction_code: generateTxnCode(),
        member_id,
        cashier_id: req.user._id,
        transaction_type,
        category_name: package_name,
        amount: packageDetails.price,
        payment_method
    });

    // 4. Update Member Status and Expiry Date
    if (member) {
        member.membership_status = 'active';
        member.expiry_date = newExpiryDate;
        await member.save();
    }

    res.status(201).json({ transaction, new_expiry_date: newExpiryDate });
};

// @desc    Get Daily Summary
// @route   GET /api/transactions/summary
const getDailySummary = async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const transactions = await Transaction.find({
        createdAt: { $gte: today }
    });

    let total_revenue = 0;
    let total_walk_ins = 0;
    let total_new_members = 0;
    let total_renewals = 0;

    transactions.forEach(txn => {
        total_revenue += txn.amount;
        if (txn.transaction_type === 'walk_in') total_walk_ins++;
        if (txn.transaction_type === 'membership_new') total_new_members++;
        if (txn.transaction_type === 'membership_renewal') total_renewals++;
    });

    res.json({
        date: today,
        total_revenue,
        total_walk_ins,
        total_new_members,
        total_renewals,
        transaction_count: transactions.length
    });
};

// @desc    Get recent transactions for the logged-in cashier
// @route   GET /api/transactions/recent
const getRecentTransactions = async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const transactions = await Transaction.find({
        cashier_id: req.user._id,
        createdAt: { $gte: today }
    })
        .sort({ createdAt: -1 })
        .limit(5);

    res.json(transactions);
};

const getTransactionHistory = async (req, res) => {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 25);
    if (page === null || page < 1 || limit === null || limit < 1 || limit > 100) {
        return res.status(400).json({ message: 'Page must be positive and limit must be between 1 and 100' });
    }

    const { filter, error: dateError } = parseDateRange(req.query);
    if (dateError) {
        return res.status(400).json({ message: dateError });
    }

    if (req.query.transactionType) {
        if (!TRANSACTION_TYPES.includes(req.query.transactionType)) {
            return res.status(400).json({ message: 'Invalid transaction type' });
        }
        filter.transaction_type = req.query.transactionType;
    }

    if (req.query.paymentMethod) {
        if (!PAYMENT_METHODS.includes(req.query.paymentMethod)) {
            return res.status(400).json({ message: 'Invalid payment method' });
        }
        filter.payment_method = req.query.paymentMethod;
    }

    if (req.user.role === 'cashier') {
        filter.cashier_id = req.user._id;
    } else if (req.query.cashierId) {
        if (!mongoose.Types.ObjectId.isValid(req.query.cashierId)) {
            return res.status(400).json({ message: 'Invalid cashier ID' });
        }
        filter.cashier_id = new mongoose.Types.ObjectId(req.query.cashierId);
    }

    if (req.query.search) {
        if (typeof req.query.search !== 'string' || req.query.search.length > 100) {
            return res.status(400).json({ message: 'Search must be 100 characters or fewer' });
        }
        const search = new RegExp(escapeRegex(req.query.search.trim()), 'i');
        filter.$or = [
            { transaction_code: search },
            { category_name: search }
        ];
    }

    const [transactions, total] = await Promise.all([
        Transaction.find(filter)
            .populate('member_id', 'first_name last_name member_code')
            .populate('cashier_id', 'full_name')
            .sort({ createdAt: -1, _id: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Transaction.countDocuments(filter)
    ]);

    res.json({
        transactions,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
};

const getTransactionReport = async (req, res) => {
    const { filter, error: dateError } = parseDateRange(req.query);
    if (dateError) {
        return res.status(400).json({ message: dateError });
    }
    const { expenseStartDate, expenseEndDate } = req.query;
    if ((expenseStartDate && !isValidDateOnly(expenseStartDate)) || (expenseEndDate && !isValidDateOnly(expenseEndDate))) {
        return res.status(400).json({ message: 'Expense dates must use the valid YYYY-MM-DD format' });
    }
    if (expenseStartDate && expenseEndDate && expenseStartDate > expenseEndDate) {
        return res.status(400).json({ message: 'Expense start date must be on or before end date' });
    }
    if (
        Boolean(req.query.startDate) !== Boolean(expenseStartDate) ||
        Boolean(req.query.endDate) !== Boolean(expenseEndDate)
    ) {
        return res.status(400).json({ message: 'Sales and expense date ranges must match' });
    }

    const transactionPipeline = [
        { $match: filter },
        {
            $facet: {
                summary: [
                    {
                        $group: {
                            _id: null,
                            total_revenue: { $sum: '$amount' },
                            transaction_count: { $sum: 1 },
                            total_walk_ins: { $sum: { $cond: [{ $eq: ['$transaction_type', 'walk_in'] }, 1, 0] } },
                            total_new_members: { $sum: { $cond: [{ $eq: ['$transaction_type', 'membership_new'] }, 1, 0] } },
                            total_renewals: { $sum: { $cond: [{ $eq: ['$transaction_type', 'membership_renewal'] }, 1, 0] } }
                        }
                    },
                    { $project: { _id: 0 } }
                ],
                by_cashier: [
                    {
                        $group: {
                            _id: '$cashier_id',
                            transaction_count: { $sum: 1 },
                            total_revenue: { $sum: '$amount' }
                        }
                    },
                    {
                        $lookup: {
                            from: Staff.collection.name,
                            localField: '_id',
                            foreignField: '_id',
                            as: 'cashier'
                        }
                    },
                    { $unwind: { path: '$cashier', preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            _id: 0,
                            cashier_id: '$_id',
                            cashier_name: { $ifNull: ['$cashier.full_name', 'Unknown cashier'] },
                            transaction_count: 1,
                            total_revenue: 1
                        }
                    },
                    { $sort: { total_revenue: -1 } }
                ],
                by_payment_method: [
                    {
                        $group: {
                            _id: '$payment_method',
                            transaction_count: { $sum: 1 },
                            total_revenue: { $sum: '$amount' }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            payment_method: '$_id',
                            transaction_count: 1,
                            total_revenue: 1
                        }
                    },
                    { $sort: { total_revenue: -1 } }
                ],
                by_transaction_type: [
                    {
                        $group: {
                            _id: '$transaction_type',
                            transaction_count: { $sum: 1 },
                            total_revenue: { $sum: '$amount' }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            transaction_type: '$_id',
                            transaction_count: 1,
                            total_revenue: 1
                        }
                    },
                    { $sort: { total_revenue: -1 } }
                ]
            }
        }
    ];

    const expenseFilter = {};
    if (expenseStartDate || expenseEndDate) {
        expenseFilter.expense_date = {};
        if (expenseStartDate) expenseFilter.expense_date.$gte = expenseStartDate;
        if (expenseEndDate) expenseFilter.expense_date.$lte = expenseEndDate;
    }
    const expensePipeline = [
        { $match: expenseFilter },
        {
            $facet: {
                summary: [
                    {
                        $group: {
                            _id: null,
                            total_expenses: { $sum: '$amount' },
                            expense_count: { $sum: 1 }
                        }
                    },
                    { $project: { _id: 0 } }
                ],
                by_category: [
                    {
                        $group: {
                            _id: '$category',
                            expense_count: { $sum: 1 },
                            total_amount: { $sum: '$amount' }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            category: '$_id',
                            expense_count: 1,
                            total_amount: 1
                        }
                    },
                    { $sort: { total_amount: -1 } }
                ]
            }
        }
    ];

    const [[report], [expenseReport]] = await Promise.all([
        Transaction.aggregate(transactionPipeline),
        Expense.aggregate(expensePipeline)
    ]);
    const transactionSummary = report?.summary[0] || {
        total_revenue: 0,
        transaction_count: 0,
        total_walk_ins: 0,
        total_new_members: 0,
        total_renewals: 0
    };
    const expenseSummary = expenseReport?.summary[0] || { total_expenses: 0, expense_count: 0 };
    const totalExpenses = Number(expenseSummary.total_expenses || 0);

    res.json({
        summary: {
            ...transactionSummary,
            total_expenses: totalExpenses,
            expense_count: Number(expenseSummary.expense_count || 0),
            net_profit: Number(transactionSummary.total_revenue || 0) - totalExpenses
        },
        by_cashier: report?.by_cashier || [],
        by_payment_method: report?.by_payment_method || [],
        by_transaction_type: report?.by_transaction_type || [],
        by_expense_category: expenseReport?.by_category || []
    });
};

module.exports = {
    processWalkIn,
    processMembership,
    getDailySummary,
    getRecentTransactions,
    getTransactionHistory,
    getTransactionReport
};