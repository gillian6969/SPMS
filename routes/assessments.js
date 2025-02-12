const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const auth = require('../middleware/auth');

// Create a new assessment
router.post('/', auth, async (req, res) => {
  try {
    const { type, number, maxScore, teacherId, section, subject, date } = req.body;

    // Validate required fields
    if (!type || !number || !maxScore || !teacherId || !section || !subject) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if assessment already exists
    const existingAssessment = await Assessment.findOne({
      teacherId,
      section,
      subject,
      type,
      number
    });

    if (existingAssessment) {
      return res.status(400).json({
        message: 'An assessment with this type and number already exists'
      });
    }

    // Create new assessment with empty scores object
    const assessment = new Assessment({
      type,
      number,
      maxScore,
      teacherId,
      section,
      subject,
      date: date || new Date(),
      scores: {}
    });

    const savedAssessment = await assessment.save();
    res.status(201).json(savedAssessment);
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update assessment score
router.put('/score', auth, async (req, res) => {
  try {
    const { teacherId, studentNumber, assessmentId, score } = req.body;

    // Validate required fields
    if (!teacherId || !studentNumber || !assessmentId || score === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Use findOneAndUpdate to atomically update the score
    const assessment = await Assessment.findOneAndUpdate(
      { _id: assessmentId },
      { $set: { [`scores.${studentNumber}`]: score } },
      { new: true, runValidators: true }
    );

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Convert Map to plain object for response
    const plainScores = {};
    assessment.scores.forEach((value, key) => {
      plainScores[key] = value;
    });

    const response = {
      ...assessment.toObject(),
      scores: plainScores
    };

    res.json({ message: 'Score updated successfully', assessment: response });
  } catch (error) {
    console.error('Error updating score:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get assessments by teacher, section, and subject
router.get('/', auth, async (req, res) => {
  try {
    const { teacherId, section, subject } = req.query;
    const query = {};
    
    if (teacherId) query.teacherId = teacherId;
    if (section) query.section = section;
    if (subject) query.subject = subject;

    const assessments = await Assessment.find(query).sort({ date: -1 });
    res.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete assessment
router.delete('/:id', auth, async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndDelete(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update assessment details
router.put('/:id', auth, async (req, res) => {
  try {
    const { type, number, maxScore } = req.body;
    
    // Find and update the assessment
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Update fields if provided
    if (type) assessment.type = type;
    if (number) assessment.number = number;
    if (maxScore) assessment.maxScore = maxScore;

    await assessment.save();
    res.json(assessment);
  } catch (error) {
    console.error('Error updating assessment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 