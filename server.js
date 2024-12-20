// kalau ada error "File is a CommonJS module; it may be converted to an ES module." biarin aja
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const errorHandler = require("./utils/errorHandler");

// routes
const authRoutes = require("./routes/authRoutes");
const shiftRoutes = require("./routes/shiftRoutes");
const roleRoutes = require("./routes/roleRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const itemRoutes = require("./routes/itemRoutes");
const historyRoutes = require("./routes/historyRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const payrollRoutes = require('./routes/payrollRoutes')
const locationRoutes = require('./routes/locationRoutes');
const salesRoutes = require("./routes/salesRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

//log
app.use(morgan("combined"));
app.use((req, res, next) => {
	res.on("finish", () => {
		console.log(
			`Method: ${req.method}, URL: ${req.originalUrl}, Status: ${res.statusCode}`
		);
	});
	next();
});
app.use(morgan("dev"));

// MongoDB
connectDB();

// Route
app.use("/api/auth", authRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/locations', locationRoutes);
app.use("/api/sales", salesRoutes);

// Error Handling Middleware
app.use(errorHandler);

// wif
app.listen(PORT, "0.0.0.0", () => {
	console.log(`Server running on http://0.0.0.0:${PORT}`);
});
