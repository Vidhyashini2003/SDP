/**
 * utils/cronJobs.js — Background Scheduled Tasks (Cron Jobs)
 *
 * Purpose:
 *   Runs a series of database status-sync queries every 5 minutes.
 *   This ensures that booking/order records are automatically moved to
 *   their correct final state after their scheduled date/time has passed,
 *   even if no user action triggered the change.
 *
 * Automated tasks:
 *   1. Room Booking Auto-Complete  — marks rooms as Completed after checkout
 *   2. Activity Booking Auto-Complete — marks activities as Completed after end time
 *   3. Food Order Auto-Incomplete  — marks old Pending orders as Incomplete (missed delivery)
 *   4. Vehicle Hire Auto-Complete  — marks per-day hires as Completed after return date
 *   5. Arrival Transport Auto-Complete — marks airport transfers as Completed after pickup time
 *   6. Quick Ride Auto-Complete    — marks stale Pending quick rides (>24h) as Completed
 *
 * Why a cron job?
 *   Without this, a booking that ended yesterday would still show as "Booked" in the DB
 *   unless the receptionist or guest manually changed it. The cron job keeps the database
 *   consistent with real-world time automatically.
 *
 * Schedule: every 5 minutes  (cron pattern: star/5 star star star star)
 */

const cron = require('node-cron');
const db = require('../config/db');

/**
 * initCronJobs() — Registers all scheduled background tasks.
 * Called once from server.js during application startup.
 */
const initCronJobs = () => {
    // Schedule: run every 5 minutes (*/5 * * * * = minute, hour, day, month, weekday)
    cron.schedule('*/5 * * * *', async () => {
        console.log('[CRON] Running background status sync for outdated bookings...');
        try {
            // Borrow a connection from the pool for all cron queries.
            // Using a single connection for the entire job ensures all updates
            // happen in the same DB session and can be individually error-caught.
            const connection = await db.getConnection();
            
            try {
                // ─── Task 1: Room Booking Auto-Complete ───────────────────────────
                // If a room's checkout date has passed and the status is still
                // 'Booked' or 'Checked-in', automatically mark it as 'Completed'.
                const [rooms] = await connection.query(`
                    UPDATE roombooking 
                    SET rb_status = 'Completed' 
                    WHERE rb_checkout <= NOW() AND rb_status IN ('Booked', 'Checked-in')
                `);
                if(rooms.affectedRows > 0) console.log(`[CRON] Auto-completed ${rooms.affectedRows} passed room bookings.`);

                // ─── Task 2: Activity Booking Auto-Complete ───────────────────────
                // If an activity's end time has passed and it's still in an
                // active state, mark it as 'Completed'.
                const [activities] = await connection.query(`
                    UPDATE activitybooking 
                    SET ab_status = 'Completed' 
                    WHERE ab_end_time <= NOW() AND ab_status IN ('Reserved', 'Confirmed', 'In Progress')
                `);
                if(activities.affectedRows > 0) console.log(`[CRON] Auto-completed ${activities.affectedRows} passed activity bookings.`);

                // ─── Task 3: Food Order Auto-Incomplete ───────────────────────────
                // If a food order was scheduled for a past date and is still 'Pending'
                // (i.e. no chef ever acted on it), mark it as 'Incomplete' to flag it.
                // Note: Orders already assigned to a chef (status 'Preparing', etc.) are excluded.
                const [food] = await connection.query(`
                    UPDATE foodorder 
                    SET order_status = 'Incomplete' 
                    WHERE scheduled_date < CURDATE() AND order_status = 'Pending'
                `);
                if(food.affectedRows > 0) console.log(`[CRON] Auto-marked ${food.affectedRows} passed food orders as Incomplete.`);

                // ─── Task 4: Vehicle Hire Auto-Complete (Per-Day Hire) ────────────
                // For hires charged per day: if (hire_start_date + hire_days) <= NOW(),
                // the hire period has ended. Mark it as 'Completed'.
                const [hirePerDay] = await connection.query(`
                    UPDATE hirevehicle 
                    SET vb_status = 'Completed' 
                    WHERE DATE_ADD(vb_date, INTERVAL vb_days DAY) <= NOW() AND vb_status IN ('Confirmed', 'Booked', 'In Progress', 'Pending Approval', 'Pending Payment')
                `);
                if(hirePerDay.affectedRows > 0) console.log(`[CRON] Auto-completed ${hirePerDay.affectedRows} passed vehicle hire per days.`);

                // ─── Task 5: Arrival Transport Auto-Complete ──────────────────────
                // If an airport pickup/drop-off was scheduled in the past and
                // hasn't been marked Completed or Cancelled, auto-complete it.
                const [arrivalTransport] = await connection.query(`
                    UPDATE hire_vehicle_for_arrival 
                    SET status = 'Completed' 
                    WHERE scheduled_at <= NOW() AND status NOT IN ('Completed', 'Cancelled')
                `);
                if(arrivalTransport.affectedRows > 0) console.log(`[CRON] Auto-completed ${arrivalTransport.affectedRows} passed arrival transports.`);

                // ─── Task 6: Quick Ride Auto-Complete ────────────────────────────
                // Quick rides that are still 'Pending' after 24 hours were never picked up.
                // Auto-complete them to avoid stale data (no driver accepted them).
                const [quickRide] = await connection.query(`
                    UPDATE quickride 
                    SET status = 'Completed' 
                    WHERE status = 'Pending' AND created_date <= DATE_SUB(NOW(), INTERVAL 1 DAY)
                `);
                if(quickRide.affectedRows > 0) console.log(`[CRON] Auto-completed ${quickRide.affectedRows} passed point-to-point old quick rides.`);

            } catch (err) {
                // Log query-level errors but don't crash the server
                console.error('[CRON] Query Error: ', err);
            } finally {
                // Always release the connection back to the pool when done
                connection.release();
            }
        } catch (error) {
            // Log pool-connection errors (e.g. DB is temporarily unreachable)
            console.error('[CRON] Pool Connection Error: ', error);
        }
    });
};

module.exports = initCronJobs;
