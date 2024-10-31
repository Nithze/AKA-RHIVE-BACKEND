const express = require('express');
const {
    register,
    login,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    salesLogin
} = require('../controllers/authController');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Validation for register
const validateRegister = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'manager', 'sales']).withMessage('Role must be either admin, manager or sales'),
];

// Register route
router.post('/register', validateRegister, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    await register(req, res);
});

// Login route
router.post('/login', async (req, res) => {
    await login(req, res);
});

router.post('/sales-login', async (req, res) => { 
    await salesLogin(req, res);
});

// Get all users
router.get('/', async (req, res) => {
    await getAllUsers(req, res);
});

// Get user by ID
router.get('/:id', async (req, res) => {
    await getUserById(req, res);
});

// Update user by ID
router.put('/:id', async (req, res) => {
    await updateUser(req, res);
});

// Delete user by ID
router.delete('/:id', async (req, res) => {
    await deleteUser(req, res);
});

module.exports = router;

