const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');

// // Check In
// exports.checkIn = async (req, res) => {
//     const { employeeId } = req.body;
//
//     try {
//         const employee = await Employee.findById(employeeId).populate('shift');
//         if (!employee) {
//             return res.status(404).json({ message: 'Employee not found' });
//         }
//
//         // Cek apakah karyawan memiliki pengajuan izin yang masih pending atau disetujui
//         const leaveRequest = await Attendance.findOne({
//             employee: employeeId,
//             status: { $in: ['Pending', 'Absent'] }, // Status izin yang relevan
//             reason: { $exists: true }, // Pastikan ada alasan izin
//             createdAt: {
//                 $gte: new Date(new Date().setHours(0, 0, 0, 0)), // Awal hari
//                 $lt: new Date(new Date().setHours(23, 59, 59, 999)) // Akhir hari
//             }
//         });
//
//         if (leaveRequest) {
//             return res.status(400).json({ message: 'You cannot check in because you have a pending leave request.' });
//         }
//
//         const shift = employee.shift;
//         const currentTime = new Date();
//
//         // Parse startTime dari shift ke objek Date
//         const [startHour, startMinute] = shift.startTime.split(':');
//         const shiftStart = new Date(currentTime);
//         shiftStart.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
//
//         // Waktu check-in yang diperbolehkan
//         const checkInStart = new Date(shiftStart.getTime() - 15 * 60 * 1000); // 15 menit sebelum shift
//         const checkInEnd = new Date(shiftStart.getTime() + 2 * 60 * 60 * 1000); // 2 jam setelah shift
//
//         if (currentTime < checkInStart || currentTime > checkInEnd) {
//             return res.status(400).json({ message: 'You can only check in 15 minutes before your shift starts and up to 2 hours after.' });
//         }
//
//         const today = new Date();
//         const attendanceToday = await Attendance.findOne({
//             employee: employeeId,
//             checkInTime: {
//                 $gte: new Date(today.setHours(0, 0, 0, 0)),
//                 $lt: new Date(today.setHours(23, 59, 59, 999))
//             }
//         });
//
//         if (attendanceToday) {
//             return res.status(400).json({ message: 'You have already checked in today.' });
//         }
//
//         // Hitung keterlambatan
//         let lateTime = 0;
//         if (currentTime > shiftStart) {
//             const lateMs = currentTime - shiftStart;
//             lateTime = Math.floor(lateMs / (1000 * 60)); // Konversi dari milidetik ke menit
//         }
//
//         const attendance = new Attendance({
//             employee: employeeId,
//             shift: shift._id,
//             checkInTime: currentTime,
//             lateTime, // Simpan waktu keterlambatan
//         });
//
//         await attendance.save();
//         res.status(201).json(attendance);
//     } catch (error) {
//         res.status(500).json({ message: 'Error checking in', error });
//     }
// };
// Check In
exports.checkIn = async (req, res) => {
    const { employeeId } = req.body;

    try {
        const employee = await Employee.findById(employeeId).populate('shift');
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const leaveRequest = await Attendance.findOne({
            employee: employeeId,
            status: { $in: ['Pending', 'Absent'] },
            reason: { $exists: true },
            createdAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
        });

        if (leaveRequest) {
            return res.status(400).json({ message: 'You cannot check in because you have a leave request.' });
        }

        const shift = employee.shift;
        const currentTime = new Date();

        const today = new Date();
        const attendanceToday = await Attendance.findOne({
            employee: employeeId,
            checkInTime: {
                $gte: new Date(today.setHours(0, 0, 0, 0)),
                $lt: new Date(today.setHours(23, 59, 59, 999))
            }
        });

        // Cek apakah sudah check-in hari ini
        if (attendanceToday) {
            return res.status(400).json({ message: 'You have already checked in today.' });
        }

        // Parse startTime dari shift ke objek Date
        const [startHour, startMinute] = shift.startTime.split(':');
        const shiftStart = new Date(currentTime);
        shiftStart.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

        const checkInStart = new Date(shiftStart.getTime() - 15 * 60 * 1000);
        const checkInEnd = new Date(shiftStart.getTime() + 2 * 60 * 60 * 1000);

        // Cek apakah waktu check-in berada dalam batas yang diperbolehkan
        if (currentTime < checkInStart || currentTime > checkInEnd) {
            return res.status(400).json({ message: 'You can only check in 15 minutes before your shift starts and up to 2 hours after.' });
        }

        // Hitung keterlambatan
        let lateTime = 0;
        if (currentTime > shiftStart) {
            const lateMs = currentTime - shiftStart;
            lateTime = Math.floor(lateMs / (1000 * 60));
        }

        const attendance = new Attendance({
            employee: employeeId,
            shift: shift._id,
            checkInTime: currentTime,
            lateTime,
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
        
        const shiftEnd = new Date();
        shiftEnd.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

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

        attendance.status = 'Absent'; // Ubah status menjadi Izin
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
            const [startHour, startMinute] = shift.startTime.split(':');
            const shiftStart = new Date();
            shiftStart.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

            const [endHour, endMinute] = shift.endTime.split(':');
            const shiftEnd = new Date();
            shiftEnd.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

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


// // Get All Attendance in a Month
// exports.getAttendanceInMonth = async (req, res) => {
//     const { year, month } = req.params; // Ambil parameter tahun dan bulan
//
//     try {
//         // Dapatkan tanggal awal dan akhir bulan
//         const startDate = new Date(year, month - 1, 1);
//         const endDate = new Date(year, month, 0);
//         const today = new Date();
//         today.setHours(0, 0, 0, 0); // Atur waktu ke awal hari
//
//         // Dapatkan semua karyawan
//         const employees = await Employee.find().populate('shift');
//
//         const attendanceData = await Promise.all(
//             employees.map(async (employee) => {
//                 // Dapatkan attendances karyawan dalam rentang tanggal tersebut
//                 const attendances = await Attendance.find({
//                     employee: employee._id,
//                     // Mengambil semua attendance dalam rentang tanggal
//                     createdAt: {
//                         $gte: startDate,
//                         $lt: new Date(endDate.setDate(endDate.getDate() + 1)),
//                     },
//                 });
//
//                 const attendanceRecords = [];
//                 const daysInMonth = new Date(year, month, 0).getDate();
//                 const employeeStartDate = new Date(employee.startDate); // Tanggal mulai kerja karyawan
//                 employeeStartDate.setHours(0, 0, 0, 0); // Set jam karyawan mulai bekerja ke awal hari
//
//                 for (let day = 1; day <= daysInMonth; day++) {
//                     const date = new Date(year, month - 1, day);
//                     date.setHours(0, 0, 0, 0); // Set jam ke awal hari untuk perbandingan yang akurat
//                     const formattedDate = date.toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0];
//
//                     // Cek apakah tanggal ini sebelum tanggal mulai kerja karyawan
//                     if (date < employeeStartDate) {
//                         attendanceRecords.push({
//                             date: formattedDate,
//                             status: 0, // Status untuk tanggal sebelum karyawan mulai bekerja
//                             lateTime: null,
//                             checkInTime: null,
//                             checkOutTime: null,
//                         });
//                         continue; // Lewati pengecekan lebih lanjut untuk tanggal ini
//                     }
//
//                     // Cek apakah ada data absensi untuk tanggal ini
//                     const attendance = attendances.find(att => {
//                         const checkInDate = new Date(att.createdAt).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0];
//                         return checkInDate === formattedDate;
//                     });
//
//                     if (attendance) {
//                         // Format checkInTime dan checkOutTime sesuai dengan zona waktu
//                         const checkInTime = attendance.checkInTime
//                             ? new Date(attendance.checkInTime).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })
//                             : null;
//
//                         const checkOutTime = attendance.checkOutTime
//                             ? new Date(attendance.checkOutTime).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })
//                             : null;
//
//                         attendanceRecords.push({
//                             date: formattedDate,
//                             status: attendance.status,
//                             lateTime: attendance.lateTime || 0,
//                             checkInTime: checkInTime,
//                             checkOutTime: checkOutTime,
//                         });
//                     } else {
//                         if (date <= today) {
//                             attendanceRecords.push({
//                                 date: formattedDate,
//                                 status: 'Alpha', // Status tidak hadir
//                                 lateTime: null,
//                                 checkInTime: null,
//                                 checkOutTime: null,
//                             });
//                         } else {
//                             attendanceRecords.push({
//                                 date: formattedDate,
//                                 status: 0, // Status untuk tanggal setelah hari ini
//                                 lateTime: null,
//                                 checkInTime: null,
//                                 checkOutTime: null,
//                             });
//                         }
//                     }
//                 }
//
//                 return {
//                     employeeId: employee._id,
//                     employeeName: employee.fullName,
//                     shiftId: employee.shift._id,
//                     shiftName: employee.shift.shiftName,
//                     shiftStart: employee.shift.startTime,
//                     shiftEnd: employee.shift.endTime,
//                     attendance: attendanceRecords,
//                 };
//             })
//         );
//
//         res.json(attendanceData);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching attendance by month', error });
//     }
// };
//
// Get All Attendance in a Month
exports.getAttendanceInMonth = async (req, res) => {
    const { year, month } = req.params; // Ambil parameter tahun dan bulan

    try {
        // Dapatkan tanggal awal dan akhir bulan
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Atur waktu ke awal hari

        // Dapatkan semua karyawan
        const employees = await Employee.find().populate('shift');

        const attendanceData = await Promise.all(
            employees.map(async (employee) => {
                // Dapatkan attendances karyawan dalam rentang tanggal tersebut
                const attendances = await Attendance.find({
                    employee: employee._id,
                    // Mengambil semua attendance dalam rentang tanggal
                    createdAt: {
                        $gte: startDate,
                        $lt: new Date(endDate.setDate(endDate.getDate() + 1)),
                    },
                });

                const attendanceRecords = [];
                const daysInMonth = new Date(year, month, 0).getDate();
                const employeeStartDate = new Date(employee.startDate); // Tanggal mulai kerja karyawan
                employeeStartDate.setHours(0, 0, 0, 0); // Set jam karyawan mulai bekerja ke awal hari

                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month - 1, day);
                    date.setHours(0, 0, 0, 0); // Set jam ke awal hari untuk perbandingan yang akurat
                    const formattedDate = date.toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0];

                    // Cek apakah tanggal ini sebelum tanggal mulai kerja karyawan
                    if (date < employeeStartDate) {
                        attendanceRecords.push({
                            date: formattedDate,
                            status: 0, // Status untuk tanggal sebelum karyawan mulai bekerja
                            lateTime: null,
                            checkInTime: null,
                            checkOutTime: null,
                        });
                        continue; // Lewati pengecekan lebih lanjut untuk tanggal ini
                    }

                    // Cek apakah ada data absensi untuk tanggal ini
                    const attendance = attendances.find(att => {
                        const checkInDate = new Date(att.createdAt).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0];
                        return checkInDate === formattedDate;
                    });

                    if (attendance) {
                        // Format checkInTime dan checkOutTime sesuai dengan zona waktu
                        const checkInTime = attendance.checkInTime
                            ? new Date(attendance.checkInTime).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            : null;

                        const checkOutTime = attendance.checkOutTime
                            ? new Date(attendance.checkOutTime).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            : null;

                        attendanceRecords.push({
                            date: formattedDate,
                            status: attendance.status,
                            lateTime: attendance.lateTime || 0,
                            checkInTime: checkInTime,
                            checkOutTime: checkOutTime,
                        });
                    } else {
                        // Cek jika belum check-in dan waktu sudah lewat 2 jam dari shift start
                        const shiftStartTime = new Date(date);
                        const [hours, minutes] = employee.shift.startTime.split(':');
                        shiftStartTime.setHours(hours, minutes, 0, 0); // Set waktu sesuai shift start

                        // Tambahkan 2 jam ke shift start
                        const gracePeriod = new Date(shiftStartTime);
                        gracePeriod.setHours(gracePeriod.getHours() + 2);

                        if (today >= date && today >= gracePeriod) {
                            attendanceRecords.push({
                                date: formattedDate,
                                status: 'Alpha', // Status tidak hadir jika lebih dari 2 jam dari shift start
                                lateTime: null,
                                checkInTime: null,
                                checkOutTime: null,
                            });
                        } else if (date <= today) {
                            attendanceRecords.push({
                                date: formattedDate,
                                status: 'Awaiting', // Status belum check-in tapi masih dalam rentang waktu
                                lateTime: null,
                                checkInTime: null,
                                checkOutTime: null,
                            });
                        } else {
                            attendanceRecords.push({
                                date: formattedDate,
                                status: 0, // Status untuk tanggal setelah hari ini
                                lateTime: null,
                                checkInTime: null,
                                checkOutTime: null,
                            });
                        }
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

