const express = require('express');
const router = express.Router();
const TeacherClassRecord = require('../models/TeacherClassRecord');
const auth = require('../middleware/auth');

// Create or update attendance
router.post('/', auth, async (req, res) => {
  try {
    const { studentId, date, subject, status } = req.body;

    // Validate required fields
    if (!studentId || !date || !subject || !status) {
      return res.status(400).json({ 
        message: 'Missing required fields' 
      });
    }

    // Find the class record
    const classRecord = await TeacherClassRecord.findOne({
      'students.studentId': studentId,
      subject
    });

    if (!classRecord) {
      return res.status(404).json({ 
        message: 'Class record not found' 
      });
    }

    // Find the student in the class record
    const student = classRecord.students.find(s => s.studentId === studentId);
    if (!student) {
      return res.status(404).json({ 
        message: 'Student not found in class record' 
      });
    }

    // Initialize attendance array if it doesn't exist
    if (!student.attendance) {
      student.attendance = [];
    }

    // Check if attendance record already exists for this date and subject
    const existingAttendanceIndex = student.attendance.findIndex(a => 
      a.date === date && a.subject === subject
    );

    if (existingAttendanceIndex !== -1) {
      // Update existing attendance record
      student.attendance[existingAttendanceIndex].status = status;
    } else {
      // Add new attendance record
      student.attendance.push({
        date,
        subject,
        status
      });
    }

    await classRecord.save();

    res.json({
      success: true,
      message: 'Attendance updated successfully'
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get attendance history for a student
router.get('/:studentId/history', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subject } = req.query;

    // Find the class record
    const classRecord = await TeacherClassRecord.findOne({
      'students.studentId': studentId,
      subject
    });

    if (!classRecord) {
      return res.status(404).json({ 
        message: 'Class record not found' 
      });
    }

    // Find the student in the class record
    const student = classRecord.students.find(s => s.studentId === studentId);
    if (!student) {
      return res.status(404).json({ 
        message: 'Student not found in class record' 
      });
    }

    // Sort attendance records by date (newest first)
    const sortedAttendance = student.attendance
      .filter(a => a.subject === subject)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(sortedAttendance);
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router; 