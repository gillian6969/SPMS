const mongoose = require('mongoose');

const teacherClassRecordSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  year: {
    type: String,
    required: true,
    enum: ['1st', '2nd', '3rd', '4th']
  },
  section: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  students: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    studentNumber: String,
    firstName: String,
    lastName: String,
    year: String,
    section: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
teacherClassRecordSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TeacherClassRecord', teacherClassRecordSchema); 