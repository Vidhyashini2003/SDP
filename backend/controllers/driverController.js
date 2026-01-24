const db = require('../config/db');

exports.getAssignedTrips = async (req, res) => {
    try {
        const driverId = req.user.id;
        const [trips] = await db.query(
            `SELECT vb.*, g.guest_name, g.guest_phone, v.vehicle_number, v.vehicle_type
         FROM VehicleBooking vb
         JOIN Guest g ON vb.guest_id = g.guest_id
         JOIN Vehicle v ON vb.vehicle_id = v.vehicle_id
         WHERE vb.driver_id = ? AND vb.vb_status != 'Cancelled'
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
    try {
        const { id } = req.params;
        const { status } = req.body; // 'In Progress', 'Completed'

        await db.query('UPDATE VehicleBooking SET vb_status = ? WHERE vb_id = ? AND driver_id = ?', [status, id, req.user.id]);
        res.json({ message: 'Trip status updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update trip' });
    }
};

exports.updateVehicleStatus = async (req, res) => {
    try {
        // Driver can update status of their assigned vehicle?
        // Or any vehicle? Let's assume they update the vehicle they are driving in the trip or assigned vehicle
        // Simple: Update ANY vehicle status if valid driver
        const { vehicle_id, status } = req.body; // 'Available', 'In Use', 'Maintenance'

        await db.query('UPDATE Vehicle SET vehicle_status = ? WHERE vehicle_id = ?', [status, vehicle_id]);
        res.json({ message: 'Vehicle status updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update vehicle status' });
    }
}
