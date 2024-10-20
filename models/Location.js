const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    coordinates: {
        type: [Number],
        required: true,
    },
});

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;

