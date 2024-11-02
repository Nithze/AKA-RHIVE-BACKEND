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

// Approve Leave
exports.disApproveLeave = async (req, res) => {
    const { attendanceId } = req.params;

    try {
        const attendance = await Attendance.findById(attendanceId);
        if (!attendance) {
            return res.status(404).json({ message: 'Attendance not found' });
        }

        attendance.status = 'Alpha'; // Ubah status menjadi Alpha
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
    //     try {
    //     const today = new Date();
    //     today.setHours(0, 0, 0, 0); // Atur waktu ke awal hari
    //
    //     // Dapatkan semua karyawan yang memiliki shift
    //     const employees = await Employee.find().populate('shift');
    //
    //     const attendanceData = await Promise.all(
    //         employees.map(async (employee) => {
    //             // Cek apakah shift karyawan berlangsung hari ini
    //             const shiftStartTime = new Date(today);
    //             const [shiftStartHour, shiftStartMinute] = employee.shift.startTime.split(':');
    //             shiftStartTime.setHours(shiftStartHour, shiftStartMinute, 0, 0); // Set waktu shift start
    //
    //             const shiftEndTime = new Date(today);
    //             const [shiftEndHour, shiftEndMinute] = employee.shift.endTime.split(':');
    //             shiftEndTime.setHours(shiftEndHour, shiftEndMinute, 0, 0); // Set waktu shift end
    //
    //             // Cek apakah saat ini berada dalam rentang shift karyawan
    //             const now = new Date();
    //             if (now < shiftStartTime || now > shiftEndTime) {
    //                 return null; // Karyawan tidak berada dalam shift yang berlangsung saat ini
    //             }
    //
    //             // Dapatkan absensi karyawan untuk hari ini
    //             const attendances = await Attendance.find({
    //                 employee: employee._id,
    //                 createdAt: {
    //                     $gte: today,
    //                     $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Hingga akhir hari ini
    //                 },
    //             });
    //
    //             const attendanceRecords = attendances.map((attendance) => {
    //                 // Format checkInTime dan checkOutTime sesuai dengan zona waktu
    //                 const checkInTime = attendance.checkInTime
    //                     ? new Date(attendance.checkInTime).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    //                     : null;
    //
    //                 const checkOutTime = attendance.checkOutTime
    //                     ? new Date(attendance.checkOutTime).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    //                     : null;
    //
    //                 return {
    //                     date: today.toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0],
    //                     attendanceId: attendance._id,
    //                     status: attendance.status,
    //                     lateTime: attendance.lateTime || 0,
    //                     checkInTime: checkInTime,
    //                     checkOutTime: checkOutTime,
    //                 };
    //             });
    //
    //             // Jika karyawan belum melakukan check-in hari ini, tambahkan status "Awaiting" atau "Alpha"
    //             if (attendanceRecords.length === 0) {
    //                 const gracePeriod = new Date(shiftStartTime);
    //                 gracePeriod.setHours(gracePeriod.getHours() + 2); // Tambahkan 2 jam untuk grace period
    //
    //                 if (now >= shiftStartTime && now >= gracePeriod) {
    //                     attendanceRecords.push({
    //                         date: today.toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0],
    //                         status: 'Alpha', // Tidak hadir
    //                         lateTime: null,
    //                         checkInTime: null,
    //                         checkOutTime: null,
    //                     });
    //                 } else {
    //                     attendanceRecords.push({
    //                         date: today.toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0],
    //                         status: 'Awaiting', // Belum check-in tapi masih dalam waktu
    //                         lateTime: null,
    //                         checkInTime: null,
    //                         checkOutTime: null,
    //                     });
    //                 }
    //             }
    //
    //             return {
    //                 employeeId: employee._id,
    //                 employeeName: employee.fullName,
    //                 shiftId: employee.shift._id,
    //                 shiftName: employee.shift.shiftName,
    //                 shiftStart: employee.shift.startTime,
    //                 shiftEnd: employee.shift.endTime,
    //                 attendance: attendanceRecords,
    //             };
    //         })
    //     );
    //
    //     // Filter untuk hanya mengembalikan karyawan yang memiliki shift berlangsung hari ini
    //     const filteredAttendanceData = attendanceData.filter((data) => data !== null);
    //
    //     res.json(filteredAttendanceData);
    // } catch (error) {
    //     res.status(500).json({ message: 'Error fetching attendance for today', error });
    // }
    try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Atur waktu ke awal hari

    // Dapatkan semua karyawan yang memiliki shift dan role
    const employees = await Employee.find().populate('shift').populate('role'); // Tambahkan populate untuk role

    const attendanceData = await Promise.all(
        employees.map(async (employee) => {
            // Cek apakah shift karyawan berlangsung hari ini
            const shiftStartTime = new Date(today);
            const [shiftStartHour, shiftStartMinute] = employee.shift.startTime.split(':');
            shiftStartTime.setHours(shiftStartHour, shiftStartMinute, 0, 0); // Set waktu shift start

            const shiftEndTime = new Date(today);
            const [shiftEndHour, shiftEndMinute] = employee.shift.endTime.split(':');
            shiftEndTime.setHours(shiftEndHour, shiftEndMinute, 0, 0); // Set waktu shift end

            // Cek apakah saat ini berada dalam rentang shift karyawan
            const now = new Date();
            if (now < shiftStartTime || now > shiftEndTime) {
                return null; // Karyawan tidak berada dalam shift yang berlangsung saat ini
            }

            // Dapatkan absensi karyawan untuk hari ini
            const attendances = await Attendance.find({
                employee: employee._id,
                createdAt: {
                    $gte: today,
                    $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Hingga akhir hari ini
                },
            });

            const attendanceRecords = attendances.map((attendance) => {
                // Format checkInTime dan checkOutTime sesuai dengan zona waktu
                const checkInTime = attendance.checkInTime
                    ? new Date(attendance.checkInTime).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : null;

                const checkOutTime = attendance.checkOutTime
                    ? new Date(attendance.checkOutTime).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : null;

                return {
                    date: today.toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0],
                    attendanceId: attendance._id,
                    status: attendance.status,
                    lateTime: attendance.lateTime || 0,
                    checkInTime: checkInTime,
                    checkOutTime: checkOutTime,
                };
            });

            // Jika karyawan belum melakukan check-in hari ini, tambahkan status "Awaiting" atau "Alpha"
            if (attendanceRecords.length === 0) {
                const gracePeriod = new Date(shiftStartTime);
                gracePeriod.setHours(gracePeriod.getHours() + 2); // Tambahkan 2 jam untuk grace period

                if (now >= shiftStartTime && now >= gracePeriod) {
                    attendanceRecords.push({
                        date: today.toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0],
                        status: 'Alpha', // Tidak hadir
                        lateTime: null,
                        checkInTime: null,
                        checkOutTime: null,
                    });
                } else {
                    attendanceRecords.push({
                        date: today.toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0],
                        status: 'Awaiting', // Belum check-in tapi masih dalam waktu
                        lateTime: null,
                        checkInTime: null,
                        checkOutTime: null,
                    });
                }
            }

            return {
                employeeId: employee._id,
                employeeName: employee.fullName,
                phoneNumber: employee.phoneNumber, // Menambahkan phoneNumber
                roleId: employee.role._id, // Menyimpan roleId
                roleName: employee.role.role, // Menyimpan name role
                shiftId: employee.shift._id,
                shiftName: employee.shift.shiftName,
                shiftStart: employee.shift.startTime,
                shiftEnd: employee.shift.endTime,
                attendance: attendanceRecords,
            };
        })
    );

    // Filter untuk hanya mengembalikan karyawan yang memiliki shift berlangsung hari ini
    const filteredAttendanceData = attendanceData.filter((data) => data !== null);

    res.json(filteredAttendanceData);
} catch (error) {
    res.status(500).json({ message: 'Error fetching attendance for today', error });
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
//                         // Cek jika belum check-in dan waktu sudah lewat 2 jam dari shift start
//                         const shiftStartTime = new Date(date);
//                         const [hours, minutes] = employee.shift.startTime.split(':');
//                         shiftStartTime.setHours(hours, minutes, 0, 0); // Set waktu sesuai shift start
//
//                         // Tambahkan 2 jam ke shift start
//                         const gracePeriod = new Date(shiftStartTime);
//                         gracePeriod.setHours(gracePeriod.getHours() + 2);
//
//                         if (today >= date && today >= gracePeriod) {
//                             attendanceRecords.push({
//                                 date: formattedDate,
//                                 status: 'Alpha', // Status tidak hadir jika lebih dari 2 jam dari shift start
//                                 lateTime: null,
//                                 checkInTime: null,
//                                 checkOutTime: null,
//                             });
//                         } else if (date <= today) {
//                             attendanceRecords.push({
//                                 date: formattedDate,
//                                 status: 'Awaiting', // Status belum check-in tapi masih dalam rentang waktu
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
                    createdAt: {
                        $gte: startDate,
                        $lt: new Date(endDate.setDate(endDate.getDate() + 1)),
                    },
                });

                const attendanceRecords = [];
                const daysInMonth = new Date(year, month, 0).getDate();
                const employeeStartDate = new Date(employee.startDate);
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
                            attendanceId: attendance._id, // Tambahkan attendanceId di sini
                            status: attendance.status,
                            lateTime: attendance.lateTime || 0,
                            checkInTime: checkInTime,
                            checkOutTime: checkOutTime,
                        });
                    } else {
                        const shiftStartTime = new Date(date);
                        const [hours, minutes] = employee.shift.startTime.split(':');
                        shiftStartTime.setHours(hours, minutes, 0, 0); // Set waktu sesuai shift start

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




// heeeeeeeeeeeeeeeeeee
//
// Get Attendance by Employee ID in a Month
exports.getAttendanceByEmployeeIdInMonth = async (req, res) => {
    const { year, month, employeeId } = req.params; // Ambil parameter tahun, bulan, dan employeeId

    try {
        // Dapatkan tanggal awal dan akhir bulan
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Atur waktu ke awal hari

        // Dapatkan karyawan berdasarkan employeeId
        const employee = await Employee.findById(employeeId).populate('shift');

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Dapatkan attendances karyawan dalam rentang tanggal tersebut
        const attendances = await Attendance.find({
            employee: employee._id,
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
                    attendanceId: null,
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
                    attendanceId: attendance._id, // Tambahkan ID attendance
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
                        attendanceId: null,
                    });
                } else if (date <= today) {
                    attendanceRecords.push({
                        date: formattedDate,
                        status: 'Awaiting', // Status belum check-in tapi masih dalam rentang waktu
                        lateTime: null,
                        checkInTime: null,
                        checkOutTime: null,
                        attendanceId: null,
                    });
                } else {
                    attendanceRecords.push({
                        date: formattedDate,
                        status: 0, // Status untuk tanggal setelah hari ini
                        lateTime: null,
                        checkInTime: null,
                        checkOutTime: null,
                        attendanceId: null,
                    });
                }
            }
        }

        // Kembalikan hasil attendance untuk karyawan tersebut
        res.json({
            employeeId: employee._id,
            employeeName: employee.fullName,
            shiftId: employee.shift._id,
            shiftName: employee.shift.shiftName,
            shiftStart: employee.shift.startTime,
            shiftEnd: employee.shift.endTime,
            attendance: attendanceRecords,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance by employee and month', error });
    }
};





