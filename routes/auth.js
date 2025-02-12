const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

// Middleware to check if user is CITHead
const isCITHead = (req, res, next) => {
  if (req.user && req.user.role === 'citHead') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Only CIT Head can register new users.' });
  }
};

// Register Teacher/SSP (CITHead only)
router.post('/register', auth, isCITHead, async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, teachingYear, role } = req.body;

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Validate role (only allow teacher and ssp roles)
    if (!['teacher', 'ssp'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Only teacher and SSP roles are allowed.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user (password will be hashed by the pre-save middleware)
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      teachingYear
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        teachingYear: user.teachingYear
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login for all users
router.post('/login', async (req, res) => {
  try {
    const { email, password, loginType } = req.body;
    console.log('Login attempt for email:', email, 'loginType:', loginType);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('No user found with email:', email);
      
      // Only check for student if loginType is 'user'
      if (loginType === 'user') {
        const student = await Student.findOne({ email });
        if (!student) {
          console.log('No student found with email:', email);
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Compare student password
        const isMatch = await bcryptjs.compare(password, student.password);
        console.log('Student password comparison result:', isMatch);
        
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token for student
        const token = jwt.sign(
          { 
            userId: student._id,
            role: 'student',
            studentId: student.studentId
          },
          'your-secret-key',
          { expiresIn: '24h' }
        );

        return res.json({
          token,
          user: {
            id: student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            role: 'student',
            studentId: student.studentId
          }
        });
      }
      
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', user.email, 'Role:', user.role);
    
    // Validate login type
    if (loginType === 'citHead' && user.role !== 'citHead') {
      return res.status(403).json({ message: 'Access denied. Please use the Teacher/Student login.' });
    }
    
    if (loginType === 'user' && user.role === 'citHead') {
      return res.status(403).json({ message: 'Access denied. Please use the CIT Head login.' });
    }
    
    // Compare user password using the model method
    const isMatch = await user.comparePassword(password);
    console.log('User password comparison result:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token for user
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role
      },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        teachingYear: user.teachingYear
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 