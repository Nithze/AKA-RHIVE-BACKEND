// kalau ada error "File is a CommonJS module; it may be converted to an ES module." biarin aja
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const errorHandler = require('./utils/errorHandler');

// routes
const authRoutes = require('./routes/authRoutes');
const shiftRoutes = require('./routes/shiftRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

//log
app.use(morgan('combined')); 
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`Method: ${req.method}, URL: ${req.originalUrl}, Status: ${res.statusCode}`);
    });
    next();
});
app.use(morgan('dev'));


// MongoDB
connectDB();

// Rute
app.use('/api/auth', authRoutes);
app.use('/api/shifts', shiftRoutes);

// Error Handling Middleware
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

