const adminOrEventAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ msg: 'No authentication token provided.' });
  }
  
  if (req.user.role === 'admin' || req.user.role === 'event-admin') {
    next();
  } else {
    return res.status(403).json({ msg: 'Access denied. Authorized personnel only.' });
  }
};

module.exports = adminOrEventAdmin;