require('dotenv').config({ path: '../.env' });
const db = require('../config/db');

async function execSQL() {
    const connection = await db.getConnection();
    try {
        await connection.query("ALTER TABLE foodorder MODIFY order_status ENUM('Pending','Preparing','Prepared','Delivered','Cancelled','Incomplete') DEFAULT 'Pending'");
        await connection.query("ALTER TABLE roombooking MODIFY rb_status ENUM('Booked','Checked-in','Checked-out','Cancelled','Completed') DEFAULT 'Booked'");
        console.log('SQL Executed successfully');
    } catch (e) {
        console.error(e);
    } finally {
        connection.release();
        process.exit();
    }
}
execSQL();
