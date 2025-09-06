const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('Authorization header:', req.header('Authorization'));
    console.log('All headers:', Object.keys(req.headers));
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('Extracted token:', token ? `${token.substring(0, 10)}...` : 'NO TOKEN');
    
    if (!token) {
      console.log('No token found, denying access');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
