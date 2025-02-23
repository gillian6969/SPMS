const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const bcryptjs = require('bcryptjs');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

// Configure multer for file upload
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Upload student list via CSV
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { year } = req.body;
    if (!year) {
      return res.status(400).json({ message: 'Year level is required' });
    }

    const results = [];
    const errors = [];

    // Calculate academic years based on current year and student's year level
    const currentYear = new Date().getFullYear();
    let startYear, endYear;
    
    switch(year) {
      case '1st':
        startYear = currentYear;
        endYear = currentYear + 4;
        break;
      case '2nd':
        startYear = currentYear - 1;
        endYear = currentYear + 3;
        break;
      case '3rd':
        startYear = currentYear - 2;
        endYear = currentYear + 2;
        break;
      case '4th':
        startYear = currentYear - 3;
        endYear = currentYear + 1;
        break;
      default:
        return res.status(400).json({ message: 'Invalid year level' });
    }

    // Read CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          // Get current student count for each section
          const sectionCounts = {
            'South 1': await Student.countDocuments({ year, section: 'South 1' }),
            'South 2': await Student.countDocuments({ year, section: 'South 2' }),
            'South 3': await Student.countDocuments({ year, section: 'South 3' })
          };

          let successCount = 0;
          // Process each student
          for (const row of results) {
            try {
              // Validate required fields
              if (!row.StudentID || !row.LastName || !row.FirstName || !row.MiddleName || !row.ContactNumber || !row.Email) {
                errors.push(`Missing required fields for student: ${JSON.stringify(row)}`);
                continue;
              }

              // Check if student already exists
              const existingStudent = await Student.findOne({
                $or: [
                  { studentId: row.StudentID },
                  { email: row.Email }
                ]
              });

              if (existingStudent) {
                errors.push(`Student already exists: ${row.StudentID}`);
                continue;
              }

              // Determine section based on counts (50 students per section)
              let assignedSection;
              if (sectionCounts['South 1'] < 50) {
                assignedSection = 'South 1';
                sectionCounts['South 1']++;
              } else if (sectionCounts['South 2'] < 50) {
                assignedSection = 'South 2';
                sectionCounts['South 2']++;
              } else {
                assignedSection = 'South 3';
                sectionCounts['South 3']++;
              }

              // Hash the password (using student ID as default password)
              const salt = await bcryptjs.genSalt(10);
              const hashedPassword = await bcryptjs.hash(row.StudentID, salt);

              // Create new student
              const student = new Student({
                studentId: row.StudentID,
                firstName: row.FirstName,
                middleName: row.MiddleName,
                lastName: row.LastName,
                email: row.Email,
                contactNumber: row.ContactNumber,
                password: hashedPassword,
                year: year,
                section: assignedSection,
                academicYears: {
                  startYear,
                  endYear
                }
              });

              await student.save();
              successCount++;
            } catch (error) {
              console.error('Error processing student:', error);
              errors.push(`Error processing student ${row.StudentID}: ${error.message}`);
            }
          }

          // Clean up uploaded file
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });

          // Send response
          res.json({
            message: 'File processed successfully',
            totalProcessed: results.length,
            successCount: successCount,
            errors: errors,
            sectionCounts
          });
        } catch (error) {
          console.error('Error processing CSV:', error);
          res.status(500).json({ message: 'Error processing file', error: error.message });
        }
      });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get students by year and section
router.get('/by-section', auth, async (req, res) => {
  try {
    const { year, section } = req.query;
    
    if (!year || !section) {
      return res.status(400).json({ 
        message: 'Both year and section parameters are required' 
      });
    }

    const students = await Student.find({ 
      year: year,
      section: section 
    })
    .select('-password')
    .sort({ lastName: 1, firstName: 1 });

    res.json(students);
  } catch (error) {
    console.error('Error fetching students by section:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get all students (CIT Head only)
router.get('/', auth, async (req, res) => {
  try {
    const { year, section } = req.query;
    let query = {};
    
    if (year) query.year = year;
    if (section) query.section = section;
    
    const students = await Student.find(query)
      .select('-password')
      .sort({ lastName: 1, firstName: 1 });
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update student
router.put('/:id', auth, async (req, res) => {
  try {
    const { firstName, middleName, lastName, email, contactNumber, year } = req.body;
    
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Update basic info
    if (firstName) student.firstName = firstName;
    if (middleName !== undefined) student.middleName = middleName;
    if (lastName) student.lastName = lastName;
    if (email) student.email = email;
    if (contactNumber !== undefined) student.contactNumber = contactNumber;
    
    // Update year and recalculate academic years if year changes
    if (year && year !== student.year) {
      student.year = year;
      
      // Recalculate academic years
      const currentYear = new Date().getFullYear();
      switch(year) {
        case '1st':
          student.academicYears = {
            startYear: currentYear,
            endYear: currentYear + 4
          };
          break;
        case '2nd':
          student.academicYears = {
            startYear: currentYear - 1,
            endYear: currentYear + 3
          };
          break;
        case '3rd':
          student.academicYears = {
            startYear: currentYear - 2,
            endYear: currentYear + 2
          };
          break;
        case '4th':
          student.academicYears = {
            startYear: currentYear - 3,
            endYear: currentYear + 1
          };
          break;
      }
    }
    
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete student
router.delete('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    await student.deleteOne();
    res.json({ message: 'Student removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 