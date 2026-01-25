const db = require('../config/db');

async function checkColumn() {
    try {
        const [columns] = await db.query("SHOW COLUMNS FROM foodorder LIKE 'dining_option'");
        if (columns.length > 0) {
            console.log("Column Type:", columns[0].Type);
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkColumn();
