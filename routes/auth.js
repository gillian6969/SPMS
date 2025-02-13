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
    const { email, password, loginType } = req.body;
    console.log('Login attempt details:', { 
      email, 
      loginType,
      timestamp: new Date().toISOString()
    });

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', {
        attemptedEmail: email,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ 
        message: 'Invalid credentials',
        error: 'user_not_found'
      });
    }

    console.log('User found:', { 
      id: user._id, 
      role: user.role, 
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      attemptedLoginType: loginType,
      timestamp: new Date().toISOString()
    });

    // Validate password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for user:', {
        email,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ 
        message: 'Invalid credentials',
        error: 'invalid_password'
      });
    }
    console.log('Password validation successful for:', email);

    // Validate login type
    console.log('Validating login type:', {
      providedType: loginType,
      userRole: user.role,
      timestamp: new Date().toISOString()
    });

    if (loginType === 'citHead' && user.role !== 'citHead') {
      console.log('Access denied: Non-CIT Head trying to use CIT Head login');
      return res.status(403).json({ 
        message: 'Access denied. Please use the Teacher/Student login.',
        error: 'invalid_login_type'
      });
    }

    if (loginType === 'user' && user.role === 'citHead') {
      console.log('Access denied: CIT Head trying to use regular login');
      return res.status(403).json({ 
        message: 'Access denied. Please use the CIT Head login.',
        error: 'invalid_login_type'
      });
    }

    console.log('Login type validation successful');

    // Generate OTP
    const otp = generateOTP();
    console.log('Generated OTP for user:', { email, otp });
    
    try {
      // Save OTP to database
      const otpDoc = await OTP.create({
        userId: user._id,
        otp: otp
      });
      console.log('OTP saved to database:', {
        userId: user._id,
        otpId: otpDoc._id,
        timestamp: new Date().toISOString()
      });

      // Send OTP via email
      console.log('Attempting to send email to:', user.email);
      const emailSent = await sendOTPEmail(user.email, otp);
      console.log('Email sending attempt result:', {
        success: emailSent,
        email: user.email,
        timestamp: new Date().toISOString()
      });
      
      if (!emailSent) {
        console.log('Failed to send OTP email to:', email);
        return res.status(500).json({ 
          message: 'Failed to send OTP email. Please check your email configuration or try again later.',
          error: 'email_service_error'
        });
      }
    } catch (error) {
      console.error('Error in OTP process:', error);
      return res.status(500).json({ 
        message: 'Failed to process OTP. Please try again later.',
        error: 'otp_process_error'
      });
    }

    // Create temporary token for OTP verification
    const tempToken = jwt.sign(
      { userId: user._id, loginType, role: user.role },
      'your-secret-key',
      { expiresIn: '5m' }
    );

    console.log('Login successful, awaiting OTP verification for:', {
      email,
      role: user.role,
      loginType,
      timestamp: new Date().toISOString()
    });

    // Return response with necessary user data
    res.json({
      message: 'OTP sent to your email',
      tempToken,
      requiresOTP: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        teachingYear: user.teachingYear
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login process',
      error: error.message 
    });
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