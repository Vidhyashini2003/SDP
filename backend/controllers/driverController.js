
const db = require('../config/db');
const notificationController = require('./notificationController');

exports.getAssignedTrips = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Fetch regular hire vehicle trips
        const [hireTrips] = await db.query(
            `SELECT vb.*, 'hire' as type, CONCAT(u.first_name, ' ', u.last_name) as guest_name, g.guest_phone, v.vehicle_number, v.vehicle_type
             FROM hirevehicle vb
             JOIN Driver d ON vb.driver_id = d.driver_id
             JOIN Guest g ON vb.guest_id = g.guest_id
             JOIN Users u ON g.user_id = u.user_id
             JOIN vehicle v ON vb.vehicle_id = v.vehicle_id
             WHERE d.user_id = ? AND vb.vb_status IN ('Confirmed', 'In Progress', 'Completed')
             ORDER BY vb.vb_date ASC`,
            [userId]
        );

        // 2. Fetch arrival transfer trips
        const [arrivalTrips] = await db.query(
            `SELECT ha.transport_id as vb_id, 'arrival' as type, ha.scheduled_at as vb_date, 1 as vb_days,
                    ha.status as ha_status, 
                    ha.payment_status,
                    CONCAT(u.first_name, ' ', u.last_name) as guest_name, g.guest_phone, v.vehicle_number, ha.vehicle_type_requested as vehicle_type,
                    ha.vehicle_id
             FROM hire_vehicle_for_arrival ha
             JOIN Driver d ON ha.driver_id = d.driver_id
             JOIN Guest g ON ha.guest_id = g.guest_id
             JOIN Users u ON g.user_id = u.user_id
             LEFT JOIN vehicle v ON ha.vehicle_id = v.vehicle_id
             WHERE d.user_id = ? AND ha.payment_status = 'Paid' AND ha.status IN ('Accepted', 'Arrived', 'In Progress', 'Completed')
             ORDER BY ha.scheduled_at ASC`,
            [userId]
        );

        // Standardize status for UI compatibility
        const normalizedArrivals = arrivalTrips.map(ha => ({
            ...ha,
            vb_status: ha.ha_status === 'Accepted' ? 'Booked' : ha.ha_status,
            isArrival: true
        }));

        // 3. Fetch Quick Ride trips (Accepted or In Progress)
        const [quickRideTrips] = await db.query(
            `SELECT qr.quickride_id as vb_id, 'quickride' as type, qr.created_date as vb_date, 1 as vb_days,
                    qr.status as ha_status, qr.payment_status,
                    CONCAT(u.first_name, ' ', u.last_name) as guest_name, g.guest_phone,
                    v.vehicle_number, qr.vehicle_type as vehicle_type,
                    NULL as pickup_location, qr.actual_km, qr.waiting_time_hrs as waiting_hours,
                    qr.final_amount as total_amount, qr.per_km_rate as price_per_km, NULL as waiting_price_per_hour
             FROM quickride qr
             JOIN Driver d ON qr.driver_id = d.driver_id
             JOIN Guest g ON qr.guest_id = g.guest_id
             JOIN Users u ON g.user_id = u.user_id
             LEFT JOIN vehicle v ON qr.vehicle_id = v.vehicle_id
             WHERE d.user_id = ? AND qr.status IN ('Accepted', 'In Progress', 'Completed')
             ORDER BY qr.created_date DESC`,
            [userId]
        );

        const normalizedQuickRides = quickRideTrips.map(qr => ({
            ...qr,
            vb_status: qr.ha_status,
            isQuickRide: true
        }));

        const allTrips = [...hireTrips, ...normalizedArrivals, ...normalizedQuickRides]
            .sort((a, b) => new Date(b.vb_date) - new Date(a.vb_date));
        res.json(allTrips);
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ error: 'Failed to fetch trips' });
    }
};

