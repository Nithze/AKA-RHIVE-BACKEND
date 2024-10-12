// const mongoose = require('mongoose');
//
// const shiftSchema = new mongoose.Schema({
//     shiftName: {
//         type: String,
//         required: true,
//     },
//     startTime: {
//         type: String,
//         required: true,
//         validate: {
//             validator: function(v) {
//                 return /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(v); // hh:mm AM/PM
//             },
//             message: props => `${props.value} is not a valid time format! Use hh:mm AM/PM.`,
//         },
//     },
//     endTime: {
//         type: String,
//         required: true,
//         validate: {
//             validator: function(v) {
//                 return /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(v); // hh:mm AM/PM
//             },
//             message: props => `${props.value} is not a valid time format! Use hh:mm AM/PM.`,
//         },
//     },
//     description: {
//         type: String,
//         required: false,
//     },
// }, { timestamps: true });
//
// module.exports = mongoose.model('Shift', shiftSchema);
//
const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
    shiftName: {
        type: String,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v); // hh:mm 24-hour format
            },
            message: props => `${props.value} is not a valid time format! Use HH:mm (24-hour format).`,
        },
    },
    endTime: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v); // hh:mm 24-hour format
            },
            message: props => `${props.value} is not a valid time format! Use HH:mm (24-hour format).`,
        },
    },
    description: {
        type: String,
        required: false,
    },
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);

