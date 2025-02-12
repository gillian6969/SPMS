const dotenv = require('dotenv');
// Load environment variables first
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const teacherClassRecordsRoutes = require('./routes/teacherClassRecords');
const studentRoutes = require('./routes/students');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const assessmentRoutes = require('./routes/assessments');
const dashboardRoutes = require('./routes/dashboard');

// Verify environment variables are loaded
console.log('Email configuration loaded:', {
    EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not Set',
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'Set' : 'Not Set'
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/Student-Monitoring-Capstone', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/teacher-class-records', teacherClassRecordsRoutes);
app.use('/api/assessments', assessmentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 