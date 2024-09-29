const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const HistorySchema = new Schema({
	date: {
		type: Date,
		default: Date.now,
	},
	user_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	items: [
		{
			item_id: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Item",
				required: true,
			},
			quantity: {
				type: Number,
				required: true,
			},
		},
	],
});

module.exports = mongoose.model("History", HistorySchema);
