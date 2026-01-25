const db = require('../config/db');

async function checkColumn() {
    try {
        console.log("Checking schema...");
        const [columns] = await db.query("SHOW COLUMNS FROM foodorder LIKE 'dining_option'");
        if (columns.length > 0) {
            console.log("SUCCESS: Column 'dining_option' exists in 'foodorder' table.");
            console.log("Type:", columns[0].Type);
        } else {
            console.error("FAIL: Column 'dining_option' MISSING in 'foodorder' table.");
        }
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkColumn();
