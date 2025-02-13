const express = require('express');
const router = express.Router();
const TeacherClassRecord = require('../models/TeacherClassRecord');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');

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

// Get students for attendance
router.get('/students-for-attendance', auth, async (req, res) => {
  try {
    const { teacherId, year, section, subject } = req.query;
    
    console.log('Received request for students with params:', {
      teacherId,
      year,
      section,
      subject
    });
    
    if (!teacherId || !year || !section || !subject) {
      console.log('Missing required parameters:', {
        hasTeacherId: !!teacherId,
        hasYear: !!year,
        hasSection: !!section,
        hasSubject: !!subject
      });
      return res.status(400).json({ 
        message: 'TeacherId, year, section, and subject are required',
        missingFields: {
          teacherId: !teacherId,
          year: !year,
          section: !section,
          subject: !subject
        }
      });
    }

    console.log('Looking for class record with query:', {
      teacherId,
      year,
      section,
      subject
    });

    const classRecord = await TeacherClassRecord.findOne({
      teacherId,
      year,
      section,
      subject
    }).select('students year section subject');

    console.log('Class record found:', classRecord ? 'Yes' : 'No');
    if (classRecord) {
      console.log('Number of students in record:', classRecord.students?.length || 0);
    }

    if (!classRecord) {
      return res.status(404).json({ 
        message: 'Class record not found',
        query: {
          teacherId,
          year,
          section,
          subject
        }
      });
    }

    // Sort students by lastName then firstName
    const sortedStudents = [...classRecord.students]
      .sort((a, b) => {
        const lastNameComparison = a.lastName.localeCompare(b.lastName);
        if (lastNameComparison !== 0) return lastNameComparison;
        return a.firstName.localeCompare(b.firstName);
      })
      .map(student => ({
        studentId: student.studentId,
        studentNumber: student.studentNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        attendance: student.attendance || [],
        year: classRecord.year,
        section: classRecord.section,
        subject: classRecord.subject
      }));

    console.log('Sending response with sorted students:', sortedStudents.length);

    res.json({
      students: sortedStudents,
      year: classRecord.year,
      section: classRecord.section,
      subject: classRecord.subject
    });
  } catch (error) {
    console.error('Error fetching students for attendance:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: error.stack
    });
  }
});

// Get available subjects for teacher
router.get('/available-subjects', auth, async (req, res) => {
  try {
    const { teacherId, year, section } = req.query;
    
    console.log('Received request for subjects with params:', {
      teacherId,
      year,
      section
    });
    
    if (!teacherId) {
      console.log('TeacherId is missing from request');
      return res.status(400).json({ 
        message: 'TeacherId is required',
        success: false
      });
    }

    // Validate teacherId format
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      console.log('Invalid teacherId format:', teacherId);
      return res.status(400).json({
        message: 'Invalid teacherId format',
        success: false
      });
    }

    // Build query
    const query = { teacherId };
    if (year) query.year = year;
    if (section) query.section = section;

    console.log('Finding records with query:', query);

    // Find class records for this teacher with optional year/section filter
    const records = await TeacherClassRecord.find(query);
    console.log('Found records count:', records.length);
    
    if (!records || records.length === 0) {
      console.log('No records found for query:', query);
      return res.json({ 
        subjects: [],
        success: true,
        message: 'No class records found for these criteria'
      });
    }

    // Get unique subjects from filtered records
    const subjects = [...new Set(records.map(record => record.subject))].filter(Boolean);
    console.log('Extracted subjects:', subjects);

    // Get student counts per subject for filtered records
    const subjectCounts = subjects.map(subject => {
      const recordsWithSubject = records.filter(r => r.subject === subject);
      const studentCount = recordsWithSubject.reduce((total, record) => total + (record.students?.length || 0), 0);
      return { subject, studentCount };
    });
    console.log('Subject counts:', subjectCounts);

    res.json({ 
      subjects,
      subjectCounts,
      success: true,
      recordCount: records.length,
      query
    });
  } catch (error) {
    console.error('Error fetching available subjects:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      success: false
    });
  }
});

// Get teacher's sections and subjects
router.get('/sections-subjects/:teacherId', auth, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { year } = req.query;

    const query = { teacherId };
    if (year) query.year = year;

    const records = await TeacherClassRecord.find(query);

    // Extract unique sections and subjects
    const sections = [...new Set(records.map(record => record.section))];
    const subjects = [...new Set(records.map(record => record.subject))];

    res.json({
      sections,
      subjects
    });
  } catch (error) {
    console.error('Error fetching sections and subjects:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get student performance
router.get('/student/:studentId/performance', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const studentId = req.params.studentId;

    // Create date filter using the date field
    let dateFilter = {};
    if (startDate && endDate) {
      const phStartDate = new Date(startDate);
      const phEndDate = new Date(endDate);
      
      // Adjust for Philippine timezone
      phStartDate.setHours(phStartDate.getHours() + 8);
      phEndDate.setHours(phEndDate.getHours() + 8);
      
      dateFilter.date = {
        $gte: phStartDate,
        $lte: phEndDate
      };
    }

    // Get all assessments for this student within the date range
    const assessments = await Assessment.find({
      ...dateFilter,
      'scores.studentId': studentId
    }).sort({ date: -1 }); // Sort by date field

    const response = {
      assessments: assessments.map(assessment => ({
        id: assessment._id,
        type: assessment.type,
        number: assessment.number,
        maxScore: assessment.maxScore,
        date: assessment.date,
        subject: assessment.subject,
        score: assessment.scores.find(s => s.studentId.toString() === studentId)?.score || 0
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching student performance:', error);
    res.status(500).json({ message: 'Failed to fetch student performance' });
  }
});

module.exports = router; 