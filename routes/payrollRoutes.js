const express = require('express');
const router = express.Router();
const PayrollController = require('../controllers/payrollController');

// Route untuk membuat penggajian
router.post('/payroll', PayrollController.createPayroll);

module.exports = router;

