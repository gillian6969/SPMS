const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, 'your-secret-key');

    // Check if user exists
    let user = await User.findById(decoded.userId);
    
    if (!user) {
      // Check if it's a student
      user = await Student.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ message: 'Token is not valid' });
      }
      // Add role for students
      user.role = 'student';
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 