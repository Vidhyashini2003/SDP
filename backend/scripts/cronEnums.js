require('dotenv').config({ path: '../.env' });
const db = require('../config/db');

async function checkSchema() {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query("SHOW COLUMNS FROM activitybooking LIKE 'ab_status'");
        console.log('activitybooking', rows[0].Type);

        const [rows2] = await connection.query("SHOW COLUMNS FROM foodorder LIKE 'order_status'");
        console.log('foodorder', rows2[0].Type);

        const [rows3] = await connection.query("SHOW COLUMNS FROM hirevehicle LIKE 'vb_status'");
        console.log('hirevehicle', rows3[0].Type);
        
        const [rows4] = await connection.query("SHOW COLUMNS FROM roombooking LIKE 'rb_status'");
        console.log('roombooking', rows4[0].Type);

    } catch (e) {
        console.error(e);
    } finally {
        connection.release();
        process.exit();
    }
}
checkSchema();
