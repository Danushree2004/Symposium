const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Force IPv4 for local MongoDB connections to avoid DNS resolution issues in Node.js 18+
const mongoURI = (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/STPD_Symposium').replace('localhost', '127.0.0.1');

// Database connection
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    console.log('[DB] Using existing connection');
    return;
  }
  
  try {
    console.log('[DB] Attempting to connect to Atlas...');
    // Ensure we use the production URI from Environment Variables
    const connUri = process.env.MONGO_URI;
    if (!connUri) {
      throw new Error('MONGO_URI environment variable is missing!');
    }

    await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 15000, // Increased timeout
      socketTimeoutMS: 45000,
    });
    console.log(`[DB SUCCESS] Connected to Atlas`);
  } catch (err) {
    console.error('CRITICAL DATABASE ERROR:', err.message);
    throw err; // Throw so the middleware catches it
  }
};

// Initial connection
connectDB();

// AUTO-ADMIN UPGRADE: This will promote specific accounts to admin on first request
app.use(async (req, res, next) => {
  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const adminEmail = 'admin@orion.com';
    const adminPassword = 'adminpassword123';

    let user = await User.findOne({ email: adminEmail });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      user = new User({
        name: 'System Admin',
        email: adminEmail,
        password: hashedPassword,
        college: 'Internal',
        role: 'admin',
        isVerified: true
      });
      await user.save();
      console.log('[AUTO-ADMIN] Created admin@orion.com');
    } else if (user.role !== 'admin') {
      user.role = 'admin';
      user.isVerified = true;
      await user.save();
      console.log('[AUTO-ADMIN] Upgraded admin@orion.com to admin');
    }
  } catch (err) {
    console.error('[AUTO-ADMIN] Error:', err.message);
  }
  next();
});

// Middleware to ensure DB connection for every request (Crucial for Vercel Serverless)
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Middleware
// Increase size limit for Base64 image storage in MongoDB
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'x-auth-token', 'x-user-role'],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
}));

// Serves files with correct Content-Type and Inline disposition to ensure browser preview
const os = require('os');
const uploadPath = process.env.VERCEL ? os.tmpdir() : path.join(__dirname, 'uploads');

app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadPath, {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') res.setHeader('Content-Type', 'application/pdf');
    if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
      const type = ext === '.jpg' ? 'jpeg' : ext.replace('.', '');
      res.setHeader('Content-Type', `image/${type}`);
    }
    // "inline" tells the browser to NOT download it, but show it in the tab
    res.setHeader('Content-Disposition', 'inline');
  }
}));

// Debug request paths
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Define User routes
const userRouter = require('./routes/user');
app.use('/api/users', userRouter); // Prefixed with /api
console.log('User Router registered at /api/users');

// Define Event routes
const eventRouter = require('./routes/event');
app.use('/api/events', eventRouter); // Prefixed with /api
console.log('Event Router registered at /api/events');

// Define Admin routes
const adminRouter = require('./routes/admin');
app.use('/api/admin', adminRouter); // Prefixed with /api
console.log('Admin Router registered at /api/admin');

// Define Certificate routes
const certificateRouter = require('./routes/certificate');
app.use('/api/certificates', certificateRouter); // Prefixed with /api
console.log('Certificate Router registered at /api/certificates');

// Start the server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
  });
}

module.exports = app;