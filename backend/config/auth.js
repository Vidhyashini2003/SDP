/**
 * config/auth.js — JWT Authentication Middleware & Token Utilities
 *
 * This file provides three reusable exports:
 *
 *  1. generateToken(user, role)
 *     Creates a signed JWT token containing the user's ID, email, and role.
 *     The token is returned to the frontend on successful login and stored in localStorage.
 *     It expires after the duration set in process.env.JWT_EXPIRES_IN (e.g. '7d').
 *
 *  2. verifyToken(req, res, next) — Express middleware
 *     Reads the Bearer token from the Authorization header.
 *     Verifies the token's signature and expiry using JWT_SECRET.
 *     If valid, attaches the decoded payload (id, email, role) to req.user.
 *     All protected routes use this middleware to ensure only logged-in users can access them.
 *
 *  3. authorizeRole(...allowedRoles) — Express middleware factory
 *     Returns a middleware that checks if req.user.role is in the list of allowed roles.
 *     Used after verifyToken to enforce role-based access control (RBAC).
 *     Example: router.get('/dashboard', verifyToken, authorizeRole('admin'), handler)
 *
 * Token flow:
 *   Login → generateToken → stored in localStorage
 *   Every API request → Authorization: Bearer <token> header
 *   Server → verifyToken → authorizeRole → controller
 */

const jwt = require('jsonwebtoken');
require('dotenv').config(); // Loads JWT_SECRET and JWT_EXPIRES_IN from .env

// ─────────────────────────────────────────────
// GENERATE TOKEN
// ─────────────────────────────────────────────

/**
 * Creates a JWT token for a logged-in user.
 * @param {object} user - Object with at least { id, email } from the Users table
 * @param {string} role - The user's role: 'guest', 'receptionist', 'chef', 'driver', 'admin'
 * @returns {string} Signed JWT string to send to the client
 */
const generateToken = (user, role) => {
    return jwt.sign(
        {
            id: user.id,       // user_id from the Users table (used in req.user.id)
            email: user.email, // email address
            role: role         // determines which routes the user can access
        },
        process.env.JWT_SECRET,                    // Secret key used to sign the token
        { expiresIn: process.env.JWT_EXPIRES_IN }  // Token expiry (e.g. '7d', '24h')
    );
};

// ─────────────────────────────────────────────
// VERIFY TOKEN MIDDLEWARE
// ─────────────────────────────────────────────

/**
 * Express middleware that validates the JWT sent with every protected request.
 * Reads token from the "Authorization: Bearer <token>" header.
 * If valid, attaches decoded payload to req.user and calls next().
 * If missing or invalid, responds with 401 Unauthorized.
 */
const verifyToken = (req, res, next) => {
    // Extract token from "Bearer TOKEN" format
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        // jwt.verify will throw an error if the token is expired or tampered with
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Now available as req.user.id, req.user.email, req.user.role
        next(); // Pass control to the next middleware or controller
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

// ─────────────────────────────────────────────
// ROLE-BASED AUTHORIZATION MIDDLEWARE
// ─────────────────────────────────────────────

/**
 * Middleware factory for role-based access control.
 * Call this AFTER verifyToken so that req.user is already populated.
 *
 * @param {...string} allowedRoles - List of roles that may access the route
 * @returns Express middleware that blocks unauthorized roles with 403 Forbidden
 *
 * Usage examples:
 *   router.use(authorizeRole('admin'))             → only admins
 *   router.get('/x', authorizeRole('guest', 'receptionist'), handler) → two roles
 */
const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            // This should not happen if verifyToken ran first, but is a safety guard
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            // User is authenticated but does not have the required role
            return res.status(403).json({ error: 'Access forbidden. Insufficient permissions.' });
        }

        next(); // User has the correct role — allow access
    };
};

module.exports = {
    generateToken,
    verifyToken,
    authorizeRole
};
