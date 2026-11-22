const mongoose = require('mongoose');

const membershipReminderSchema = new mongoose.Schema({
    member_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    expiry_date: {
        type: Date,
        required: true
    },
    sent_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    sent_at: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

membershipReminderSchema.index({ member_id: 1, expiry_date: 1 }, { unique: true });

module.exports = mongoose.model('MembershipReminder', membershipReminderSchema);
