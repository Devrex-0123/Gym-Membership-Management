const Attendance = require('../models/Attendance');
const Member = require('../models/Member');
const Staff = require('../models/Staff');

const getLocalDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const isValidDateKey = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsedDate = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
};

const getMemberSummary = (member) => ({
    _id: member._id,
    member_code: member.member_code,
    full_name: `${member.first_name} ${member.last_name}`,
    membership_status: member.membership_status,
    expiry_date: member.expiry_date
});

const sendDuplicateCheckIn = async (res, member, attendance) => res.status(200).json({
    alreadyCheckedIn: true,
    message: `${member.first_name} has already checked in today.`,
    member: getMemberSummary(member),
    attendance
});

const checkInMember = async (req, res) => {
    const memberCode = typeof req.body?.member_code === 'string' ? req.body.member_code.trim().toUpperCase() : '';
    if (!memberCode || memberCode.length > 32) {
        return res.status(400).json({ message: 'Enter a valid member code' });
    }

    const member = await Member.findOne({ member_code: memberCode }).select('-password');
    if (!member) {
        return res.status(404).json({ message: 'No member found with that code' });
    }

    if (member.is_blacklisted) {
        return res.status(403).json({ message: 'This member is blocked from checking in. Contact an administrator.' });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const expiryDay = member.expiry_date ? new Date(member.expiry_date) : null;
    if (expiryDay) expiryDay.setHours(0, 0, 0, 0);

    if (member.membership_status !== 'active' || !expiryDay || Number.isNaN(expiryDay.getTime()) || expiryDay < todayStart) {
        return res.status(403).json({ message: 'This member does not have a valid active membership' });
    }

    const attendanceDate = getLocalDateKey(now);
    const attendanceRecord = {
        member_id: member._id,
        checked_in_by: req.user._id,
        attendance_date: attendanceDate,
        check_in_hour: now.getHours()
    };

    try {
        const attendance = await Attendance.create(attendanceRecord);
        return res.status(201).json({
            alreadyCheckedIn: false,
            message: `${member.first_name} checked in successfully.`,
            member: getMemberSummary(member),
            attendance
        });
    } catch (error) {
        if (error.code !== 11000) throw error;

        const existingAttendance = await Attendance.findOne({
            member_id: member._id,
            attendance_date: attendanceDate
        });
        if (!existingAttendance) throw error;
        return sendDuplicateCheckIn(res, member, existingAttendance);
    }
};

const getTodayAttendance = async (req, res) => {
    const attendance = await Attendance.find({
        attendance_date: getLocalDateKey(new Date())
    })
        .populate('member_id', 'first_name last_name member_code membership_status expiry_date')
        .populate('checked_in_by', 'full_name')
        .sort({ createdAt: -1 })
        .limit(50);

    res.json(attendance);
};

const getMyAttendance = async (req, res) => {
    const attendance = await Attendance.find({ member_id: req.member._id })
        .select('attendance_date createdAt')
        .sort({ createdAt: -1 })
        .limit(20);

    res.json(attendance);
};

const getAttendanceReport = async (req, res) => {
    const { startDate, endDate } = req.query;
    if ((startDate && !isValidDateKey(startDate)) || (endDate && !isValidDateKey(endDate))) {
        return res.status(400).json({ message: 'Dates must use the YYYY-MM-DD format' });
    }
    if (startDate && endDate && startDate > endDate) {
        return res.status(400).json({ message: 'Start date must be on or before end date' });
    }

    const attendanceFilter = {};
    if (startDate || endDate) {
        attendanceFilter.attendance_date = {};
        if (startDate) attendanceFilter.attendance_date.$gte = startDate;
        if (endDate) attendanceFilter.attendance_date.$lte = endDate;
    }

    const [report] = await Attendance.aggregate([
        { $match: attendanceFilter },
        {
            $facet: {
                summary: [
                    {
                        $group: {
                            _id: null,
                            total_check_ins: { $sum: 1 },
                            members: { $addToSet: '$member_id' }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            total_check_ins: 1,
                            unique_members: { $size: '$members' }
                        }
                    }
                ],
                by_day: [
                    {
                        $group: {
                            _id: '$attendance_date',
                            check_ins: { $sum: 1 },
                            members: { $addToSet: '$member_id' }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            date: '$_id',
                            check_ins: 1,
                            unique_members: { $size: '$members' }
                        }
                    },
                    { $sort: { date: 1 } }
                ],
                by_cashier: [
                    {
                        $group: {
                            _id: '$checked_in_by',
                            check_ins: { $sum: 1 }
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
                            check_ins: 1
                        }
                    },
                    { $sort: { check_ins: -1 } }
                ],
                by_hour: [
                    {
                        $group: {
                            _id: '$check_in_hour',
                            check_ins: { $sum: 1 }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            hour: '$_id',
                            check_ins: 1
                        }
                    },
                    { $sort: { hour: 1 } }
                ]
            }
        }
    ]);

    res.json({
        summary: report?.summary[0] || { total_check_ins: 0, unique_members: 0 },
        by_day: report?.by_day || [],
        by_cashier: report?.by_cashier || [],
        by_hour: report?.by_hour || []
    });
};

module.exports = {
    checkInMember,
    getTodayAttendance,
    getMyAttendance,
    getAttendanceReport
};
