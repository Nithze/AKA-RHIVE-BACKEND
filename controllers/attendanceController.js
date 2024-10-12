const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');

// Check In
exports.checkIn = async (req, res) => {
    const { employeeId } = req.body;

    try {
        const employee = await Employee.findById(employeeId).populate('shift');
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const shift = employee.shift;
        const currentTime = new Date();

        // Parse startTime dari shift ke objek Date
        const shiftStart = new Date();
        const [startHour, startMinute] = shift.startTime.split(':');
        const isPM = shift.startTime.endsWith('PM');
        
        shiftStart.setHours(parseInt(startHour) + (isPM ? 12 : 0), parseInt(startMinute.slice(0, 2)), 0, 0);

        // Waktu check-in yang diperbolehkan
        const checkInStart = new Date(shiftStart.getTime() - 15 * 60 * 1000); // 15 menit sebelum
        const checkInEnd = new Date(shiftStart.getTime() + 2 * 60 * 60 * 1000); // 2 jam setelah

        if (currentTime < checkInStart || currentTime > checkInEnd) {
            return res.status(400).json({ message: 'You can only check in 15 minutes before your shift starts and up to 2 hours after.' });
        }

        const today = new Date();
        const attendanceToday = await Attendance.findOne({
            employee: employeeId,
            checkInTime: {
                $gte: new Date(today.setHours(0, 0, 0, 0)),
                $lt: new Date(today.setHours(23, 59, 59, 999))
            }
        });

        if (attendanceToday) {
            return res.status(400).json({ message: 'You have already checked in today.' });
        }

        const attendance = new Attendance({
            employee: employeeId,
            shift: shift._id,
            checkInTime: currentTime,
        });

        await attendance.save();
        res.status(201).json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Error checking in', error });
    }
};

// Check Out
exports.checkOut = async (req, res) => {
    const { attendanceId } = req.body;

    try {
        const attendance = await Attendance.findById(attendanceId).populate('shift');
        if (!attendance) {
            return res.status(404).json({ message: 'Attendance not found' });
        }

        const currentTime = new Date();
        const [endHour, endMinute] = attendance.shift.endTime.split(':');
        const isEndPM = attendance.shift.endTime.endsWith('PM');
        
        const shiftEnd = new Date();
        let endHour24 = parseInt(endHour) + (isEndPM && parseInt(endHour) !== 12 ? 12 : 0);
        if (endHour === '12' && isEndPM) {
            endHour24 = 12;
        } else if (endHour === '12' && !isEndPM) {
            endHour24 = 0;
        }
        
        shiftEnd.setHours(endHour24, parseInt(endMinute.slice(0, 2)), 0, 0);

        if (currentTime < shiftEnd) {
            return res.status(400).json({ message: 'You can only check out after your shift has ended.' });
        }

        if (attendance.checkOutTime) {
            const checkOutDate = new Date(attendance.checkOutTime);
            const isSameDay = checkOutDate.toDateString() === currentTime.toDateString();
            if (isSameDay) {
                return res.status(400).json({ message: 'You have already checked out today.' });
            }
        }

        attendance.checkOutTime = currentTime;

        await attendance.save();
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Error checking out', error });
    }
};

// // Request Leave
// exports.requestLeave = async (req, res) => {
//     const { employeeId, reason, file } = req.body;
//
//     try {
//         const employee = await Employee.findById(employeeId).populate('shift');
//         if (!employee) {
//             return res.status(404).json({ message: 'Employee not found' });
//         }
//
//         const leaveRequest = new Attendance({
//             employee: employeeId,
//             shift: employee.shift._id, // Mengambil shift dari employee
//             status: 'Pending', // Status awal Pending
//             reason: reason,
//             file: file,
//         });
//
//         await leaveRequest.save();
//         res.status(201).json(leaveRequest);
//     } catch (error) {
//         res.status(500).json({ message: 'Error requesting leave', error });
//     }
// };
// Request Leave
exports.requestLeave = async (req, res) => {
    const { employeeId, reason, file } = req.body;

    try {
        const employee = await Employee.findById(employeeId).populate('shift');
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Awal hari
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // Akhir hari

        // Cek apakah karyawan sudah melakukan check-in hari ini
        const checkInToday = await Attendance.findOne({
            employee: employeeId,
            status: 'Present', // Status untuk check-in
            createdAt: { $gte: startOfDay, $lt: endOfDay },
        });

        if (checkInToday) {
            return res.status(400).json({ message: 'You cannot request leave after checking in.' });
        }

        // Cek apakah karyawan sudah pernah mengajukan izin hari ini
        const leaveRequestToday = await Attendance.findOne({
            employee: employeeId,
            status: 'Pending', // Status pengajuan izin
            reason: { $exists: true }, // Hanya yang punya alasan (izin)
            createdAt: { $gte: startOfDay, $lt: endOfDay },
        });

        if (leaveRequestToday) {
            return res.status(400).json({ message: 'You have already requested leave today.' });
        }

        // Jika karyawan belum check-in dan belum mengajukan izin, proses pengajuan izin
        const leaveRequest = new Attendance({
            employee: employeeId,
            shift: employee.shift._id, // Mengambil shift dari employee
            status: 'Pending', // Status awal Pending
            reason: reason,
            file: file,
        });

        await leaveRequest.save();
        res.status(201).json(leaveRequest);
    } catch (error) {
        res.status(500).json({ message: 'Error requesting leave', error });
    }
};


