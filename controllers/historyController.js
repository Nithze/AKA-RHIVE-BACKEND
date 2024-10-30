const History = require("../models/History");
const Item = require("../models/Item");

// Create a new history entry (shipment)
exports.createHistory = async (req, res) => {
	try {
		const { user_id, date, items } = req.body;

		// Process each item in the shipment
		const itemUpdates = await Promise.all(
			items.map(async (item) => {
				// Check if item exists in the Item collection by item_name
				let foundItem = await Item.findOne({ item_name: item.item_name });

				// If item doesn't exist, create a new one
				if (!foundItem) {
					const newItem = new Item({
						item_name: item.item_name, // Ensure `item_name` is passed in the request body
						stock: item.quantity, // Stock starts with the quantity from the shipment
						supplier: item.supplier, // Supplier should be passed in the request
					});
					foundItem = await newItem.save();
				} else {
					// If item exists, update the stock
					foundItem.stock += item.quantity;
					await foundItem.save();
				}

				// Return the found or newly created item ID to link it with the history record
				return { item_id: foundItem._id, quantity: item.quantity };
			})
		);

		// Create a new history entry after ensuring all items are processed
		const newHistory = new History({
			user_id,
			date, // Include the date of the shipment
			items: itemUpdates, // Link the updated items (with ID and quantity)
		});
		await newHistory.save();

		res.status(201).json(newHistory);
	} catch (error) {
		console.error("Error creating history:", error);
		res.status(500).json({ message: "Error creating history", error });
	}
};

// Get all history entries
exports.getHistories = async (req, res) => {
	try {
		const histories = await History.find()
			.populate("user_id", "name")
			.populate("items.item_id", "item_name supplier");
		res.status(200).json(histories);
	} catch (error) {
		res.status(500).json({ message: "Error fetching histories", error });
	}
};

// Get a single history entry by ID
exports.getHistoryById = async (req, res) => {
	try {
		const history = await History.findById(req.params.id)
			.populate("user_id", "name")
			.populate("items.item_id", "item_name");
		if (!history) {
			return res.status(404).json({ message: "History not found" });
		}
		res.status(200).json(history);
	} catch (error) {
		res.status(500).json({ message: "Error fetching history", error });
	}
};

// Update a history entry by ID (This would be rare but just in case you need it)
exports.updateHistory = async (req, res) => {
	try {
		const { user_id, items } = req.body;

		const itemUpdates = items.map(async (item) => {
			let foundItem = await Item.findById(item.item_id);

			if (!foundItem) {
				const newItem = new Item({
					item_name: item.item_name,
					stock: item.quantity,
					supplier: item.supplier,
					reorder_level: item.reorder_level || 3,
				});
				foundItem = await newItem.save();
			} else {
				foundItem.stock += item.quantity;
				await foundItem.save();
			}

			return { item_id: foundItem._id, quantity: item.quantity };
		});

		const updatedItems = await Promise.all(itemUpdates);

		const updatedHistory = await History.findByIdAndUpdate(
			req.params.id,
			{ user_id, items: updatedItems },
			{ new: true }
		)
			.populate("user_id", "name")
			.populate("items.item_id", "item_name");

		if (!updatedHistory) {
			return res.status(404).json({ message: "History not found" });
		}

		res.status(200).json(updatedHistory);
	} catch (error) {
		res.status(500).json({ message: "Error updating history", error });
	}
};

// Delete a history entry by ID
exports.deleteHistory = async (req, res) => {
	try {
		const deletedHistory = await History.findByIdAndDelete(req.params.id);
		if (!deletedHistory) {
			return res.status(404).json({ message: "History not found" });
		}
		res.status(200).json({ message: "History entry deleted successfully" });
	} catch (error) {
		res.status(500).json({ message: "Error deleting history", error });
	}
};
