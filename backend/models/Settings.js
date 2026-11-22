const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    gym_name: { type: String, default: "My Gym" },
    
    walk_in_rates: [{
        category_name: { type: String, required: true }, 
        price: { type: Number, required: true, min: 0 },
        is_active: { type: Boolean, default: true }
    }],
    
    membership_rates: [{
        package_name: { type: String, required: true }, 
        duration_days: { type: Number, required: true, min: 1 }, 
        price: { type: Number, required: true, min: 0 },
        is_active: { type: Boolean, default: true }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);