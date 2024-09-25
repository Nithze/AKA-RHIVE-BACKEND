const express = require('express');
const {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
} = require('../controllers/employeeController');

const router = express.Router();

// Create Employee
router.post('/', async (req, res) => {
    await createEmployee(req, res);
});

// Get All Employees (with role and shift details)
router.get('/', async (req, res) => {
    await getAllEmployees(req, res);
});

// Get Employee by ID (with role and shift details)
router.get('/:id', async (req, res) => {
    await getEmployeeById(req, res);
});

// Update Employee by ID
router.put('/:id', async (req, res) => {
    await updateEmployee(req, res);
});

// Delete Employee by ID
router.delete('/:id', async (req, res) => {
    await deleteEmployee(req, res);
});

module.exports = router;

