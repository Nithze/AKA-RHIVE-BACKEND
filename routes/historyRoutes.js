const express = require("express");
const {
	createHistory,
	getHistories,
	getHistoryById,
	updateHistory,
	deleteHistory,
} = require("../controllers/historyController");

const router = express.Router();

// Create a new History entry (shipment)
router.post("/", async (req, res) => {
	await createHistory(req, res);
});

// Get all History entries
router.get("/", async (req, res) => {
	await getHistories(req, res);
});

// Get History entry by ID
router.get("/:id", async (req, res) => {
	await getHistoryById(req, res);
});

// Update History entry by ID
router.put("/:id", async (req, res) => {
	await updateHistory(req, res);
});

// Delete History entry by ID
router.delete("/:id", async (req, res) => {
	await deleteHistory(req, res);
});

module.exports = router;
