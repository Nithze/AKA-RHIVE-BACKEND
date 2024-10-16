const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
    },
    shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shift',
        required: true,
    },
    checkInTime: {
        type: Date,
        required: false,
    },
    checkOutTime: {
        type: Date,
        required: false,
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Alpha', 'Pending', 'Excused'],
        default: 'Present',
    },
    reason: {
        type: String,
        required: false,
    },
    file: {
        type: String, // Untuk menyimpan URL atau path file izin
        required: false,
    },
        lateTime: {
        type: Number, // Dalam menit
        required: false,
    },
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

