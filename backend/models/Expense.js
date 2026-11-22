const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = [
    'rent',
    'utilities',
    'payroll',
    'maintenance',
    'supplies',
    'marketing',
    'equipment',
    'other'
];

const expenseSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: EXPENSE_CATEGORIES,
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    vendor: {
        type: String,
        trim: true,
        maxlength: 100,
        default: ''
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    expense_date: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}-\d{2}$/
    },
    recorded_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    }
}, { timestamps: true });

expenseSchema.index({ expense_date: -1, createdAt: -1 });
expenseSchema.index({ category: 1, expense_date: -1 });

module.exports = {
    Expense: mongoose.model('Expense', expenseSchema),
    EXPENSE_CATEGORIES
};
