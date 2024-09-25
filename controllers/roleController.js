const Role = require('../models/Role');

// Create Role
exports.createRole = async (req, res) => {
    const { role, salary, description } = req.body;

    try {
        const newRole = new Role({ role, salary, description });
        await newRole.save();
        res.status(201).json(newRole);
    } catch (error) {
        res.status(500).json({ message: 'Error creating role', error });
    }
};

// Get All Roles
exports.getAllRoles = async (req, res) => {
    try {
        const roles = await Role.find();
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching roles', error });
    }
};

// Get Role by ID
exports.getRoleById = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }
        res.json(role);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching role', error });
    }
};

// Update Role
exports.updateRole = async (req, res) => {
    const { role, salary, description } = req.body;

    try {
        const updatedRole = await Role.findByIdAndUpdate(
            req.params.id,
            { role, salary, description },
            { new: true }
        );

        if (!updatedRole) {
            return res.status(404).json({ message: 'Role not found' });
        }

        res.json(updatedRole);
    } catch (error) {
        res.status(500).json({ message: 'Error updating role', error });
    }
};

// Delete Role
exports.deleteRole = async (req, res) => {
    try {
        const deletedRole = await Role.findByIdAndDelete(req.params.id);
        if (!deletedRole) {
            return res.status(404).json({ message: 'Role not found' });
        }
        res.json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting role', error });
    }
};

