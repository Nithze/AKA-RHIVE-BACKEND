const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    nik: {
        type: String,
        required: true,
        unique: true,
    },
    birthDate: {
        type: Date,
        required: true,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shift',
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    // Field baru untuk nomor rekening dan rekening atas nama
    bankAccountNumber: {
        type: String,
        required: true, // Bisa jadi tidak wajib
    },
    accountHolderName: {
        type: String,
        required: true, // Bisa jadi tidak wajib
    }
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;

