const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Participation = require('../models/Participation');
const User = require('../models/User'); // Added User model requirement
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const sendEmail = require('../utils/sendEmail');

// Configure multer for payment screenshot uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Get all events
router.get('/', async (req, res) => {
  try {
    console.log('[DEBUG] GET /events - Fetching all events...');
    const events = await Event.find().maxTimeMS(5000);
    console.log(`[DEBUG] GET /events - Found ${events.length} events`);
    res.json(events);
  } catch (err) {
    console.error('[DEBUG] GET /events Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch events: ' + err.message });
  }
});

// Register for an event
router.post('/register-participation', auth, upload.single('paymentProof'), async (req, res) => {
  try {
    const { eventId, teamName, teamMembersDetails, transactionId, registrationType } = req.body;
    const userId = req.user.userId;
    
    console.log('Registration request body:', req.body);
    console.log('Uploaded file:', req.file);

    // Validate Transaction ID (alphanumeric, 8-24 characters)
    const txnPattern = /^[a-zA-Z0-9]{8,24}$/;
    if (!transactionId || !txnPattern.test(transactionId)) {
        return res.status(400).json({ msg: 'Invalid Transaction ID. It should be 8-24 Alphanumeric characters.' });
    }

    // ALWAYS try to parse teamMembersDetails since frontend now sends it for both individual and team
    let parsedMembers = [];
    try {
      if (teamMembersDetails) {
        parsedMembers = typeof teamMembersDetails === 'string' 
          ? JSON.parse(teamMembersDetails) 
          : teamMembersDetails;
      }
    } catch (e) {
      console.error('Error parsing team members:', e);
      parsedMembers = [];
    }

    // Phone number validation (10 digits)
    const phonePattern = /^[0-9]{10}$/;
    for (const member of parsedMembers) {
        if (!member.phone || !phonePattern.test(member.phone)) {
            return res.status(400).json({ msg: `Invalid phone number for ${member.name || 'member'}. Must be a 10-digit number.` });
        }
    }

    // Check if user already has a roll number
    const currentUser = await User.findById(userId);
    let rollNumber = currentUser.rollNumber;

    if (!rollNumber) {
      // Generate unique roll number: ORION27XXX if user doesn't have one
      const lastUserWithRoll = await User.findOne({ 
        rollNumber: new RegExp('^ORION27') 
      }).sort({ rollNumber: -1 });

      let nextNum = 1;
      if (lastUserWithRoll && lastUserWithRoll.rollNumber) {
        const lastNumStr = lastUserWithRoll.rollNumber.replace('ORION27', '');
        const lastNum = parseInt(lastNumStr, 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }
      rollNumber = `ORION27${nextNum.toString().padStart(3, '0')}`;
      
      // Save the roll number to the user so they keep it for all events
      currentUser.rollNumber = rollNumber;
      await currentUser.save();
    }

    // Validation: Only 1 member for individual registration
    if (registrationType === 'individual' && parsedMembers.length > 1) {
      return res.status(400).json({ msg: 'Individual registration only allows one member.' });
    }

    let participation = new Participation({
      user: userId,
      event: eventId,
      teamName: teamName, // Use the teamName provided by the frontend
      rollNumber: rollNumber, // Use the user's permanent roll number
      registrationType: registrationType || (parsedMembers.length > 1 ? 'team' : 'individual'),
      teamMembersDetails: parsedMembers,
      paymentRef: transactionId,
      paymentScreenshot: req.file ? req.file.filename : '', // Save just filename
      paymentStatus: 'pending'
    });
    
    const saved = await participation.save();
    console.log('Participation saved successfully:', saved);

    // Send notification email to the participant
    const event = await Event.findById(eventId);
    const eventName = event?.name || 'the event';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2c3e50; text-align: center;">Registration Successful!</h2>
        <p>Dear ${currentUser.name},</p>
        <p>Congratulations! You have successfully registered for <strong>${eventName}</strong> at STPD ORION'27.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #34495e;">Registration Details:</h3>
          <p><strong>Roll Number:</strong> ${rollNumber}</p>
          <p><strong>Event:</strong> ${eventName}</p>
          <p><strong>Registration Type:</strong> ${registrationType}</p>
          <p><strong>Transaction ID:</strong> ${transactionId}</p>
        </div>

        <p>Please keep your Roll Number handy for the event and further communications.</p>
        <p>Best regards,<br><strong>Team STPD ORION'27</strong></p>
      </div>
    `;

    try {
      await sendEmail(currentUser.email, `Registration Confirmation: ${eventName}`, emailHtml);
      console.log(`Success email sent to ${currentUser.email}`);
    } catch (emailErr) {
      console.error('Failed to send registration email:', emailErr.message);
      // Non-blocking: registration is still successful even if email fails
    }

    res.json({ msg: 'Registered for event successfully', participation: saved });
  } catch (err) {
    console.error('Registration error details:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;