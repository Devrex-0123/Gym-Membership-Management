const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transaction_code: { 
        type: String, 
        required: true, 
        unique: true 
    },
    
    // Relationships
    member_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Member', 
        default: null // Null if it's a walk-in
    },
    cashier_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Staff', 
        required: true 
    },
    
    // Transaction Details
    transaction_type: { 
        type: String, 
        enum: ['walk_in', 'membership_new', 'membership_renewal'], 
        required: true 
    },
    category_name: { 
        type: String, 
        required: true // e.g., "Morning Promo", "Monthly", "Yearly"
    },
    
    // Financials
    amount: { type: Number, required: true, min: 0 },
    payment_method: { 
        type: String, 
        enum: ['cash', 'gcash', 'paymaya', 'card'], 
        default: 'cash',
        required: true
    }
}, { timestamps: true }); // createdAt will act as our transaction_date

module.exports = mongoose.model('Transaction', transactionSchema);