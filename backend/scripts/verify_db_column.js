const db = require('../config/db');

async function checkColumn() {
    try {
        const [columns] = await db.query("SHOW COLUMNS FROM foodorder LIKE 'dining_option'");
        if (columns.length > 0) {
            console.log("Column 'dining_option' EXISTS.");
            console.log(columns[0]);
        } else {
            console.log("Column 'dining_option' DOES NOT EXIST.");
        }
        process.exit(0);
    } catch (error) {
        console.error("Error checking column:", error);
        process.exit(1);
    }
}

checkColumn();
