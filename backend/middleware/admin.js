const Participation = require('../models/Participation');
const Event = require('../models/Event');

// Middleware to check if user is admin
const adminOnly = async (req, res, next) => {
  // Use the user object from the auth middleware
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Admins only.' });
  }
  next();
};

module.exports = adminOnly;