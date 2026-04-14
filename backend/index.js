const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/STPD_Symposium';
mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000,
})
.then(() => console.log(`[DB SUCCESS] Connected to: ${mongoURI}`))
.catch(err => {
  console.error('CRITICAL DATABASE ERROR:', err);
  // Don't exit, let it retry or show error on request
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'x-auth-token', 'x-user-role'],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
}));

// Serves files with correct Content-Type and Inline disposition to ensure browser preview
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads'), {
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
app.use('/users', userRouter);
console.log('User Router registered at /users');

// Define Event routes
const eventRouter = require('./routes/event');
app.use('/events', eventRouter);
console.log('Event Router registered at /events');

// Define Admin routes
const adminRouter = require('./routes/admin');
app.use('/admin', adminRouter);
console.log('Admin Router registered at /admin');

// Define Certificate routes
const certificateRouter = require('./routes/certificate');
app.use('/certificates', certificateRouter);
console.log('Certificate Router registered at /certificates');

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});