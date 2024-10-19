const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

// Hitung Status Kehadiran berdasarkan ID Karyawan dalam Sebulan
const countAttendanceStatusByEmployeeIdInMonth = async (year, month, employeeId) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Atur waktu ke awal hari

    // Dapatkan karyawan berdasarkan employeeId
    const employee = await Employee.findById(employeeId).populate('shift');

    if (!employee) {
        throw new Error('Employee not found');
    }

    // Dapatkan attendances karyawan dalam rentang tanggal tersebut
    const attendances = await Attendance.find({
        employee: employee._id,
        createdAt: {
            $gte: startDate,
            $lt: new Date(endDate.setDate(endDate.getDate() + 1)),
        },
    });

    const daysInMonth = new Date(year, month, 0).getDate();
    const employeeStartDate = new Date(employee.startDate); // Tanggal mulai kerja karyawan
    employeeStartDate.setHours(0, 0, 0, 0); // Set jam karyawan mulai bekerja ke awal hari

    // Inisialisasi counter untuk status
    let countAlpha = 0;
    let countPresent = 0;
    let countAbsent = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        date.setHours(0, 0, 0, 0); // Set jam ke awal hari untuk perbandingan yang akurat
        const formattedDate = date.toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0];

        // Cek apakah tanggal ini sebelum tanggal mulai kerja karyawan
        if (date < employeeStartDate) {
            continue; // Lewati pengecekan lebih lanjut untuk tanggal ini
        }

        // Cek apakah ada data absensi untuk tanggal ini
        const attendance = attendances.find(att => {
            const checkInDate = new Date(att.createdAt).toLocaleString('en-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0];
            return checkInDate === formattedDate;
        });

        if (attendance) {
            // Hitung status
            if (attendance.status === 'Present') {
                countPresent++;
            } else if (attendance.status === 'Alpha') {
                countAlpha++;
            } else {
                countAbsent++;
            }
        } else {
            // Cek jika belum check-in dan waktu sudah lewat 2 jam dari shift start
            const shiftStartTime = new Date(date);
            const [hours, minutes] = employee.shift.startTime.split(':');
            shiftStartTime.setHours(hours, minutes, 0, 0); // Set waktu sesuai shift start

            // Tambahkan 2 jam ke shift start
            const gracePeriod = new Date(shiftStartTime);
            gracePeriod.setHours(gracePeriod.getHours() + 2);

            if (today >= date && today >= gracePeriod) {
                countAlpha++; // Hitung Alpha jika lebih dari 2 jam dari shift start
            } else if (date <= today) {
                countAbsent++; // Hitung Absent jika sudah lewat hari ini
            }
        }
    }

    return {
        countAlpha,
        countPresent,
        countAbsent,
    };
};

