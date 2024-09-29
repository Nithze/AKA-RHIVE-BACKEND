const Item = require("../models/Item");

// Get all items
exports.getItems = async (req, res) => {
	try {
		const items = await Item.find();
		res.status(200).json(items);
	} catch (error) {
		res.status(500).json({ message: "Error fetching items", error });
	}
};

// Get a single item by ID
exports.getItemById = async (req, res) => {
	try {
		const item = await Item.findById(req.params.id);
		if (!item) {
			return res.status(404).json({ message: "Item not found" });
		}
		res.status(200).json(item);
	} catch (error) {
		res.status(500).json({ message: "Error fetching item", error });
	}
};

// Update an item by ID
exports.updateItem = async (req, res) => {
	try {
		const { item_name, stock, supplier, reorder_level } = req.body;
		const updatedItem = await Item.findByIdAndUpdate(
			req.params.id,
			{ item_name, stock, supplier, reorder_level },
			{ new: true }
		);
		if (!updatedItem) {
			return res.status(404).json({ message: "Item not found" });
		}
		res.status(200).json(updatedItem);
	} catch (error) {
		res.status(500).json({ message: "Error updating item", error });
	}
};

// Delete an item by ID
exports.deleteItem = async (req, res) => {
	try {
		const deletedItem = await Item.findByIdAndDelete(req.params.id);
		if (!deletedItem) {
			return res.status(404).json({ message: "Item not found" });
		}
		res.status(200).json({ message: "Item deleted successfully" });
	} catch (error) {
		res.status(500).json({ message: "Error deleting item", error });
	}
};
