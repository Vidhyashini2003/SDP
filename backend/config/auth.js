const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate JWT token
const generateToken = (user, role) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

// Role-based authorization middleware
const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access forbidden. Insufficient permissions.' });
        }

        next();
    };
};

module.exports = {
    generateToken,
    verifyToken,
    authorizeRole
};
