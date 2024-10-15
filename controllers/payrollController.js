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

exports.createPayroll = async (req, res) => {
    const { year, month, employeeId, deductions } = req.body;

    try {
        // Dapatkan karyawan berdasarkan employeeId
        const employee = await Employee.findById(employeeId).populate('role');

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Hitung gaji pokok berdasarkan role
        const basicSalary = employee.role.salary; 

        // Hitung alpha count dan total potongan
        const attendanceCounts = await countAttendanceStatusByEmployeeIdInMonth(year, month, employeeId);
        const alphaCount = attendanceCounts.countAlpha;

        // Hitung potongan untuk Alpha
        const daysInMonth = new Date(year, month, 0).getDate();
        // const deductionPerAlpha = basicSalary / daysInMonth - 30000;
        const deductionPerAlpha = 30000;
        const totalDeductions = alphaCount * deductionPerAlpha + (deductions ? deductions.reduce((sum, deduction) => sum + deduction.amount, 0) : 0);

        // Hitung gaji bersih
        const netSalary = basicSalary - totalDeductions;

        // Simpan penggajian
        const payroll = new Payroll({
            employee: employee._id,
            month,
            year,
            basicSalary,
            deductions: deductions || [],
            alphaCount,
            totalDeductions,
            netSalary,
        });

        await payroll.save();

        res.status(201).json({
            message: 'Payroll created successfully',
            payroll,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating payroll', error });
    }
};

