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
                    CONCAT(u.first_name, ' ', u.last_name) as guest_name,
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
                    CONCAT(u.first_name, ' ', u.last_name) as guest_name,
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
                    CONCAT(u.first_name, ' ', u.last_name) as guest_name,
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
                    CONCAT(u.first_name, ' ', u.last_name) as guest_name,
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
        let sql = `SELECT user_id, CONCAT(first_name, ' ', last_name) as name, email, role, created_at FROM Users WHERE role != 'admin'`;
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

exports.getUserHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate, type } = req.query;

        // Fetch user role first
        const [[user]] = await db.query('SELECT role FROM Users WHERE user_id = ?', [userId]);
        if (!user) return res.status(404).json({ error: 'User not found' });

        let queries = [];
        let params = [];

        const dateFilter = (dateField) => {
            if (startDate && endDate) return `AND ${dateField} BETWEEN ? AND ?`;
            if (startDate) return `AND ${dateField} >= ?`;
            if (endDate) return `AND ${dateField} <= ?`;
            return '';
        };

        const addDateParams = (p) => {
            if (startDate && endDate) p.push(startDate, endDate);
            else if (startDate) p.push(startDate);
            else if (endDate) p.push(endDate);
        }

        if (user.role === 'guest') {
            // --- Room Bookings ---
            if (!type || type === 'All' || type === 'Room') {
                queries.push(`
                    SELECT 
                        'Room' as type, rb.rb_id as id,
                        CONCAT('Room ', r.room_number, ' (', r.room_type, ')') as details,
                        rb.rb_checkin as date, rb.rb_status as status, p.payment_amount as amount
                    FROM roombooking rb
                    JOIN Guest g ON rb.guest_id = g.guest_id
                    JOIN Room r ON rb.room_id = r.room_id
                    LEFT JOIN payment p ON rb.rb_payment_id = p.payment_id
                    WHERE g.user_id = ? ${dateFilter('rb.rb_checkin')}
                `);
                params.push(userId);
                addDateParams(params);
            }

            // --- Activity Bookings ---
            if (!type || type === 'All' || type === 'Activity') {
                queries.push(`
                    SELECT 
                        'Activity' as type, ab.ab_id as id, a.activity_name as details,
                        ab.ab_start_time as date, ab.ab_status as status, p.payment_amount as amount
                    FROM activitybooking ab
                    JOIN Guest g ON ab.guest_id = g.guest_id
                    JOIN Activity a ON ab.activity_id = a.activity_id
                    LEFT JOIN payment p ON ab.ab_payment_id = p.payment_id
                    WHERE g.user_id = ? ${dateFilter('ab.ab_start_time')}
                `);
                params.push(userId);
                addDateParams(params);
            }

            // --- Vehicle Bookings ---
            if (!type || type === 'All' || type === 'Vehicle') {
                queries.push(`
                    SELECT 
                        'Vehicle' as type, vb.vb_id as id,
                        CONCAT(v.vehicle_type, ' - ', v.vehicle_number) as details,
                        vb.vb_date as date, vb.vb_status as status, p.payment_amount as amount
                FROM vehiclebooking vb
                JOIN Guest g ON vb.guest_id = g.guest_id
                JOIN Vehicle v ON vb.vehicle_id = v.vehicle_id
                LEFT JOIN payment p ON vb.vb_payment_id = p.payment_id
                    WHERE g.user_id = ? ${dateFilter('vb.vb_date')}
                `);
                params.push(userId);
                addDateParams(params);
            }

            // --- Food Orders ---
            if (!type || type === 'All' || type === 'Food') {
                queries.push(`
                    SELECT 
                        'Food' as type, fo.order_id as id,
                        CONCAT('Dining: ', fo.dining_option) as details,
                        fo.created_at as date, fo.order_status as status, p.payment_amount as amount
                FROM foodorder fo
                JOIN Guest g ON fo.guest_id = g.guest_id
                LEFT JOIN payment p ON fo.payment_id = p.payment_id
                    WHERE g.user_id = ? ${dateFilter('fo.created_at')}
                `);
                params.push(userId);
                addDateParams(params);
            }
        } else if (user.role === 'driver') {
            // History of vehicle bookings assigned to this driver
            queries.push(`
                SELECT 
                    'Vehicle Assignment' as type, vb.vb_id as id,
                    CONCAT(v.vehicle_type, ' - ', v.vehicle_number, ' (Guest: ', u.first_name, ' ', u.last_name, ')') as details,
                    vb.vb_date as date, vb.vb_status as status, p.payment_amount as amount
                FROM vehiclebooking vb
                JOIN Vehicle v ON vb.vehicle_id = v.vehicle_id
                JOIN Guest g ON vb.guest_id = g.guest_id
                JOIN Users u ON g.user_id = u.user_id
                JOIN driver d ON vb.driver_id = d.driver_id
                LEFT JOIN payment p ON vb.vb_payment_id = p.payment_id
                WHERE d.user_id = ? ${dateFilter('vb.vb_date')}
            `);
            params.push(userId);
            addDateParams(params);
        } else if (user.role === 'chef') {
            // History of food orders assigned to this chef
            queries.push(`
                SELECT 
                    'Food Order Assignment' as type, fo.order_id as id,
                    CONCAT(fo.meal_type, ' - ', fo.dining_option, ' (Guest: ', u.first_name, ' ', u.last_name, ')') as details,
                    fo.created_at as date, fo.order_status as status, p.payment_amount as amount
                FROM foodorder fo
                JOIN Guest g ON fo.guest_id = g.guest_id
                JOIN Users u ON g.user_id = u.user_id
                LEFT JOIN payment p ON fo.payment_id = p.payment_id
                WHERE fo.assigned_chef_id = ? ${dateFilter('fo.created_at')}
            `);
            params.push(userId);
            addDateParams(params);
        }

        if (queries.length === 0) {
            return res.json([]);
        }

        const finalQuery = queries.join(' UNION ALL ') + ' ORDER BY date DESC';
        const [results] = await db.query(finalQuery, params);
        res.json(results);

    } catch (error) {
        console.error('User History Error:', error);
        res.status(500).json({ error: 'Failed to fetch user history' });
    }
};
