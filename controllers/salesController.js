// controllers/salesController.js
const Sale = require("../models/Sale");
const Item = require("../models/Item");
const User = require("../models/User");

// Create a new sale
exports.createSale = async (req, res) => {
	try {
		const sale = new Sale(req.body);
		await sale.save();

		// Update the stock for each item sold
		for (const soldItem of sale.items) {
			await Item.findByIdAndUpdate(soldItem.item_id, { 
				$inc: { stock: -soldItem.quantity }
			});
		}

		res.status(201).json(sale);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

// Get all sales
exports.getAllSales = async (req, res) => {
	try {
			const sales = await Sale.find()
					.populate("items.item_id")           
					.populate("user_id", "name");         

			res.status(200).json(sales);
	} catch (error) {
			res.status(500).json({ message: error.message });
	}
};

// Get a single sale by ID
exports.getSaleById = async (req, res) => {
	try {
		const sale = await Sale.findById(req.params.id).populate("items.item_id");
		if (!sale) return res.status(404).json({ message: "Sale not found" });
		res.status(200).json(sale);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Update a sale
exports.updateSale = async (req, res) => {
	try {
		const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });
		if (!sale) return res.status(404).json({ message: "Sale not found" });
		res.status(200).json(sale);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

// Delete a sale
exports.deleteSale = async (req, res) => {
	try {
		const sale = await Sale.findByIdAndDelete(req.params.id);
		if (!sale) return res.status(404).json({ message: "Sale not found" });

		// Adjust stock back for each deleted sale
		for (const soldItem of sale.items) {
			await Item.findByIdAndUpdate(soldItem.item_id, { 
				$inc: { stock: soldItem.quantity }
			});
		}

		res.status(200).json({ message: "Sale deleted" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