// exports.createPayroll = async (req, res) => {
//     const { year, month, employeeId, deductions, bonuses } = req.body;
//
//     try {
//         // Dapatkan karyawan berdasarkan employeeId
//         const employee = await Employee.findById(employeeId)
//             .populate('role') // Populasi role untuk mendapatkan name
//             .populate('shift'); // Populasi shift untuk mendapatkan name
//
//         if (!employee) {
//             return res.status(404).json({ message: 'Employee not found' });
//         }
//
//         // Hitung gaji pokok berdasarkan role
//         const basicSalary = employee.role.salary; 
//
//         // Hitung alpha count dan total potongan
//         const attendanceCounts = await countAttendanceStatusByEmployeeIdInMonth(year, month, employeeId);
//         const alphaCount = attendanceCounts.countAlpha;
//
//         // Hitung potongan untuk Alpha
//         const deductionPerAlpha = 20000; // Misalnya, potongan per alpha
//         const alphaDeductionAmount = alphaCount * deductionPerAlpha;
//
//         // Hitung total potongan
//         const totalDeductions = alphaDeductionAmount + (deductions ? deductions.reduce((sum, deduction) => sum + deduction.amount, 0) : 0);
//
//         // Hitung total bonus
//         const totalBonus = bonuses ? bonuses.reduce((sum, bonus) => sum + bonus.amount, 0) : 0;
//
//         // Hitung gaji bersih
//         const netSalary = basicSalary - totalDeductions + totalBonus;
//
//         // Simpan penggajian
//         const payroll = new Payroll({
//             employee: employee._id,
//             month,
//             year,
//             basicSalary,
//             deductions: [...(deductions || []), { description: "Alpha deduction", amount: alphaDeductionAmount }],
//             bonuses: bonuses || [],
//             alphaCount,
//             totalDeductions,
//             netSalary,
//         });
//
//         await payroll.save();
//
//         res.status(201).json({
//             message: 'Payroll created successfully',
//             payroll: {
//                 _id: payroll._id,
//                 employee: {
//                     fullName: employee.fullName, // Pastikan field ini ada di model Employee
//                     nik: employee.nik,           // Pastikan field ini ada di model Employee
//                     phoneNumber: employee.phoneNumber, // Pastikan field ini ada di model Employee
//                     role: employee.role.role,    // Ambil name dari role
//                     shift: employee.shift.shiftName,  // Ambil name dari shift
//                 },
//                 month,
//                 year,
//                 basicSalary,
//                 deductions: payroll.deductions,
//                 bonuses: payroll.bonuses,
//                 alphaCount: payroll.alphaCount,
//                 deductionDetails: {
//                     alphaDeduction: {
//                         description: "Deduction for alpha count",
//                         amount: alphaDeductionAmount,
//                         calculation: `${alphaCount} * ${deductionPerAlpha}` // Penjelasan perhitungan
//                     },
//                     totalDeductions,
//                 },
//                 totalBonus,
//                 netSalary,
//                 createdAt: payroll.createdAt,
//                 updatedAt: payroll.updatedAt,
//             },
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Error creating payroll', error });
//     }
// };
//
// exports.getAllPayrolls = async (req, res) => {
//     try {
//         // Dapatkan semua penggajian dengan populate untuk employee, role, dan shift
//         const payrolls = await Payroll.find()
//             .populate({
//                 path: 'employee',
//                 populate: [
//                     { path: 'role' },  // Populate role
//                     { path: 'shift' }   // Populate shift
//                 ]
//             });
//
//         // Format response untuk setiap payroll
//         const formattedPayrolls = payrolls.map(payroll => {
//             const alphaDeduction = payroll.deductions.find(d => d.description === "Alpha deduction") || { amount: 0 };
//             const totalDeductions = payroll.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
//             const totalBonus = payroll.bonuses ? payroll.bonuses.reduce((sum, bonus) => sum + bonus.amount, 0) : 0;
//
//             return {
//                 _id: payroll._id,
//                 employee: {
//                     fullName: payroll.employee.fullName,
//                     nik: payroll.employee.nik,
//                     phoneNumber: payroll.employee.phoneNumber,
//                     role: payroll.employee.role.role,
//                     shift: payroll.employee.shift.shiftName
//                 },
//                 month: payroll.month,
//                 year: payroll.year,
//                 basicSalary: payroll.basicSalary,
//                 deductions: payroll.deductions,
//                 bonuses: payroll.bonuses,
//                 alphaCount: payroll.alphaCount,
//                 deductionDetails: {
//                     alphaDeduction: {
//                         description: "Deduction for alpha count",
//                         amount: alphaDeduction.amount,
//                         calculation: `${payroll.alphaCount} * 20000` // Misalnya, potongan per alpha
//                     },
//                     totalDeductions: totalDeductions
//                 },
//                 totalBonus: totalBonus,
//                 netSalary: payroll.netSalary,
//                 createdAt: payroll.createdAt,
//                 updatedAt: payroll.updatedAt,
//             };
//         });
//
//         res.status(200).json({
//             message: 'Payrolls retrieved successfully',
//             payroll: formattedPayrolls,
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Error retrieving payrolls', error });
//     }
// };
//
exports.createPayroll = async (req, res) => {
    const { year, month, employeeId, deductions, bonuses, deductionPerAlpha } = req.body;

    try {
        // Dapatkan karyawan berdasarkan employeeId
        const employee = await Employee.findById(employeeId)
            .populate('role') // Populasi role untuk mendapatkan name
            .populate('shift'); // Populasi shift untuk mendapatkan name

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Hitung gaji pokok berdasarkan role
        const basicSalary = employee.role.salary; 

        // Hitung alpha count dan total potongan
        const attendanceCounts = await countAttendanceStatusByEmployeeIdInMonth(year, month, employeeId);
        const alphaCount = attendanceCounts.countAlpha;

        // Hitung potongan untuk Alpha
        const alphaDeductionAmount = alphaCount * deductionPerAlpha; // Potongan per alpha dari request body

        // Hitung total potongan
        const totalDeductions = alphaDeductionAmount + (deductions ? deductions.reduce((sum, deduction) => sum + deduction.amount, 0) : 0);

        // Hitung total bonus
        const totalBonus = bonuses ? bonuses.reduce((sum, bonus) => sum + bonus.amount, 0) : 0;

        // Hitung gaji bersih
        const netSalary = basicSalary - totalDeductions + totalBonus;

        // Simpan penggajian
        const payroll = new Payroll({
            employee: employee._id,
            month,
            year,
            basicSalary,
            deductions: [...(deductions || []), { description: "Alpha deduction", amount: alphaDeductionAmount }],
            bonuses: bonuses || [],
            alphaCount,
            totalDeductions,
            netSalary,
        });

        await payroll.save();

        res.status(201).json({
            message: 'Payroll created successfully',
            payroll: {
                _id: payroll._id,
                employee: {
                    fullName: employee.fullName, // Pastikan field ini ada di model Employee
                    nik: employee.nik,           // Pastikan field ini ada di model Employee
                    phoneNumber: employee.phoneNumber, // Pastikan field ini ada di model Employee
                    role: employee.role.role,    // Ambil name dari role
                    shift: employee.shift.shiftName,  // Ambil name dari shift
                },
                month,
                year,
                basicSalary,
                deductions: payroll.deductions,
                bonuses: payroll.bonuses,
                alphaCount: payroll.alphaCount,
                deductionDetails: {
                    alphaDeduction: {
                        description: "Deduction for alpha count",
                        amount: alphaDeductionAmount,
                        calculation: `${alphaCount} * ${deductionPerAlpha}` // Penjelasan perhitungan
                    },
                    totalDeductions,
                },
                totalBonus,
                netSalary,
                createdAt: payroll.createdAt,
                updatedAt: payroll.updatedAt,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating payroll', error });
    }
};

exports.getAllPayrolls = async (req, res) => {
    try {
        const payrolls = await Payroll.find()
            .populate({
                path: 'employee',
                populate: [
                    { path: 'role' },
                    { path: 'shift' }
                ]
            });

        if (payrolls.length === 0) {
            return res.status(404).json({ message: 'No payrolls found' });
        }

        const response = payrolls.map(payroll => {
            // Temukan potongan alpha dalam array deductions
            const alphaDeduction = payroll.deductions.find(deduction => deduction.description === "Alpha deduction") || { amount: 0 };
            const deductionPerAlpha = alphaDeduction.amount;

            return {
                _id: payroll._id,
                employee: {
                    fullName: payroll.employee.fullName,
                    nik: payroll.employee.nik,
                    phoneNumber: payroll.employee.phoneNumber,
                    role: payroll.employee.role.role,
                    shift: payroll.employee.shift.shiftName,
                },
                month: payroll.month,
                year: payroll.year,
                basicSalary: payroll.basicSalary,
                deductions: payroll.deductions,
                bonuses: payroll.bonuses,
                alphaCount: payroll.alphaCount,
                deductionDetails: {
                    alphaDeduction: {
                        description: "Deduction for alpha count",
                        amount: deductionPerAlpha,
                        calculation: `${payroll.alphaCount} * ${deductionPerAlpha}` // Menggunakan nilai potongan alpha
                    },
                    totalDeductions: payroll.totalDeductions,
                },
                totalBonus: payroll.bonuses.reduce((sum, bonus) => sum + bonus.amount, 0),
                netSalary: payroll.netSalary,
                createdAt: payroll.createdAt,
                updatedAt: payroll.updatedAt,
            };
        });

        res.status(200).json({
            message: 'Payrolls retrieved successfully',
            payrolls: response,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving payrolls', error });
    }
};

