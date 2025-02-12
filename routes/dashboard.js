const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get dashboard statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { year } = req.query;
    let query = {};
    
    // Filter by year if provided
    if (year) {
      query.year = year;
    }

    // Get total students
    const totalStudents = await Student.countDocuments(query);

    // Get total teachers and advisers
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalAdvisers = await User.countDocuments({ role: 'adviser' });

    // Get active sections with year information
    const sections = await Student.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            section: '$section',
            year: '$year'
          },
          studentCount: { $sum: 1 },
          performance: { $avg: '$averageScore' }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id.section',
          year: '$_id.year',
          studentCount: 1,
          performance: { $round: ['$performance', 1] }
        }
      },
      { $sort: { year: 1, name: 1 } }
    ]);

    const activeSections = sections.length;

    // Get attendance data (only if attendance records exist)
    const studentsWithAttendance = await Student.find({ 
      ...query,
      'attendance.0': { $exists: true }
    });

    let averageAttendance = 0;
    let attendanceTrends = [];

    if (studentsWithAttendance.length > 0) {
      // Calculate actual attendance only if there are records
      const totalAttendance = studentsWithAttendance.reduce((sum, student) => {
        const presentCount = student.attendance?.filter(a => a.status === 'present').length || 0;
        const totalCount = student.attendance?.length || 0;
        return sum + (totalCount > 0 ? (presentCount / totalCount) * 100 : 0);
      }, 0);

      averageAttendance = totalAttendance / studentsWithAttendance.length;

      // Get actual attendance trends if data exists
      const attendanceDates = [...new Set(studentsWithAttendance.flatMap(s => 
        s.attendance?.map(a => a.date.toISOString().split('T')[0]) || []
      ))].sort();

      attendanceTrends = attendanceDates.map(date => {
        const dayAttendance = studentsWithAttendance.reduce((sum, student) => {
          const dayRecord = student.attendance?.find(a => 
            a.date.toISOString().split('T')[0] === date
          );
          return sum + (dayRecord?.status === 'present' ? 1 : 0);
        }, 0);

        return {
          date,
          rate: (dayAttendance / studentsWithAttendance.length) * 100
        };
      });
    }

    // Get performance distribution by year
    const performanceDistribution = {};
    const years = year ? [year] : ['1st', '2nd', '3rd', '4th'];
    
    // Initialize all years with zeros
    for (const yr of years) {
      performanceDistribution[yr] = [0, 0, 0, 0, 0];
    }

    // Get actual performance data if available
    for (const yr of years) {
      const yearQuery = { ...query, year: yr };
      const studentsWithScores = await Student.find({
        ...yearQuery,
        averageScore: { $exists: true }
      });

      if (studentsWithScores.length > 0) {
        performanceDistribution[yr] = [
          studentsWithScores.filter(s => s.averageScore >= 90).length,
          studentsWithScores.filter(s => s.averageScore >= 80 && s.averageScore < 90).length,
          studentsWithScores.filter(s => s.averageScore >= 70 && s.averageScore < 80).length,
          studentsWithScores.filter(s => s.averageScore >= 60 && s.averageScore < 70).length,
          studentsWithScores.filter(s => s.averageScore < 60).length
        ];
      }
    }

    res.json({
      totalStudents,
      totalTeachers,
      totalAdvisers,
      activeSections,
      averageAttendance,
      averageScore: 0, // This will be implemented when Assessment model is ready
      performanceDistribution,
      attendanceTrends,
      sections
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics', error: error.message });
  }
});

// Get active sections
router.get('/sections', auth, async (req, res) => {
  try {
    const { year } = req.query;
    let query = {};
    
    if (year) {
      query.year = year;
    }

    // Get unique sections
    const sections = await Student.distinct('section', query);

    // Get performance data for each section
    const sectionsData = await Promise.all(
      sections.map(async (section) => {
        const students = await Student.find({ section, ...query });
        return {
          name: section,
          studentCount: students.length,
          performance: 0 // This will be implemented when Assessment model is ready
        };
      })
    );

    res.json(sectionsData);

  } catch (error) {
    console.error('Sections fetch error:', error);
    res.status(500).json({ message: 'Error fetching sections data', error: error.message });
  }
});

module.exports = router; 