// Approve Leave
exports.approveLeave = async (req, res) => {
    const { attendanceId } = req.params;

    try {
        const attendance = await Attendance.findById(attendanceId);
        if (!attendance) {
            return res.status(404).json({ message: 'Attendance not found' });
        }

        attendance.status = 'Izin'; // Ubah status menjadi Izin
        await attendance.save();
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Error approving leave', error });
    }
};

// Get Attendance by Employee
exports.getAttendanceByEmployee = async (req, res) => {
    const { employeeId } = req.params;

    try {
        const attendances = await Attendance.find({ employee: employeeId }).populate('shift');
        res.json(attendances);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance', error });
    }
};

// Get All Attendance
exports.getAllAttendance = async (req, res) => {
    try {
        const attendances = await Attendance.find().populate('employee shift');
        res.json(attendances);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all attendance', error });
    }
};

// Get Attendance by Shift ID
exports.getAttendanceByShiftId = async (req, res) => {
    const { shiftId } = req.params;

    try {
        const attendances = await Attendance.find({ shift: shiftId }).populate('employee');
        res.json(attendances);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance by shift ID', error });
    }
};

// Get Current Shift Attendance
exports.getCurrentShiftAttendance = async (req, res) => {
    const currentTime = new Date();

    try {
        const shifts = await Shift.find();

        const currentShiftAttendances = [];

        for (const shift of shifts) {
            const shiftStart = new Date();
            const [startHour, startMinute] = shift.startTime.split(':');
            const isStartPM = shift.startTime.endsWith('PM');
            shiftStart.setHours(parseInt(startHour) + (isStartPM ? 12 : 0), parseInt(startMinute.slice(0, 2)), 0, 0);

            const shiftEnd = new Date();
            const [endHour, endMinute] = shift.endTime.split(':');
            const isEndPM = shift.endTime.endsWith('PM');
            let endHour24 = parseInt(endHour) + (isEndPM && parseInt(endHour) !== 12 ? 12 : 0);
            if (endHour === '12' && isEndPM) {
                endHour24 = 12;
            } else if (endHour === '12' && !isEndPM) {
                endHour24 = 0;
            }
            shiftEnd.setHours(endHour24, parseInt(endMinute.slice(0, 2)), 0, 0);

            if (currentTime >= shiftStart && currentTime <= shiftEnd) {
                const attendances = await Attendance.find({ shift: shift._id }).populate('employee');
                currentShiftAttendances.push({
                    shift,
                    attendances,
                });
            }
        }

        res.json(currentShiftAttendances);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching current shift attendance', error });
    }
};


// Get All Attendance in a Month
exports.getAttendanceInMonth = async (req, res) => {
        const { year, month } = req.params; // Ambil parameter tahun dan bulan

    try {
        // Dapatkan tanggal awal dan akhir bulan
        const startDate = new Date(year, month - 1, 1); // Bulan di JavaScript dimulai dari 0
        const endDate = new Date(year, month, 0); // Mengambil hari terakhir bulan ini

        // Dapatkan semua karyawan
        const employees = await Employee.find().populate('shift');

        const attendanceData = await Promise.all(
            employees.map(async (employee) => {
                // Dapatkan attendances karyawan dalam rentang tanggal tersebut
                const attendances = await Attendance.find({
                    employee: employee._id,
                    checkInTime: {
                        $gte: startDate,
                        $lt: new Date(endDate.setDate(endDate.getDate() + 1)), // Tambah satu hari untuk menyertakan hari terakhir
                    },
                });

                // Buat array untuk menyimpan status harian
                const attendanceRecords = [];
                const daysInMonth = new Date(year, month, 0).getDate(); // Dapatkan jumlah hari dalam bulan

                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month - 1, day);
                    const formattedDate = date.toISOString().split('T')[0]; // Format tanggal ke YYYY-MM-DD

                    // Cek apakah ada data absensi untuk tanggal ini
                    const attendance = attendances.find(att => att.checkInTime.toISOString().split('T')[0] === formattedDate);
                    if (attendance) {
                        attendanceRecords.push({
                            date: formattedDate,
                            status: attendance.status,
                        });
                    } else {
                        attendanceRecords.push({
                            date: formattedDate,
                            status: 'Alpha', // Status tidak hadir
                        });
                    }
                }

                return {
                    employeeId: employee._id,
                    employeeName: employee.fullName,
                    shiftId: employee.shift._id,
                    shiftName: employee.shift.shiftName,
                    shiftStart: employee.shift.startTime,
                    shiftEnd: employee.shift.endTime,
                    attendance: attendanceRecords,
                };
            })
        );

        res.json(attendanceData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance by month', error });
    }
};

