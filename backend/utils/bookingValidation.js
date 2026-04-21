/**
 * utils/bookingValidation.js — Booking Access Validation Middleware
 *
 * Provides reusable Express middleware functions for validating guest booking conditions
 * before allowing access to service booking endpoints (activities, food, vehicles, etc.).
 *
 * Why these exist:
 *   The system enforces that guests can only book services (food, activities, vehicles)
 *   if they have an ACTIVE room booking. This prevents guests from ordering services
 *   without a valid stay in progress. These middleware functions are used as guards
 *   on booking routes.
 *
 * Functions:
 *
 *  hasActiveBooking(req, res, next)
 *    — Checks if the guest currently has at least one active room booking
 *      (status = 'Booked' OR 'Checked-in' AND checkout_date >= today).
 *    — If yes: attaches { guest_id, active_booking } to req.guestBooking and calls next().
 *    — If no:  returns 403 with "No active room booking found".
 *
 *  validateBookingOwnership(req, res, next)
 *    — Verifies that the booking ID passed in req.params.id belongs to the current guest.
 *    — Prevents guests from cancelling or modifying bookings that don't belong to them.
 *
 *  checkDateOverlap(table, idColumn, guestId, startDate, endDate, excludeId?)
 *    — Utility function (not middleware) that checks if a guest already has a booking
 *      for the same resource in the given date range (prevents double-booking).
 *    — Returns { hasOverlap: boolean }.
 *
 * All functions use req.user.id (set by verifyToken) to identify the current user.
 */

const db = require('../config/db');

/**
 * Middleware to check if the guest has an active room booking
 * Active booking = Status is 'Booked' OR 'Checked In' AND checkout date >= today
 */
exports.hasActiveBooking = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Get guest_id
        const [guestRows] = await db.query('SELECT guest_id FROM Guest WHERE user_id = ?', [userId]);
        if (guestRows.length === 0) {
            return res.status(404).json({ error: 'Guest profile not found' });
        }
        const guest_id = guestRows[0].guest_id;

        // Check for active bookings
        const [bookings] = await db.query(
            `SELECT rb_id, rb_checkin, rb_checkout, rb_status 
             FROM roombooking 
             WHERE guest_id = ? 
             AND rb_status IN ('Booked', 'Checked-in', 'Active')
             AND rb_checkout >= CURDATE()
             ORDER BY rb_checkin ASC`,
            [guest_id]
        );

        if (bookings.length === 0) {
            return res.status(403).json({
                error: 'No active booking found',
                message: 'You must have an active room booking to access this service. Please book a room first.',
                requiresBooking: true
            });
        }

        // Attach guest bookings to request for use in controllers
        req.guestId = guest_id;
        req.activeBookings = bookings;

        next();
    } catch (error) {
        console.error('Error checking active booking:', error);
        res.status(500).json({ error: 'Failed to verify booking status' });
    }
};

/**
 * Helper function to get active bookings for a guest
 * Can be used in controllers without middleware
 */
exports.getActiveBookings = async (guestId) => {
    try {
        const [bookings] = await db.query(
            `SELECT rb_id, rb_checkin, rb_checkout, rb_status, rb_total_amount,
                    r.room_id, r.room_type, r.room_status
             FROM roombooking rb
             JOIN room r ON rb.room_id = r.room_id
             WHERE rb.guest_id = ? 
             AND rb.rb_status IN ('Booked', 'Checked-in', 'Active')
             AND rb.rb_checkout >= CURDATE()
             ORDER BY rb.rb_checkin ASC`,
            [guestId]
        );

        return bookings;
    } catch (error) {
        console.error('Error fetching active bookings:', error);
        throw error;
    }
};

/**
 * Helper function to validate if a booking belongs to a guest
 */
exports.validateBookingOwnership = async (guestId, bookingId) => {
    try {
        const [rows] = await db.query(
            'SELECT rb_id FROM roombooking WHERE rb_id = ? AND guest_id = ?',
            [bookingId, guestId]
        );

        return rows.length > 0;
    } catch (error) {
        console.error('Error validating booking ownership:', error);
        throw error;
    }
};

/**
 * Helper function to check if dates fall within a booking period
 */
exports.validateDatesWithinBooking = (checkIn, checkOut, startDate, endDate = null) => {
    const bookingStart = new Date(checkIn);
    const bookingEnd = new Date(checkOut);
    const serviceStart = new Date(startDate);
    const serviceEnd = endDate ? new Date(endDate) : serviceStart;

    // Service dates must be within or on booking dates
    return serviceStart >= bookingStart && serviceEnd <= bookingEnd;
};

module.exports = exports;
