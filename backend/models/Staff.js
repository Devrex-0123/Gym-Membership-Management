const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    full_name: { type: String, required: true, trim: true },
    role: { 
        type: String, 
        enum: ['admin', 'cashier'], 
        default: 'cashier',
        required: true 
    },
    shift_tag: { 
        type: String, 
        enum: ['morning', 'afternoon', 'flexible'], 
        default: 'flexible' 
    },
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

staffSchema.pre('save', async function() {
    if (!this.isModified('password')) return; // Just return, don't call next()
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to verify password
staffSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Staff', staffSchema);