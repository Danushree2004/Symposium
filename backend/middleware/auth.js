const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  console.log('--- AUTH MIDDLEWARE ---');
  console.log('Token received:', token ? 'YES' : 'NO');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'STPD_DEFAULT_SECRET_2025_KEY';
    const decoded = jwt.verify(token, secret);
    console.log('Decoded Token:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = auth;