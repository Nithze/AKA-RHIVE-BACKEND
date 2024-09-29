const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
	{
		role: {
			type: String,
			required: true,
		},
		salary: {
			type: Number,
			required: true,
		},
		description: {
			type: String,
			required: false,
		},
	},
	{ timestamps: true }
);

const Role = mongoose.model("Role", roleSchema);
module.exports = Role;
