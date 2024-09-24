const Shift = require('../models/Shift');

// bikin shift baru
exports.createShift = async (req, res) => {
    const { shiftName, startTime, endTime, description } = req.body;

    try {
        const newShift = new Shift({ shiftName, startTime, endTime, description });
        await newShift.save();
        res.status(201).json(newShift);
    } catch (error) {
        res.status(500).json({ message: 'Error creating shift', error });
    }
};

// ambil semua shift
exports.getAllShifts = async (req, res) => {
    try {
        const shifts = await Shift.find();
        res.json(shifts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shifts', error });
    }
};

// Mendapatkan shift berdasarkan ID
exports.getShiftById = async (req, res) => {
    try {
        const shift = await Shift.findById(req.params.id);
        if (!shift) {
            return res.status(404).json({ message: 'Shift not found' });
        }
        res.json(shift);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shift', error });
    }
};

// updet shift
exports.updateShift = async (req, res) => {
    try {
        const updatedShift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedShift) {
            return res.status(404).json({ message: 'Shift not found' });
        }
        res.json(updatedShift);
    } catch (error) {
        res.status(500).json({ message: 'Error updating shift', error });
    }
};

// apus shift
exports.deleteShift = async (req, res) => {
    try {
        const deletedShift = await Shift.findByIdAndDelete(req.params.id);
        if (!deletedShift) {
            return res.status(404).json({ message: 'Shift not found' });
        }
        res.json({ message: 'Shift deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting shift', error });
    }
};

