const cron = require('node-cron');
const db = require('../config/db');

const initCronJobs = () => {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        console.log('[CRON] Running background status sync for outdated bookings...');
        try {
            const connection = await db.getConnection();
            
            try {
                // 1. Room Booking Auto-Complete
                const [rooms] = await connection.query(`
                    UPDATE roombooking 
                    SET rb_status = 'Completed' 
                    WHERE rb_checkout <= NOW() AND rb_status IN ('Booked', 'Checked-in')
                `);
                if(rooms.affectedRows > 0) console.log(`[CRON] Auto-completed ${rooms.affectedRows} passed room bookings.`);

                // 2. Activity Booking Auto-Complete
                const [activities] = await connection.query(`
                    UPDATE activitybooking 
                    SET ab_status = 'Completed' 
                    WHERE ab_end_time <= NOW() AND ab_status IN ('Reserved', 'Confirmed', 'In Progress')
                `);
                if(activities.affectedRows > 0) console.log(`[CRON] Auto-completed ${activities.affectedRows} passed activity bookings.`);

                // 3. Food Order Auto-Incomplete
                const [food] = await connection.query(`
                    UPDATE foodorder 
                    SET order_status = 'Incomplete' 
                    WHERE scheduled_date < CURDATE() AND order_status = 'Pending'
                `);
                if(food.affectedRows > 0) console.log(`[CRON] Auto-marked ${food.affectedRows} passed food orders as Incomplete.`);

                // 4. Vehicle Hire Auto-Complete (Per Days)
                const [hirePerDay] = await connection.query(`
                    UPDATE hirevehicle 
                    SET vb_status = 'Completed' 
                    WHERE DATE_ADD(vb_date, INTERVAL vb_days DAY) <= NOW() AND vb_status IN ('Confirmed', 'Booked', 'In Progress', 'Pending Approval', 'Pending Payment')
                `);
                if(hirePerDay.affectedRows > 0) console.log(`[CRON] Auto-completed ${hirePerDay.affectedRows} passed vehicle hire per days.`);

                // 5. Arrival Transport Auto-Complete
                const [arrivalTransport] = await connection.query(`
                    UPDATE hire_vehicle_for_arrival 
                    SET status = 'Completed' 
                    WHERE scheduled_at <= NOW() AND status NOT IN ('Completed', 'Cancelled')
                `);
                if(arrivalTransport.affectedRows > 0) console.log(`[CRON] Auto-completed ${arrivalTransport.affectedRows} passed arrival transports.`);

                // 6. Quick Ride Auto-Complete
                // If it wasn't picked up & more than 24 hours pass, consider it completed (or cancelled).
                const [quickRide] = await connection.query(`
                    UPDATE quickride 
                    SET status = 'Completed' 
                    WHERE status = 'Pending' AND created_date <= DATE_SUB(NOW(), INTERVAL 1 DAY)
                `);
                if(quickRide.affectedRows > 0) console.log(`[CRON] Auto-completed ${quickRide.affectedRows} passed point-to-point old quick rides.`);

            } catch (err) {
                console.error('[CRON] Query Error: ', err);
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('[CRON] Pool Connection Error: ', error);
        }
    });
};

module.exports = initCronJobs;
