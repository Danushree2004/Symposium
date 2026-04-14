const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['individual', 'team'], required: true },
  category: { type: String, enum: ['technical', 'cultural'], default: 'technical' },
  teamSize: { type: Number, default: 1 },
  registrationFee: { type: Number, required: true },

  date: { type: String, required: true },
  venue: { type: String, required: true },
  results: [
    {
      rank: Number,
      participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      teamName: String
    }
  ]
});

module.exports = mongoose.model('Event', EventSchema);