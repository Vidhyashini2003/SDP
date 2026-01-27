const db = require('../config/db');

exports.getBookingReport = async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query; // type: 'All', 'Room', 'Activity', 'Vehicle'

        let queries = [];
        let params = [];

        // Base/Common columns we want (normalized)
        // Type, ID, GuestName, ServiceDetails, Date, Status, Amount, PaymentStatus

        const dateFilter = (dateField) => {
            if (startDate && endDate) return `AND ${dateField} BETWEEN ? AND ?`;
            if (startDate) return `AND ${dateField} >= ?`;
            if (endDate) return `AND ${dateField} <= ?`;
            return '';
        };

        const addParams = () => {
            if (startDate && endDate) params.push(startDate, endDate);
            else if (startDate) params.push(startDate);
            else if (endDate) params.push(endDate);
        }

        // --- Room Bookings ---
        if (type === 'All' || type === 'Room') {
            let sql = `
                SELECT 
                    'Room' as type,
                    rb.rb_id as id,
                    u.name as guest_name,
                    CONCAT('Room ', r.room_number, ' (', r.room_type, ')') as service_details,
                    rb.rb_checkin as booking_date,
                    rb.rb_status as status,
                    p.payment_amount as amount,
                    p.payment_status as payment_status
                FROM roombooking rb
                JOIN Guest g ON rb.guest_id = g.guest_id
                JOIN Users u ON g.user_id = u.user_id
                JOIN Room r ON rb.room_id = r.room_id
                LEFT JOIN payment p ON rb.rb_payment_id = p.payment_id
                WHERE 1=1 ${dateFilter('rb.rb_checkin')}
            `;
            queries.push(sql);
            addParams();
        }

        // --- Activity Bookings ---
        if (type === 'All' || type === 'Activity') {
            let sql = `
                SELECT 
                    'Activity' as type,
                    ab.ab_id as id,
                    u.name as guest_name,
                    a.activity_name as service_details,
                    ab.ab_start_time as booking_date,
                    ab.ab_status as status,
                    p.payment_amount as amount,
                    p.payment_status as payment_status
                FROM activitybooking ab
                JOIN Guest g ON ab.guest_id = g.guest_id
                JOIN Users u ON g.user_id = u.user_id
                JOIN Activity a ON ab.activity_id = a.activity_id
                LEFT JOIN payment p ON ab.ab_payment_id = p.payment_id
                WHERE 1=1 ${dateFilter('ab.ab_start_time')}
            `;
            queries.push(sql);
            addParams();
        }

        // --- Vehicle Bookings ---
        if (type === 'All' || type === 'Vehicle') {
            let sql = `
                SELECT 
                    'Vehicle' as type,
                    vb.vb_id as id,
                    u.name as guest_name,
                    CONCAT(v.vehicle_type, ' - ', v.vehicle_number) as service_details,
                    vb.vb_date as booking_date,
                    vb.vb_status as status,
                    p.payment_amount as amount,
                    p.payment_status as payment_status
                FROM vehiclebooking vb
                JOIN Guest g ON vb.guest_id = g.guest_id
                JOIN Users u ON g.user_id = u.user_id
                JOIN Vehicle v ON vb.vehicle_id = v.vehicle_id
                LEFT JOIN payment p ON vb.vb_payment_id = p.payment_id
                WHERE 1=1 ${dateFilter('vb.vb_date')}
            `;
            queries.push(sql);
            addParams();
        }

        // --- Food Orders ---
        if (type === 'All' || type === 'Food') {
            let sql = `
                SELECT 
                    'Food' as type,
                    fo.order_id as id,
                    u.name as guest_name,
                    CONCAT('Dining: ', fo.dining_option) as service_details,
                    fo.created_at as booking_date,
                    fo.order_status as status,
                    p.payment_amount as amount,
                    p.payment_status as payment_status
                FROM foodorder fo
                JOIN Guest g ON fo.guest_id = g.guest_id
                JOIN Users u ON g.user_id = u.user_id
                LEFT JOIN payment p ON fo.payment_id = p.payment_id
                WHERE 1=1 ${dateFilter('fo.created_at')}
            `;
            queries.push(sql);
            addParams();
        }

        if (queries.length === 0) {
            return res.json([]);
        }

        const finalQuery = queries.join(' UNION ALL ') + ' ORDER BY booking_date DESC';

        // Flatten params array if we did Union
        // Note: For UNION ALL, we need params for EACH query part concatenated.
        // My addParams() pushes to the same 'params' array sequentially, so it matches the order of queries.

        const [results] = await db.query(finalQuery, params);
        res.json(results);

    } catch (error) {
        console.error('Report Error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
};

exports.getUserReport = async (req, res) => {
    try {
        const { role } = req.query;
        let sql = `SELECT user_id, name, email, role, created_at FROM Users WHERE 1=1`;
        let params = [];

        if (role && role !== 'All') {
            sql += ` AND role = ?`;
            params.push(role);
        }

        sql += ` ORDER BY created_at DESC`;

        const [users] = await db.query(sql, params);
        res.json(users);
    } catch (error) {
        console.error('User Report Error:', error);
        res.status(500).json({ error: 'Failed to generate user report' });
    }
};