exports.getHireRequests = async (req, res) => {
    try {
        // Fetch pending regular hire requests (driver_id is null)
        const [hireRequests] = await db.query(
            `SELECT vb.vb_id as id, 'hire' as request_type, vb.vb_date as date, vb.vb_days as duration, vb.vb_status as status, CONCAT(u.first_name, ' ', u.last_name) as guest_name, v.vehicle_type, v.vehicle_number, v.vehicle_price_per_day as price_per_day
             FROM hirevehicle vb
             JOIN Guest g ON vb.guest_id = g.guest_id
             JOIN Users u ON g.user_id = u.user_id
             JOIN vehicle v ON vb.vehicle_id = v.vehicle_id
             LEFT JOIN roombooking rb ON vb.rb_id = rb.rb_id
             WHERE vb.vb_status = 'Pending Approval' AND vb.driver_id IS NULL
               AND (vb.rb_id IS NULL OR rb.rb_status != 'Cancelled')
             ORDER BY vb.vb_date ASC`
        );
        
        // Fetch pending arrival transfer requests
        const [arrivalRequests] = await db.query(
            `SELECT ha.transport_id as id, 'arrival' as request_type, ha.scheduled_at as date, NULL as duration, ha.status, CONCAT(u.first_name, ' ', u.last_name) as guest_name, ha.vehicle_type_requested as vehicle_type, NULL as vehicle_number, ha.final_amount as price_per_day, ha.pickup_location
             FROM hire_vehicle_for_arrival ha
             JOIN Guest g ON ha.guest_id = g.guest_id
             JOIN Users u ON g.user_id = u.user_id
             WHERE ha.status = 'Pending' AND ha.driver_id IS NULL
             ORDER BY ha.scheduled_at ASC`
        );

        // Fetch pending quick ride requests
        const [quickRideRequests] = await db.query(
            `SELECT qr.quickride_id as id, 'quickride' as request_type, qr.created_date as date, NULL as duration,
                    qr.status, CONCAT(u.first_name, ' ', u.last_name) as guest_name,
                    qr.vehicle_type as vehicle_type, v.vehicle_number,
                    NULL as pickup_location
             FROM quickride qr
             JOIN Guest g ON qr.guest_id = g.guest_id
             JOIN Users u ON g.user_id = u.user_id
             LEFT JOIN vehicle v ON qr.vehicle_id = v.vehicle_id
             WHERE qr.status = 'Requested' AND qr.driver_id IS NULL
             ORDER BY qr.created_date ASC`
        );

        const unifiedRequests = [...hireRequests, ...arrivalRequests, ...quickRideRequests]
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        res.json(unifiedRequests);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
};

exports.acceptHireRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query; // 'hire', 'arrival', or 'quickride'
        const driverId = req.user.id;

        if (!type) return res.status(400).json({ error: 'Request type is required' });

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [driver] = await connection.query("SELECT driver_id FROM Driver WHERE user_id = ?", [driverId]);
            if (driver.length === 0) return res.status(403).json({ error: 'Not a driver' });
            const realDriverId = driver[0].driver_id;

            if (type === 'hire') {
                const [booking] = await connection.query("SELECT vb_status FROM hirevehicle WHERE vb_id = ? FOR UPDATE", [id]);
                if (booking.length === 0 || booking[0].vb_status !== 'Pending Approval') {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Request no longer available' });
                }

                await connection.query(
                    "UPDATE hirevehicle SET driver_id = ?, vb_status = 'Pending Payment' WHERE vb_id = ?",
                    [realDriverId, id]
                );

                const [guestInfo] = await connection.query(
                    `SELECT g.user_id, v.vehicle_type 
                     FROM hirevehicle vb
                     JOIN Guest g ON vb.guest_id = g.guest_id
                     JOIN vehicle v ON vb.vehicle_id = v.vehicle_id
                     WHERE vb.vb_id = ?`,
                    [id]
                );

                if (guestInfo.length > 0) {
                    await notificationController.createNotification(
                        guestInfo[0].user_id,
                        'Hire Request Accepted',
                        `Your ${guestInfo[0].vehicle_type} hire request has been accepted by a driver. Please proceed to payment to confirm your trip.`,
                        'Booking',
                        '/guest/my-bookings'
                    );
                }
            } else if (type === 'arrival') {
                const [booking] = await connection.query(
                    "SELECT status, vehicle_type_requested FROM hire_vehicle_for_arrival WHERE transport_id = ? FOR UPDATE", 
                    [id]
                );
                if (booking.length === 0 || booking[0].status !== 'Pending') {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Request no longer available' });
                }

                // Find an available vehicle of the requested type
                const [availableVehicles] = await connection.query(
                    "SELECT vehicle_id FROM vehicle WHERE vehicle_type = ? AND vehicle_status = 'Available' LIMIT 1",
                    [booking[0].vehicle_type_requested]
                );

                const assignedVehicleId = availableVehicles.length > 0 ? availableVehicles[0].vehicle_id : null;
                
                // Update transport with driver and assigned vehicle
                await connection.query(
                    "UPDATE hire_vehicle_for_arrival SET driver_id = ?, vehicle_id = ?, status = 'Accepted' WHERE transport_id = ?",
                    [realDriverId, assignedVehicleId, id]
                );

                const [guestInfo] = await connection.query(
                    `SELECT g.user_id, ha.vehicle_type_requested 
                     FROM hire_vehicle_for_arrival ha
                     JOIN Guest g ON ha.guest_id = g.guest_id
                     WHERE ha.transport_id = ?`,
                    [id]
                );

                if (guestInfo.length > 0) {
                    await notificationController.createNotification(
                        guestInfo[0].user_id,
                        'Arrival Transfer Accepted',
                        `Your arrival transfer request for a ${guestInfo[0].vehicle_type_requested || 'vehicle'} has been accepted by a driver.`,
                        'Booking',
                        '/guest/my-bookings'
                    );
                }
            } else if (type === 'quickride') {
                const [booking] = await connection.query(
                    "SELECT status, vehicle_type FROM quickride WHERE quickride_id = ? FOR UPDATE",
                    [id]
                );
                if (booking.length === 0 || booking[0].status !== 'Requested') {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Request no longer available' });
                }

                await connection.query(
                    "UPDATE quickride SET driver_id = ?, status = 'Accepted' WHERE quickride_id = ?",
                    [realDriverId, id]
                );

                const [guestInfo] = await connection.query(
                    `SELECT g.user_id, qr.vehicle_type 
                     FROM quickride qr
                     JOIN Guest g ON qr.guest_id = g.guest_id
                     WHERE qr.quickride_id = ?`,
                    [id]
                );

                if (guestInfo.length > 0) {
                    await notificationController.createNotification(
                        guestInfo[0].user_id,
                        'Quick Ride Accepted',
                        `Your Quick Ride request for a ${guestInfo[0].vehicle_type || 'vehicle'} has been accepted by a driver. They are on the way!`,
                        'Booking',
                        '/guest/my-bookings'
                    );
                }
            }

            await connection.commit();
            res.json({ message: 'Request accepted successfully.' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error accepting request:', error);
        res.status(500).json({ error: 'Failed to accept request' });
    }
};

exports.updateTripStatus = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        const { status } = req.body; // 'In Progress', 'Completed'
        const { type } = req.query; // 'hire' or 'arrival'
        const driverId = req.user.id;

        if (!type) return res.status(400).json({ error: 'Trip type is required' });

        await connection.beginTransaction();

        let vehicleId = null;

        // 1. Get the booking to find the vehicle
        if (type === 'hire') {
            const [booking] = await connection.query(
                'SELECT vehicle_id FROM hirevehicle WHERE vb_id = ? AND driver_id = (SELECT driver_id FROM Driver WHERE user_id = ?)',
                [id, driverId]
            );
            if (booking.length > 0) vehicleId = booking[0].vehicle_id;
            
            await connection.query('UPDATE hirevehicle SET vb_status = ? WHERE vb_id = ?', [status, id]);
        } else if (type === 'quickride') {
            const [booking] = await connection.query(
                'SELECT vehicle_id FROM quickride WHERE quickride_id = ? AND driver_id = (SELECT driver_id FROM Driver WHERE user_id = ?)',
                [id, driverId]
            );
            if (booking.length > 0) vehicleId = booking[0].vehicle_id;
            // For quickride: only 'In Progress' is set here. 'Completed' is set via setQuickRideAmount.
            await connection.query('UPDATE quickride SET status = ? WHERE quickride_id = ?', [status, id]);
        } else {
            const [booking] = await connection.query(
                'SELECT vehicle_id FROM hire_vehicle_for_arrival WHERE transport_id = ? AND driver_id = (SELECT driver_id FROM Driver WHERE user_id = ?)',
                [id, driverId]
            );
            if (booking.length > 0) vehicleId = booking[0].vehicle_id;
            
            const haStatus = status; 
            await connection.query('UPDATE hire_vehicle_for_arrival SET status = ? WHERE transport_id = ?', [haStatus, id]);
        }

        // 3. Update Vehicle Status based on Trip Status
        let vehicleStatus = null;
        if (status === 'In Progress') vehicleStatus = 'In Use';
        else if (status === 'Completed') vehicleStatus = 'Available';

        if (vehicleStatus && vehicleId) {
            await connection.query(
                'UPDATE vehicle SET vehicle_status = ? WHERE vehicle_id = ?',
                [vehicleStatus, vehicleId]
            );
        }

        await connection.commit();
        res.json({ message: `Trip marked as ${status}` });

    } catch (error) {
        await connection.rollback();
        console.error('Error updating trip:', error);
        res.status(500).json({ error: 'Failed to update trip' });
    } finally {
        connection.release();
    }
};