// aaaaaaaaaaaaaaaaaaa
// Get All Pending Attendances
// exports.getPendingAttendances = async (req, res) => {
//     try {
//         // Dapatkan semua karyawan beserta role dan shift mereka
//         const employees = await Employee.find().populate('shift').populate('role');
//
//         const pendingAttendanceData = await Promise.all(
//             employees.map(async (employee) => {
//                 // Dapatkan attendances dengan status Pending untuk karyawan tersebut
//                 const attendances = await Attendance.find({
//                     employee: employee._id,
//                     status: 'Pending', // Filter hanya untuk status Pending
//                 });
//
//                 if (attendances.length > 0) {
//                     const attendanceRecords = attendances.map(attendance => {
//                         const formattedDate = new Date(attendance.createdAt).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0];
//
//                         const checkInTime = attendance.checkInTime
//                             ? new Date(attendance.checkInTime).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })
//                             : null;
//
//                         const checkOutTime = attendance.checkOutTime
//                             ? new Date(attendance.checkOutTime).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })
//                             : null;
//
//                         return {
//                             attendanceId: attendance._id, // Attendance ID
//                             date: formattedDate,
//                             status: attendance.status,
//                             reason: attendance.reason || 'No reason provided', // Tampilkan alasan jika ada
//                             lateTime: attendance.lateTime || 0,
//                             checkInTime: checkInTime,
//                             checkOutTime: checkOutTime,
//                         };
//                     });
//
//                     return {
//                         employeeId: employee._id,
//                         employeeName: employee.fullName,
//                         phoneNumber: employee.phoneNumber, // Tampilkan nomor telepon
//                         role: employee.role.role, // Tampilkan role karyawan
//                         shiftId: employee.shift._id,
//                         shiftName: employee.shift.shiftName,
//                         shiftStart: employee.shift.startTime,
//                         shiftEnd: employee.shift.endTime,
//                         attendance: attendanceRecords,
//                     };
//                 } else {
//                     return null; // Tidak ada data pending untuk karyawan ini
//                 }
//             })
//         );
//
//         // Filter out null responses (karyawan tanpa data pending)
//         const filteredAttendanceData = pendingAttendanceData.filter(record => record !== null);
//
//         res.json(filteredAttendanceData);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching pending attendances', error });
//     }
// };
exports.getPendingAttendances = async (req, res) => {
    try {
        // Dapatkan semua karyawan beserta role dan shift mereka
        const employees = await Employee.find().populate('shift').populate('role');

        const attendanceData = await Promise.all(
            employees.map(async (employee) => {
                // Dapatkan attendances dengan status "Pending" atau "Absent" untuk karyawan tersebut
                const attendances = await Attendance.find({
                    employee: employee._id,
                    status: { $in: ['Pending', 'Absent'] }, // Filter untuk status "Pending" dan "Absent"
                });

                if (attendances.length > 0) {
                    const attendanceRecords = attendances.map(attendance => {
                        const formattedDate = new Date(attendance.createdAt).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0];

                        const checkInTime = attendance.checkInTime
                            ? new Date(attendance.checkInTime).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            : null;

                        const checkOutTime = attendance.checkOutTime
                            ? new Date(attendance.checkOutTime).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            : null;

                        return {
                            attendanceId: attendance._id,
                            date: formattedDate,
                            status: attendance.status,
                            reason: attendance.reason || 'No reason provided',
                            lateTime: attendance.lateTime || 0,
                            checkInTime: checkInTime,
                            checkOutTime: checkOutTime,
                        };
                    });

                    return {
                        employeeId: employee._id,
                        employeeName: employee.fullName,
                        phoneNumber: employee.phoneNumber,
                        role: employee.role.role,
                        shiftId: employee.shift._id,
                        shiftName: employee.shift.shiftName,
                        shiftStart: employee.shift.startTime,
                        shiftEnd: employee.shift.endTime,
                        attendance: attendanceRecords,
                    };
                } else {
                    return null; // Tidak ada data "Pending" atau "Absent" untuk karyawan ini
                }
            })
        );

        // Filter out null responses (karyawan tanpa data "Pending" atau "Absent")
        const filteredAttendanceData = attendanceData.filter(record => record !== null);

        res.json(filteredAttendanceData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance data', error });
    }
};


