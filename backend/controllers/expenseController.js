const { Expense, EXPENSE_CATEGORIES } = require('../models/Expense');

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parsePositiveInteger = (value, defaultValue) => {
    if (value === undefined) return defaultValue;
    if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
};

const isValidDate = (value) => {
    if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
    const parsedDate = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createExpense = async (req, res) => {
    const { category, description, vendor = '', amount, expense_date } = req.body || {};
    if (!EXPENSE_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: 'Select a valid expense category' });
    }
    if (typeof description !== 'string' || !description.trim() || description.trim().length > 200) {
        return res.status(400).json({ message: 'Description is required and must be 200 characters or fewer' });
    }
    if (typeof vendor !== 'string' || vendor.trim().length > 100) {
        return res.status(400).json({ message: 'Vendor must be 100 characters or fewer' });
    }
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    if (!isValidDate(expense_date)) {
        return res.status(400).json({ message: 'Expense date must be a valid YYYY-MM-DD date' });
    }

    const expense = await Expense.create({
        category,
        description: description.trim(),
        vendor: vendor.trim(),
        amount,
        expense_date,
        recorded_by: req.user._id
    });

    res.status(201).json({ expense });
};

const getExpenses = async (req, res) => {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, DEFAULT_PAGE_SIZE);
    const { startDate, endDate, category } = req.query;
    const search = req.query.search || '';
    if (page === null || page < 1 || limit === null || limit < 1 || limit > MAX_PAGE_SIZE) {
        return res.status(400).json({ message: 'Page must be positive and limit must be between 1 and 100' });
    }
    if ((startDate && !isValidDate(startDate)) || (endDate && !isValidDate(endDate))) {
        return res.status(400).json({ message: 'Dates must use the valid YYYY-MM-DD format' });
    }
    if (startDate && endDate && startDate > endDate) {
        return res.status(400).json({ message: 'Start date must be on or before end date' });
    }
    if (category && !EXPENSE_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: 'Invalid expense category' });
    }
    if (typeof search !== 'string' || search.length > 100) {
        return res.status(400).json({ message: 'Search must be 100 characters or fewer' });
    }

    const filter = {};
    if (startDate || endDate) {
        filter.expense_date = {};
        if (startDate) filter.expense_date.$gte = startDate;
        if (endDate) filter.expense_date.$lte = endDate;
    }
    if (category) filter.category = category;
    if (search.trim()) {
        const searchPattern = new RegExp(escapeRegex(search.trim()), 'i');
        filter.$or = [
            { description: searchPattern },
            { vendor: searchPattern }
        ];
    }

    const [expenses, total] = await Promise.all([
        Expense.find(filter)
            .populate('recorded_by', 'full_name')
            .sort({ expense_date: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Expense.countDocuments(filter)
    ]);

    res.json({
        expenses,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
};

module.exports = { createExpense, getExpenses };
