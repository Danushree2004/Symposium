const mongoose = require('mongoose');

const ParticipationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  teamName: { type: String, default: null },
  registrationType: { type: String, enum: ['individual', 'team'], default: 'individual' },
  rollNumber: { type: String }, // Removed unique constraint as it is managed in User model now
  teamMembersDetails: [{
    name: { type: String, required: true },
    college: { type: String, required: true },
    phone: { type: String, required: true }
  }],
  paymentStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  paymentRef: { type: String, default: '' },
  paymentScreenshot: { type: String, default: '' },
  shortlisted: { type: Boolean, default: false }, // Shortlisting flag
  resultStatus: { type: String, enum: ['none', 'not shortlisted', 'shortlisted', '1st prize', '2nd prize', '3rd prize'], default: 'none' }, // Result display
  certificateIssued: { type: Boolean, default: false },
  registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Participation', ParticipationSchema);