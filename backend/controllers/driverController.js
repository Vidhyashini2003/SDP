
const db = require('../config/db');
const notificationController = require('./notificationController');

exports.getAssignedTrips = async (req, res) => {
    try {
        const driverId = req.user.id;
        const [trips] = await db.query(
            `SELECT vb.*, CONCAT(u.first_name, ' ', u.last_name) as guest_name, u.phone as guest_phone, v.vehicle_number, v.vehicle_type
         FROM vehiclebooking vb
         JOIN Driver d ON vb.driver_id = d.driver_id
         JOIN Guest g ON vb.guest_id = g.guest_id
         JOIN Users u ON g.user_id = u.user_id
         JOIN vehicle v ON vb.vehicle_id = v.vehicle_id
         WHERE d.user_id = ? AND vb.vb_status IN ('Confirmed', 'In Progress', 'Completed')
         ORDER BY vb.vb_date ASC`,
            [driverId]
        );
        res.json(trips);
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ error: 'Failed to fetch trips' });
    }
};

exports.getHireRequests = async (req, res) => {
    try {
        // Fetch all pending requests (driver_id is null)
        const [requests] = await db.query(
            `SELECT vb.*, CONCAT(u.first_name, ' ', u.last_name) as guest_name, v.vehicle_type, v.vehicle_number, v.vehicle_price_per_day
             FROM vehiclebooking vb
             JOIN Guest g ON vb.guest_id = g.guest_id
             JOIN Users u ON g.user_id = u.user_id
             JOIN vehicle v ON vb.vehicle_id = v.vehicle_id
             WHERE vb.vb_status = 'Pending Approval' AND vb.driver_id IS NULL
             ORDER BY vb.vb_date ASC`
        );
        res.json(requests);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ error: 'Failed to fetch hire requests' });
    }
};

exports.acceptHireRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const driverId = req.user.id;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [driver] = await connection.query("SELECT driver_id FROM Driver WHERE user_id = ?", [driverId]);
            if (driver.length === 0) return res.status(403).json({ error: 'Not a driver' });
            const realDriverId = driver[0].driver_id;

            // Check if still available
            const [booking] = await connection.query("SELECT vb_status FROM vehiclebooking WHERE vb_id = ? FOR UPDATE", [id]);
            if (booking.length === 0 || booking[0].vb_status !== 'Pending Approval') {
                await connection.rollback();
                return res.status(400).json({ error: 'Request no longer available' });
            }

            await connection.query(
                "UPDATE vehiclebooking SET driver_id = ?, vb_status = 'Pending Payment' WHERE vb_id = ?",
                [realDriverId, id]
            );

            // Notify Guest
            // Fetch guest user_id first
            const [guestInfo] = await connection.query(
                `SELECT g.user_id, v.vehicle_type 
                 FROM vehiclebooking vb
                 JOIN Guest g ON vb.guest_id = g.guest_id
                 JOIN vehicle v ON vb.vehicle_id = v.vehicle_id
                 WHERE vb.vb_id = ?`,
                [id]
            );

            if (guestInfo.length > 0) {
                const guestUserId = guestInfo[0].user_id;
                const vehicleType = guestInfo[0].vehicle_type;
                await notificationController.createNotification(
                    guestUserId,
                    'Hire Request Accepted',
                    `Your ${vehicleType} hire request has been accepted by a driver. Please proceed to payment to confirm your trip.`,
                    'Booking',
                    '/guest/my-bookings'
                );
            }

            await connection.commit();
            res.json({ message: 'Request accepted. Waiting for guest payment.' });
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
        const driverId = req.user.id;

        await connection.beginTransaction();

        // 1. Get the booking to find the vehicle
        const [booking] = await connection.query(
            'SELECT vehicle_id, vb_status FROM vehiclebooking WHERE vb_id = ? AND driver_id = (SELECT driver_id FROM Driver WHERE user_id = ?)',
            [id, driverId]
        );

        if (booking.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Trip not found or unauthorized' });
        }

        const vehicleId = booking[0].vehicle_id;

        // 2. Update Booking Status
        await connection.query(
            'UPDATE vehiclebooking SET vb_status = ? WHERE vb_id = ?',
            [status, id]
        );

        // 3. Update Vehicle Status based on Trip Status
        let vehicleStatus = null;
        if (status === 'In Progress') vehicleStatus = 'In Use';
        else if (status === 'Completed') vehicleStatus = 'Available';

        if (vehicleStatus) {
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
