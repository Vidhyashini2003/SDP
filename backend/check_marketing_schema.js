
const db = require('./config/db');

async function checkSchema() {
    try {
        const connection = await db.getConnection();
        const [v_rows] = await connection.query('DESCRIBE Vehicle');
        const [vb_rows] = await connection.query('DESCRIBE VehicleBooking');
        const [r_rows] = await connection.query('DESCRIBE Refund');

        console.log('--- Vehicle ---');
        console.table(v_rows);
        console.log('--- VehicleBooking ---');
        console.table(vb_rows);
        console.log('--- Refund ---');
        console.table(r_rows);

        connection.release();
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkSchema();
