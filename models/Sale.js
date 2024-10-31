// models/Sale.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SaleSchema = new Schema({
    date: {
        type: Date,
        default: Date.now,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",  // Reference to the User model
        required: true,
    },
    items: [
        {
            item_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Item",  // Reference to the Item model
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
            },
        },
    ],
});

module.exports = mongoose.model("Sale", SaleSchema);
