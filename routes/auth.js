const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const OTP = require('../models/OTP');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');

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
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate OTP
    const otp = generateOTP();
    console.log('Generated OTP:', otp);
    
    // Save OTP to database
    await OTP.create({
      userId: user._id,
      otp: otp
    });
    console.log('OTP saved to database');

    // Send OTP via email
    console.log('Attempting to send email to:', user.email);
    const emailSent = await sendOTPEmail(user.email, otp);
    console.log('Email sending result:', emailSent);
    
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }

    // Create temporary token for OTP verification
    const tempToken = jwt.sign(
      { userId: user._id },
      'your-secret-key',
      { expiresIn: '5m' }
    );

    res.json({
      message: 'OTP sent to your email',
      tempToken,
      requiresOTP: true
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', async (req, res) => {
  try {
    const { otp, tempToken } = req.body;

    // Verify temporary token
    const decoded = jwt.verify(tempToken, 'your-secret-key');
    const userId = decoded.userId;

    // Find OTP in database
    const otpDoc = await OTP.findOne({ userId, otp });
    if (!otpDoc) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Delete OTP document
    await OTP.deleteOne({ _id: otpDoc._id });

    // Find user with complete details
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Generate final authentication token
    const token = jwt.sign(
      { userId: user._id },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return complete user data
    res.json({
      token,
      user: {
        _id: user._id,
        id: user._id, // Adding id field for compatibility
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        teachingYear: user.teachingYear,
        name: `${user.firstName} ${user.lastName}` // Adding formatted name
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 