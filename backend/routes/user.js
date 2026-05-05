const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Participation = require('../models/Participation');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, college } = req.body;
    
    if (!name || !email || !password || !college) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    user = new User({ name, email, password: hashedPassword, college, verificationToken });
    await user.save();

    // Send verification email
    const API_BASE = process.env.VITE_API_URL ? "https://symposium-teal.vercel.app/api" : "http://localhost:5000/api";
    const verificationUrl = `${API_BASE}/users/verify/${verificationToken}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2c3e50; text-align: center;">Welcome to STPD ORION'27!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for registering. Please verify your email by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Verify Email Address</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #7f8c8d; font-size: 12px;">${verificationUrl}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 11px; color: #95a5a6; text-align: center;">You are receiving this because you signed up for the STPD ORION'27 event management portal.</p>
      </div>
    `;

    try {
      await sendEmail(email, 'Verify your email for STPD ORION\'27', emailHtml);
      console.log(`Verification email sent to ${email}`);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
      // Log full error for verification in Vercel
      return res.status(500).json({ 
        msg: 'User created but failed to send verification email.', 
        error: emailErr.message,
        code: emailErr.code,
        command: emailErr.command 
      });
    }

    res.json({ msg: 'Registration successful. Please check your email to verify your account.' });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ msg: 'Server Error during registration', error: err.message });
  }
});

// Verify Email
router.get('/verify/:token', async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) {
      return res.status(400).send('<h1>Invalid or Expired Token</h1><p>The verification link is invalid or has expired.</p>');
    }

    user.isVerified = true;
    user.verificationToken = null; // Clear the token
    await user.save();

    const FRONTEND_URL = process.env.VITE_API_URL ? "https://symposium-teal.vercel.app" : "http://localhost:5173";
    res.send(`<h1>Email Verified Successfully!</h1><p>You can now <a href="${FRONTEND_URL}/register">Login</a> to the STPD portal.</p>`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    console.log(`[DEBUG] Login attempt for ${email}. isVerified: ${user.isVerified}`);

    // Temporary bypass for verification during testing if needed
    // if (!user.isVerified) {
    //   return res.status(400).json({ msg: 'Please verify your email before logging in.' });
    // }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const payload = { userId: user._id, role: user.role };
    const secret = process.env.JWT_SECRET || 'STPD_DEFAULT_SECRET_2025_KEY';
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, college: user.college } });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ 
      msg: 'Server Error during login', 
      error: err.message,
      hasSecret: !!process.env.JWT_SECRET 
    });
  }
});

// Get user profile including registered events and results
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('[PROFILE] GET /profile - userId:', req.user.userId);
    console.log('[PROFILE] DB Connection State:', mongoose.connection.readyState);
    
    // Test if DB is reachable specifically for this query
    if (mongoose.connection.readyState !== 1) {
        console.error('[PROFILE] DB NOT READY. State:', mongoose.connection.readyState);
        throw new Error('Database connection is not active (state: ' + mongoose.connection.readyState + ')');
    }

    console.log('[PROFILE] Fetching user from DB...');
    const user = await User.findById(req.user.userId).select('-password').maxTimeMS(5000);
    if (!user) {
        console.warn('[PROFILE] User not found in DB with ID:', req.user.userId);
        return res.status(404).json({ msg: 'User profile not found in database' });
    }
    console.log('[PROFILE] User found:', user._id);
    
    // FIXED: Use lean or ensure models are correctly loaded
    console.log('[PROFILE] Fetching participation records...');
    const registeredEvents = await Participation.find({ user: user._id })
      .populate('event')
      .sort({ registeredAt: -1 })
      .maxTimeMS(5000);
    
    console.log('[PROFILE] Profile success - registeredEvents count:', registeredEvents.length);
    res.json({ user, registeredEvents });
  } catch (err) {
    console.error('[PROFILE] ERROR:', err); // Log full error object
    console.error('[PROFILE] ERROR Message:', err.message);
    console.error('[PROFILE] ERROR Stack:', err.stack);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// Get current user details (alias for specific profile needs)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;