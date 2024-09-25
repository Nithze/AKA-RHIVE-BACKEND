const express = require('express');
const {
    createRole,
    getAllRoles,
    getRoleById,
    updateRole,
    deleteRole
} = require('../controllers/roleController');

const router = express.Router();

// Create Role
router.post('/', async (req, res) => {
    await createRole(req, res);
});

// Get All Roles
router.get('/', async (req, res) => {
    await getAllRoles(req, res);
});

// Get Role by ID
router.get('/:id', async (req, res) => {
    await getRoleById(req, res);
});

// Update Role by ID
router.put('/:id', async (req, res) => {
    await updateRole(req, res);
});

// Delete Role by ID
router.delete('/:id', async (req, res) => {
    await deleteRole(req, res);
});

module.exports = router;

