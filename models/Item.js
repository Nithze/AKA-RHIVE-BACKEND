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

// Pre-save middleware to automatically adjust reorder level based on stock
ItemSchema.pre("save", function (next) {
	// Check the current stock and update reorder_level
	if (this.stock >= 50) {
		this.reorder_level = 3; // plentiful
	} else if (this.stock >= 15 && this.stock < 50) {
		this.reorder_level = 2; // getting low
	} else if (this.stock < 15) {
		this.reorder_level = 1; // reorder immediately
	}
	next();
});

module.exports = mongoose.model("Item", ItemSchema);
