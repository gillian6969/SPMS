const express = require('express');
const router = express.Router();
const TeacherClassRecord = require('../models/TeacherClassRecord');
const auth = require('../middleware/auth');

// Create a new class record
router.post('/create', auth, async (req, res) => {
  try {
    const { teacherId, year, section, subject, students } = req.body;

    // Validate required fields
    if (!teacherId || !year || !section || !subject || !students) {
      return res.status(400).json({ 
        message: 'Missing required fields' 
      });
    }

    // Check if a record already exists for this combination
    const existingRecord = await TeacherClassRecord.findOne({
      teacherId,
      year,
      section,
      subject
    });

    if (existingRecord) {
      return res.status(400).json({ 
        message: 'A class record already exists for this combination' 
      });
    }

    // Create new class record with basic student data
    const classRecord = new TeacherClassRecord({
      teacherId,
      year,
      section,
      subject,
      students
    });

    await classRecord.save();

    res.status(201).json({
      success: true,
      message: 'Class record created successfully',
      data: classRecord
    });
  } catch (error) {
    console.error('Error creating class record:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get teacher's class records
router.get('/', auth, async (req, res) => {
  try {
    const { teacherId, year, section, subject } = req.query;
    
    const query = { teacherId };
    if (year) query.year = year;
    if (section) query.section = section;
    if (subject) query.subject = subject;

    const records = await TeacherClassRecord.find(query)
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    console.error('Error fetching class records:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update student information across all teacher class records
router.put('/update-all-records', auth, async (req, res) => {
  try {
    const { oldStudentNumber, newStudentNumber, firstName, lastName, year, section, studentId } = req.body;

    // Find all records containing this student
    const records = await TeacherClassRecord.find({
      'students.studentNumber': oldStudentNumber
    });

    // Update each record
    for (const record of records) {
      const studentIndex = record.students.findIndex(s => s.studentNumber === oldStudentNumber);
      if (studentIndex !== -1) {
        record.students[studentIndex] = {
          ...record.students[studentIndex],
          studentId: record.students[studentIndex].studentId, // Preserve the MongoDB ObjectId reference
          studentNumber: newStudentNumber,
          firstName,
          lastName,
          year,
          section
        };
        await record.save();
      }
    }

    res.json({
      success: true,
      message: 'Student information updated in all class records'
    });
  } catch (error) {
    console.error('Error updating student in class records:', error);
    res.status(500).json({
      message: 'Failed to update student in class records',
      error: error.message
    });
  }
});

// Remove student from all teacher class records
router.delete('/remove-all-records/:studentNumber', auth, async (req, res) => {
  try {
    const studentNumber = req.params.studentNumber;

    // Find all records containing this student
    const records = await TeacherClassRecord.find({
      'students.studentNumber': studentNumber
    });

    // Remove student from each record
    for (const record of records) {
      record.students = record.students.filter(s => s.studentNumber !== studentNumber);
      await record.save();
    }

    res.json({
      success: true,
      message: 'Student removed from all class records'
    });
  } catch (error) {
    console.error('Error removing student from class records:', error);
    res.status(500).json({
      message: 'Failed to remove student from class records',
      error: error.message
    });
  }
});

// Add assessment to class record
router.post('/add-assessment', auth, async (req, res) => {
  try {
    const { teacherId, section, subject, assessment } = req.body;

    // Validate required fields
    if (!teacherId || !section || !subject || !assessment) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find the class record
    const classRecord = await TeacherClassRecord.findOne({
      teacherId,
      section,
      subject
    });

    if (!classRecord) {
      return res.status(404).json({ message: 'Class record not found' });
    }

    // Add the assessment to the class record
    if (!classRecord.assessments) {
      classRecord.assessments = [];
    }

    // Check if assessment already exists
    const existingAssessment = classRecord.assessments.find(a => 
      a.type === assessment.type && 
      a.number === assessment.number
    );

    if (existingAssessment) {
      return res.status(400).json({ 
        message: 'An assessment with this type and number already exists' 
      });
    }

    classRecord.assessments.push(assessment);

    // Initialize scores for all students
    classRecord.students.forEach(student => {
      if (!student.scores) {
        student.scores = {};
      }
      student.scores[assessment.id] = null;
    });

    await classRecord.save();

    res.json(classRecord);
  } catch (error) {
    console.error('Error adding assessment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 