exports.updateVehicleStatus = async (req, res) => {
    try {
        const { vehicle_id, status } = req.body;
        await db.query('UPDATE vehicle SET vehicle_status = ? WHERE vehicle_id = ?', [status, vehicle_id]);
        res.json({ message: 'Vehicle status updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update vehicle status' });
    }
}

exports.getRefundRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch driver_id
        const [drivers] = await db.query("SELECT driver_id FROM Driver WHERE user_id = ?", [userId]);
        if (drivers.length === 0) return res.status(403).json({ error: 'Not a driver' });
        const driverId = drivers[0].driver_id;

        // 1. Refunds for regular hire vehicle trips
        const [hireRefunds] = await db.query(
            `SELECT r.*, p.payment_amount, 'Vehicle Hire' as trip_type, hv.vb_id as trip_id, CONCAT(u.first_name, ' ', u.last_name) as guest_name
             FROM refund r
             JOIN payment p ON r.payment_id = p.payment_id
             JOIN hirevehicle hv ON p.payment_id = hv.vb_payment_id
             JOIN Guest g ON hv.guest_id = g.guest_id
             JOIN Users u ON g.user_id = u.user_id
             WHERE hv.driver_id = ?
             ORDER BY r.refund_date DESC`,
            [driverId]
        );

        // 2. Refunds for arrival transfer trips
        const [arrivalRefunds] = await db.query(
            `SELECT r.*, p.payment_amount, 'Arrival Transfer' as trip_type, ha.transport_id as trip_id, CONCAT(u.first_name, ' ', u.last_name) as guest_name
             FROM refund r
             JOIN payment p ON r.payment_id = p.payment_id
             JOIN hire_vehicle_for_arrival ha ON p.payment_id = ha.ha_payment_id
             JOIN Guest g ON ha.guest_id = g.guest_id
             JOIN Users u ON g.user_id = u.user_id
             WHERE ha.driver_id = ?
             ORDER BY r.refund_date DESC`,
            [driverId]
        );

        const allRefunds = [...hireRefunds, ...arrivalRefunds].sort((a, b) => new Date(b.refund_date) - new Date(a.refund_date));
        res.json(allRefunds);
    } catch (error) {
        console.error('Error fetching refund requests:', error);
        res.status(500).json({ error: 'Failed to fetch refund requests' });
    }
};

exports.processRefundRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if user is a driver
        const [drivers] = await db.query("SELECT driver_id FROM Driver WHERE user_id = ?", [userId]);
        if (drivers.length === 0) return res.status(403).json({ error: 'Not a driver' });

        // Update refund status
        const [result] = await db.query(
            "UPDATE refund SET refund_status = 'Processed' WHERE refund_id = ? AND refund_status = 'Pending'",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ error: 'Refund request not found or already processed' });
        }

        res.json({ message: 'Refund marked as processed successfully' });

    } catch (error) {
        console.error('Error processing refund:', error);
        res.status(500).json({ error: 'Failed to process refund request' });
    }
};
