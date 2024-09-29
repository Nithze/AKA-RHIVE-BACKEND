const express = require("express");
const {
	getItems,
	getItemById,
	updateItem,
	deleteItem,
} = require("../controllers/itemController");

const router = express.Router();

// Get All Items
router.get("/", async (req, res) => {
	await getItems(req, res);
});

// Get Item by ID
router.get("/:id", async (req, res) => {
	await getItemById(req, res);
});

// Update Item by ID
router.put("/:id", async (req, res) => {
	await updateItem(req, res);
});

// Delete Item by ID
router.delete("/:id", async (req, res) => {
	await deleteItem(req, res);
});

module.exports = router;
