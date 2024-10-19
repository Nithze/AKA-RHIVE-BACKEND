// const mongoose = require('mongoose');
//
// const PayrollSchema = new mongoose.Schema({
//     employee: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Employee',
//         required: true,
//     },
//     month: {
//         type: Number,
//         required: true,
//     },
//     year: {
//         type: Number,
//         required: true,
//     },
//     basicSalary: {
//         type: Number,
//         required: true,
//     },
//     deductions: [{
//         description: {
//             type: String,
//             required: true,
//         },
//         amount: {
//             type: Number,
//             required: true,
//         },
//     }],
//     alphaCount: {
//         type: Number,
//         default: 0,
//     },
//     totalDeductions: {
//         type: Number,
//         default: 0,
//     },
//     netSalary: {
//         type: Number,
//         required: true,
//     },
// }, { timestamps: true });
//
// const Payroll = mongoose.model('Payroll', PayrollSchema);
// module.exports = Payroll;
//
const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
    },
    month: {
        type: Number,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    basicSalary: {
        type: Number,
        required: true,
    },
    deductions: [{
        description: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
    }],
    bonuses: [{  // Tambahkan field untuk bonus
        name: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
    }],
    alphaCount: {
        type: Number,
        default: 0,
    },
    totalDeductions: {
        type: Number,
        default: 0,
    },
    netSalary: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

const Payroll = mongoose.model('Payroll', PayrollSchema);
module.exports = Payroll;

