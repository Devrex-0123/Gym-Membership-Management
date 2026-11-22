const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const memberSchema = new mongoose.Schema({
    member_code: { 
        type: String, 
        required: true, 
        unique: true, 
        uppercase: true // e.g., GYM-1001 (Used for QR codes)
    },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    phone: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
    },
    password: { type: String, required: true, minlength: 6 }, // For mobile login
    photo_url: { type: String, default: '' },
    
    // Membership Tracking
    membership_status: { 
        type: String, 
        enum: ['active', 'expired', 'none'], 
        default: 'none' 
    },
    expiry_date: { type: Date, default: null },

    is_blacklisted: { type: Boolean, default: false }
}, { timestamps: true });

memberSchema.index({ expiry_date: 1, membership_status: 1 });

// Hash password before saving
memberSchema.pre('save', async function() {
    if (!this.isModified('password')) return; // Just return, don't call next()
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

memberSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual to get full name
memberSchema.virtual('full_name').get(function() {
    return `${this.first_name} ${this.last_name}`;
});

module.exports = mongoose.model('Member', memberSchema);