const jwt = require('jsonwebtoken');

// Middleware to verify the JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];  // Extract token from Authorization header

  if (!token) return res.status(401).json({ message: 'Access denied, no token provided' });

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });

    req.user = user;  // Attach the decoded token (user info) to the request object
    next();  // Pass control to the next middleware/route handler
  });
};

module.exports = authenticateToken; 
