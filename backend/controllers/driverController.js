const db = require('../config/db');

exports.getAssignedTrips = async (req, res) => {
    try {
        const driverId = req.user.id;
        const [trips] = await db.query(
            `SELECT vb.*, u.name as guest_name, u.phone as guest_phone, v.vehicle_number, v.vehicle_type
         FROM vehiclebooking vb
         JOIN Driver d ON vb.driver_id = d.driver_id
         JOIN Guest g ON vb.guest_id = g.guest_id
         JOIN Users u ON g.user_id = u.user_id
         JOIN vehicle v ON vb.vehicle_id = v.vehicle_id
         WHERE d.user_id = ? AND vb.vb_status != 'Cancelled'
         ORDER BY vb.vb_trip_start ASC`,
            [driverId]
        );
        res.json(trips);
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ error: 'Failed to fetch trips' });
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
        // Driver can update status of their assigned vehicle?
        // Or any vehicle? Let's assume they update the vehicle they are driving in the trip or assigned vehicle
        // Simple: Update ANY vehicle status if valid driver
        const { vehicle_id, status } = req.body; // 'Available', 'In Use', 'Maintenance'

        await db.query('UPDATE vehicle SET vehicle_status = ? WHERE vehicle_id = ?', [status, vehicle_id]);
        res.json({ message: 'Vehicle status updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update vehicle status' });
    }
}
