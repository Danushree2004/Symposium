const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g., 'symposium_config'
  value: {
    upiId: { type: String, default: '919994645063@ybl' },
    qrCode: { type: String, default: '' }, // Filename of the uploaded QR
    baseAmount: { type: Number, default: 200 }, // Amount per person
    venue: { type: String, default: '' },
    contactEmail: { type: String, default: '' }
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', SettingsSchema);