const db = require('../config/db');

exports.getBookingReport = async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query; 

        const dateFilter = (dateField) => {
            if (startDate && endDate) return `AND ${dateField} BETWEEN ? AND ?`;
            if (startDate) return `AND ${dateField} >= ?`;
            if (endDate) return `AND ${dateField} <= ?`;
            return '';
        };

        const addParams = () => {
            let p = [];
            if (startDate && endDate) p.push(startDate, endDate);
            else if (startDate) p.push(startDate);
            else if (endDate) p.push(endDate);
            return p;
        }
        
        let params = addParams();

        let sql = `
            SELECT 
                rb.rb_id as id,
                CONCAT(u.first_name, ' ', u.last_name) as guest_name,
                CONCAT('Room ', r.room_number, ' (', r.room_type, ')') as service_details,
                rb.rb_checkin as booking_date,
                rb.rb_checkout as checkout_date,
                rb.rb_status as status,
                p.payment_amount as amount,
                p.payment_status as payment_status
            FROM roombooking rb
            JOIN Guest g ON rb.guest_id = g.guest_id
            JOIN Users u ON g.user_id = u.user_id
            JOIN Room r ON rb.room_id = r.room_id
            LEFT JOIN payment p ON rb.rb_payment_id = p.payment_id
            WHERE 1=1 ${dateFilter('rb.rb_checkin')}
            ORDER BY rb.rb_checkin DESC
        `;

        const [rooms] = await db.query(sql, params);

        if (rooms.length === 0) {
            return res.json([]);
        }

        const rbIds = rooms.map(r => r.id);

        let activities = [];
        let foodOrders = [];
        let vehicles = [];

        if (!type || type === 'All' || type === 'Activity') {
            [activities] = await db.query(`
                SELECT 
                    ab.rb_id,
                    ab.ab_id as id,
                    a.activity_name as details,
                    ab.ab_start_time as date,
                    ab.ab_status as status,
                    p.payment_amount as amount
                FROM activitybooking ab
                JOIN Activity a ON ab.activity_id = a.activity_id
                LEFT JOIN payment p ON ab.ab_payment_id = p.payment_id
                WHERE ab.rb_id IN (?)
            `, [rbIds]);
        }

        if (!type || type === 'All' || type === 'Food') {
            [foodOrders] = await db.query(`
                SELECT 
                    fo.rb_id,
                    fo.order_id as id,
                    CONCAT('Dining: ', fo.dining_option) as details,
                    fo.created_at as date,
                    fo.order_status as status,
                    p.payment_amount as amount
                FROM foodorder fo
                LEFT JOIN payment p ON fo.payment_id = p.payment_id
                WHERE fo.rb_id IN (?)
            `, [rbIds]);
        }

        if (!type || type === 'All' || type === 'Vehicle') {
            [vehicles] = await db.query(`
                SELECT 
                    vb.rb_id,
                    vb.vb_id as id,
                    CONCAT(v.vehicle_type, ' - ', v.vehicle_number) as details,
                    vb.vb_date as date,
                    vb.vb_status as status,
                    p.payment_amount as amount
                FROM hirevehicle vb
                JOIN Vehicle v ON vb.vehicle_id = v.vehicle_id
                LEFT JOIN payment p ON vb.vb_payment_id = p.payment_id
                WHERE vb.rb_id IN (?)
            `, [rbIds]);
        }

        for (const room of rooms) {
            room.type = 'Room';
            room.activities = activities.filter(a => a.rb_id === room.id).map(a => ({...a, type: 'Activity'}));
            room.food = foodOrders.filter(f => f.rb_id === room.id).map(f => ({...f, type: 'Food'}));
            room.vehicles = vehicles.filter(v => v.rb_id === room.id).map(v => ({...v, type: 'Vehicle'}));
        }

        let finalRooms = rooms;
        if (type === 'Activity') {
            finalRooms = rooms.filter(r => r.activities.length > 0);
        } else if (type === 'Food') {
            finalRooms = rooms.filter(r => r.food.length > 0);
        } else if (type === 'Vehicle') {
            finalRooms = rooms.filter(r => r.vehicles.length > 0);
        }

        res.json(finalRooms);

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
                FROM hirevehicle vb
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
                FROM hirevehicle vb
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
