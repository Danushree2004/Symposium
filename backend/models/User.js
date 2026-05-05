const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  college: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin', 'event-admin'], default: 'student' },
  rollNumber: { type: String, unique: true, sparse: true },
  isVerified: { type: Boolean, default: false }, // Verification flag
  verificationToken: { type: String, default: null }, // Random token for verification
  managedEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null }, // Link to the event they manage
  symposiumPaid: { type: Boolean, default: false }, // Tracks if the user has paid the one-time registration fee
  symposiumPaymentStatus: { type: String, enum: ['pending', 'verified', 'rejected', null], default: null },
  symposiumPaymentRef: { type: String, default: '' },
  symposiumPaymentScreenshot: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);