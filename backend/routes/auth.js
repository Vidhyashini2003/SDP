/**
 * routes/auth.js — Authentication Routes
 *
 * Handles all user identity actions that do NOT require an existing login session:
 *   - Guest self-registration (public)
 *   - Unified login for all roles (guest, receptionist, chef, driver, admin)
 *   - Email-based account activation (for newly registered or invited users)
 *   - Password reset flow (forgot password → reset password)
 *
 * Protected routes at the bottom (require a valid JWT token):
 *   - GET /api/auth/me          → fetch current user's profile
 *   - PUT /api/auth/profile     → update current user's profile
 *   - PUT /api/auth/change-password → change current user's password
 *
 * All routes are mounted at: /api/auth (see server.js)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ─────────────────────────────────────────────
// PUBLIC ROUTES (no token required)
// ─────────────────────────────────────────────

// POST /api/auth/guest/register
// Registers a new guest account: creates Users + Guest records, sends activation email.
router.post('/guest/register', authController.registerGuest);

// POST /api/auth/login
// Unified login for ALL roles. Returns a JWT token + user info on success.
router.post('/login', authController.login);

// GET  /api/auth/activate-account?token=<token>
// Validates the activation token (used by the frontend to pre-fill email).
// POST /api/auth/activate-account
// Activates the account and sets the password (staff invite) or just activates (guest already has password).
// Also migrates any walk-in guest bookings to the newly registered account.
router.get('/activate-account', authController.activateAccount);
router.post('/activate-account', authController.activateAccount);

// POST /api/auth/forgot-password
// Accepts an email address, generates a reset token, and sends a reset link to the user.
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password
// Accepts { token, password, confirmPassword }, validates the token, and updates the password.
router.post('/reset-password', authController.resetPassword);

// ─────────────────────────────────────────────
// PROTECTED ROUTES (JWT token required)
// ─────────────────────────────────────────────

const { verifyToken } = require('../config/auth');

// GET /api/auth/me — Returns the current user's full profile (role-specific fields included)
router.get('/me', verifyToken, authController.getMe);

// PUT /api/auth/profile — Updates common profile fields (name, address, nationality)
router.put('/profile', verifyToken, authController.updateProfile);

// PUT /api/auth/change-password — Updates password (requires current password verification)
router.put('/change-password', verifyToken, authController.changePassword);

module.exports = router;
