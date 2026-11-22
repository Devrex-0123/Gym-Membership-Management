const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    member_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    checked_in_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    attendance_date: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}-\d{2}$/
    },
    check_in_hour: {
        type: Number,
        required: true,
        min: 0,
        max: 23
    }
}, { timestamps: true });

attendanceSchema.index({ member_id: 1, attendance_date: 1 }, { unique: true });
attendanceSchema.index({ attendance_date: 1, createdAt: -1 });
attendanceSchema.index({ member_id: 1, createdAt: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
