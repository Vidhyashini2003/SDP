const db = require('../config/db');

async function checkPaymentStatus() {
    try {
        const [rows] = await db.query('SELECT transport_id, status, payment_status FROM hire_vehicle_for_arrival WHERE transport_id = 7');
        console.log(rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkPaymentStatus();
