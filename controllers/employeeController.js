const Employee = require('../models/Employee');

// // Create Employee
// exports.createEmployee = async (req, res) => {
//     const { fullName, nik, birthDate, gender, address, role, startDate, shift, phoneNumber, password } = req.body;
//
//     try {
//         const newEmployee = new Employee({ fullName, nik, birthDate, gender, address, role, startDate, shift, phoneNumber, password });
//         await newEmployee.save();
//         res.status(201).json(newEmployee);
//     } catch (error) {
//         res.status(500).json({ message: 'Error creating employee', error });
//     }
// };

// Create Employee
exports.createEmployee = async (req, res) => {
    const { fullName, nik, birthDate, gender, address, role, startDate, shift, phoneNumber, password, bankAccountNumber, accountHolderName } = req.body;

    try {
        const newEmployee = new Employee({ fullName, nik, birthDate, gender, address, role, startDate, shift, phoneNumber, password, bankAccountNumber, accountHolderName });
        await newEmployee.save();
        res.status(201).json(newEmployee);
    } catch (error) {
        res.status(500).json({ message: 'Error creating employee', error });
    }
};



// Login Employee
exports.loginEmployee = async (req, res) => {
    const { nik, password } = req.body;

    try {
        const employee = await Employee.findOne({ nik }).populate('role').populate('shift');
        if (!employee) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Cek password langsung tanpa hashing
        if (employee.password !== password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Jika login berhasil, kirimkan data karyawan beserta role dan shift
        res.json({
            id: employee._id,
            fullName: employee.fullName,
            nik: employee.nik,
            role: employee.role, // Lengkap dengan detail role
            shift: employee.shift, // Lengkap dengan detail shift
            phoneNumber: employee.phoneNumber,
            bankAccountNumber: employee.bankAccountNumber, // Tambahkan nomor rekening
            accountHolderName: employee.accountHolderName, // Tambahkan atas nama rekening
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};

// Login Employee
exports.loginEmployee = async (req, res) => {
    const { nik, password } = req.body;

    try {
        const employee = await Employee.findOne({ nik }).populate('role').populate('shift');
        if (!employee) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Cek password langsung tanpa hashing
        if (employee.password !== password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Jika login berhasil, kirimkan data karyawan beserta role dan shift
        res.json({
            id: employee._id,
            fullName: employee.fullName,
            nik: employee.nik,
            role: employee.role, // Lengkap dengan detail role
            shift: employee.shift, // Lengkap dengan detail shift
            phoneNumber: employee.phoneNumber,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};

// Get Total Salary Distribution and Employee Count for Current Month
exports.getSalaryAndEmployeeCount = async (req, res) => {
    try {
        const currentMonth = new Date().getMonth(); // Mendapatkan bulan saat ini (0-11)
        const currentYear = new Date().getFullYear(); // Mendapatkan tahun saat ini
        
        // Mengambil semua karyawan
        const employees = await Employee.find().populate('role');

        // Menghitung total gaji dan jumlah karyawan
        let totalSalary = 0;
        let totalEmployees = employees.length;
        let employeeOfTheMonthCount = 0;

        employees.forEach(employee => {
            totalSalary += employee.role.salary; // Tambahkan gaji karyawan
            
            // Hitung employee of the month berdasarkan startDate
            const startDate = new Date(employee.startDate);
            if (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) {
                employeeOfTheMonthCount += 1; // Karyawan yang mulai di bulan ini
            }
        });

        res.json({
            totalSalaryDistribution: totalSalary,
            totalEmployees,
            employeeOfTheMonthCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching salary and employee count', error });
    }
};



// Get All Employees
exports.getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee.find().populate('role').populate('shift');
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching employees', error });
    }
};

// Get Employee by ID
exports.getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id).populate('role').populate('shift');
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching employee', error });
    }
};

// Update Employee
exports.updateEmployee = async (req, res) => {
    const { fullName, nik, birthDate, gender, address, role, startDate, shift, phoneNumber, password } = req.body;

    try {
        const updatedEmployee = await Employee.findByIdAndUpdate(
            req.params.id,
            { fullName, nik, birthDate, gender, address, role, startDate, shift, phoneNumber, password },
            { new: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json(updatedEmployee);
    } catch (error) {
        res.status(500).json({ message: 'Error updating employee', error });
    }
};

// Delete Employee
exports.deleteEmployee = async (req, res) => {
    try {
        const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
        if (!deletedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting employee', error });
    }
};

