const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
	item_name: {
		type: String,
		required: true,
	},
	stock: {
		type: Number,
		required: true,
		default: 0,
	},
	supplier: {
		type: String,
		required: true,
	},
	reorder_level: {
		type: Number,
		enum: [1, 2, 3], // 1: reorder immediately, 2: getting low, 3: plentiful
		required: true,
		default: 3,
	},
});

module.exports = mongoose.model("Item", ItemSchema);
