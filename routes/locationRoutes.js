const express = require('express');
const {
    createLocation,
    getAllLocations,
    getLocationById,
    updateLocation,
    deleteLocation,
} = require('../controllers/locationController');

const router = express.Router();

router.post('/', createLocation);
router.get('/', getAllLocations);
router.get('/:id', getLocationById);
router.put('/:id', updateLocation);
router.delete('/:id', deleteLocation);

module.exports = router;