// Count Attendance Status by Employee ID in a Month
// exports.countAttendanceStatusByEmployeeIdInMonth = async (req, res) => {
//     const { year, month, employeeId } = req.params; // Ambil parameter tahun, bulan, dan employeeId
//
//     try {
//         // Dapatkan tanggal awal dan akhir bulan
//         const startDate = new Date(year, month - 1, 1);
//         const endDate = new Date(year, month, 0);
//         const today = new Date();
//         today.setHours(0, 0, 0, 0); // Atur waktu ke awal hari
//
//         // Dapatkan karyawan berdasarkan employeeId
//         const employee = await Employee.findById(employeeId).populate('shift');
//
//         if (!employee) {
//             return res.status(404).json({ message: 'Employee not found' });
//         }
//
//         // Dapatkan attendances karyawan dalam rentang tanggal tersebut
//         const attendances = await Attendance.find({
//             employee: employee._id,
//             createdAt: {
//                 $gte: startDate,
//                 $lt: new Date(endDate.setDate(endDate.getDate() + 1)),
//             },
//         });
//
//         const attendanceRecords = [];
//         const daysInMonth = new Date(year, month, 0).getDate();
//         const employeeStartDate = new Date(employee.startDate); // Tanggal mulai kerja karyawan
//         employeeStartDate.setHours(0, 0, 0, 0); // Set jam karyawan mulai bekerja ke awal hari
//
//         // Inisialisasi counter untuk status
//         let countAlpha = 0;
//         let countPresent = 0;
//         let countAbsent = 0;
//
//         for (let day = 1; day <= daysInMonth; day++) {
//             const date = new Date(year, month - 1, day);
//             date.setHours(0, 0, 0, 0); // Set jam ke awal hari untuk perbandingan yang akurat
//             const formattedDate = date.toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0];
//
//             // Cek apakah tanggal ini sebelum tanggal mulai kerja karyawan
//             if (date < employeeStartDate) {
//                 attendanceRecords.push({
//                     date: formattedDate,
//                     status: 0, // Status untuk tanggal sebelum karyawan mulai bekerja
//                     lateTime: null,
//                     checkInTime: null,
//                     checkOutTime: null,
//                     attendanceId: null,
//                 });
//                 continue; // Lewati pengecekan lebih lanjut untuk tanggal ini
//             }
//
//             // Cek apakah ada data absensi untuk tanggal ini
//             const attendance = attendances.find(att => {
//                 const checkInDate = new Date(att.createdAt).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0];
//                 return checkInDate === formattedDate;
//             });
//
//             if (attendance) {
//                 // Format checkInTime dan checkOutTime sesuai dengan zona waktu
//                 const checkInTime = attendance.checkInTime
//                     ? new Date(attendance.checkInTime).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })
//                     : null;
//
//                 const checkOutTime = attendance.checkOutTime
//                     ? new Date(attendance.checkOutTime).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })
//                     : null;
//
//                 // Tambahkan ke attendanceRecords
//                 attendanceRecords.push({
//                     date: formattedDate,
//                     status: attendance.status,
//                     lateTime: attendance.lateTime || 0,
//                     checkInTime: checkInTime,
//                     checkOutTime: checkOutTime,
//                     attendanceId: attendance._id, // Tambahkan ID attendance
//                 });
//
//                 // Hitung status
//                 if (attendance.status === 'Present') {
//                     countPresent++;
//                 } else if (attendance.status === 'Alpha') {
//                     countAlpha++;
//                 } else {
//                     countAbsent++;
//                 }
//             } else {
//                 // Cek jika belum check-in dan waktu sudah lewat 2 jam dari shift start
//                 const shiftStartTime = new Date(date);
//                 const [hours, minutes] = employee.shift.startTime.split(':');
//                 shiftStartTime.setHours(hours, minutes, 0, 0); // Set waktu sesuai shift start
//
//                 // Tambahkan 2 jam ke shift start
//                 const gracePeriod = new Date(shiftStartTime);
//                 gracePeriod.setHours(gracePeriod.getHours() + 2);
//
//                 if (today >= date && today >= gracePeriod) {
//                     countAlpha++; // Hitung Alpha jika lebih dari 2 jam dari shift start
//                 } else if (date <= today) {
//                     countAbsent++; // Hitung Absent jika sudah lewat hari ini
//                 }
//             }
//         }
//
//         // Kembalikan hasil perhitungan
//         res.json({
//             employeeId: employee._id,
//             employeeName: employee.fullName,
//             shiftId: employee.shift._id,
//             shiftName: employee.shift.shiftName,
//             shiftStart: employee.shift.startTime,
//             shiftEnd: employee.shift.endTime,
//             counts: {
//                 Alpha: countAlpha,
//                 Present: countPresent,
//                 Absent: countAbsent,
//             },
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Error counting attendance status by employee and month', error });
//     }
// };
//
exports.countAttendanceStatusByEmployeeIdInMonth = async (req, res) => {
    const { year, month, employeeId } = req.params;

    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const employee = await Employee.findById(employeeId).populate('shift');
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const attendances = await Attendance.find({
            employee: employee._id,
            createdAt: {
                $gte: startDate,
                $lt: new Date(endDate.setDate(endDate.getDate() + 1)),
            },
        });

        const attendanceRecords = [];
        const daysInMonth = new Date(year, month, 0).getDate();
        const employeeStartDate = new Date(employee.startDate);
        employeeStartDate.setHours(0, 0, 0, 0);

        let countAlpha = 0;
        let countPresent = 0;
        let countAbsent = 0;
        let totalLateTime = 0; // Inisialisasi total lateTime

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            date.setHours(0, 0, 0, 0);
            const formattedDate = date.toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0];

            if (date < employeeStartDate) {
                attendanceRecords.push({
                    date: formattedDate,
                    status: 0,
                    lateTime: null,
                    checkInTime: null,
                    checkOutTime: null,
                    attendanceId: null,
                });
                continue;
            }

            const attendance = attendances.find(att => {
                const checkInDate = new Date(att.createdAt).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0];
                return checkInDate === formattedDate;
            });

            if (attendance) {
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
                    attendanceId: attendance._id,
                });

                // Hitung status
                if (attendance.status === 'Present') {
                    countPresent++;
                    totalLateTime += attendance.lateTime || 0; // Tambahkan lateTime jika hadir
                } else if (attendance.status === 'Alpha') {
                    countAlpha++;
                } else {
                    countAbsent++;
                }
            } else {
                const shiftStartTime = new Date(date);
                const [hours, minutes] = employee.shift.startTime.split(':');
                shiftStartTime.setHours(hours, minutes, 0, 0);

                const gracePeriod = new Date(shiftStartTime);
                gracePeriod.setHours(gracePeriod.getHours() + 2);

                if (today >= date && today >= gracePeriod) {
                    countAlpha++;
                } else if (date <= today) {
                    countAbsent++;
                }
            }
        }

        res.json({
            employeeId: employee._id,
            employeeName: employee.fullName,
            shiftId: employee.shift._id,
            shiftName: employee.shift.shiftName,
            shiftStart: employee.shift.startTime,
            shiftEnd: employee.shift.endTime,
            counts: {
                Alpha: countAlpha,
                Present: countPresent,
                Absent: countAbsent,
            },
            totalLateTime // Tambahkan totalLateTime ke respons
        });
    } catch (error) {
        res.status(500).json({ message: 'Error counting attendance status by employee and month', error });
    }
};

