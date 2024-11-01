// routes/sales.js
const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");

router.get('/frequently-sold', salesController.getFrequentlySoldItems)
router.post("/", salesController.createSale);         // Create new sale
router.get("/", salesController.getAllSales);         // Get all sales
router.get("/:id", salesController.getSaleById);      // Get a single sale
router.put("/:id", salesController.updateSale);       // Update a sale
router.delete("/:id", salesController.deleteSale);    // Delete a sale

module.exports = router;
