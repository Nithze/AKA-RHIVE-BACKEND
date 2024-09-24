const express = require('express');
const { register, login } = require('../controllers/authController');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const validateRegister = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'manager']).withMessage('Role must be either admin or manager'),
];

router.post('/register', validateRegister, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    await register(req, res);
});

router.post('/login', async (req, res) => {
    await login(req, res);
});

module.exports = router;

