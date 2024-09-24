const express = require('express');
const {
    createShift,
    getAllShifts,
    getShiftById,
    updateShift,
    deleteShift
} = require('../controllers/shiftController');
const router = express.Router();

// Rute CRUD 
router.post('/', createShift);
router.get('/', getAllShifts);
router.get('/:id', getShiftById);
router.put('/:id', updateShift);
router.delete('/:id', deleteShift);

module.exports = router;


