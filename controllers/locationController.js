const Location = require('../models/Location');

// // Create a new location
// exports.createLocation = async (req, res) => {
//     try {
//         const location = new Location(req.body);
//         await location.save();
//         res.status(201).json(location);
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// };
// Create a new location (only one coordinate allowed)
exports.createLocation = async (req, res) => {
    try {
        // Cek apakah sudah ada lokasi di database
        const existingLocation = await Location.findOne();
        
        if (existingLocation) {
            return res.status(400).json({ error: 'Only one location is allowed' });
        }

        // Jika tidak ada, buat lokasi baru
        const location = new Location(req.body);
        await location.save();
        res.status(201).json(location);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


// Get all locations
exports.getAllLocations = async (req, res) => {
    try {
        const locations = await Location.find();
        res.status(200).json(locations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single location by ID
exports.getLocationById = async (req, res) => {
    try {
        const location = await Location.findById(req.params.id);
        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }
        res.status(200).json(location);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a location by ID
exports.updateLocation = async (req, res) => {
    try {
        const location = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }
        res.status(200).json(location);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a location by ID
exports.deleteLocation = async (req, res) => {
    try {
        const location = await Location.findByIdAndDelete(req.params.id);
        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }
        res.status(204).json();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

