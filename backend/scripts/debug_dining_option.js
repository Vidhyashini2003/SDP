const db = require('../config/db');

async function checkRecentOrders() {
    try {
        console.log("--- Checking Recent Orders ---");
        const [rows] = await db.query(
            "SELECT order_id, order_status, dining_option, created_at FROM foodorder ORDER BY order_id DESC LIMIT 5"
        );
        const fs = require('fs');
        fs.writeFileSync('c:\\SDP\\backend\\scripts\\db_output.json', JSON.stringify(rows, null, 2));
        console.log("Output written to db_output.json");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkRecentOrders();
