const db = require('../config/db');

async function migrateDiningOption() {
    try {
        console.log("--- Adding dining_option column ---");

        // Check if column exists
        const [columns] = await db.query("SHOW COLUMNS FROM foodorder LIKE 'dining_option'");
        if (columns.length > 0) {
            console.log("Column 'dining_option' already exists.");
            process.exit(0);
        }

        // Add column
        await db.query("ALTER TABLE foodorder ADD COLUMN dining_option ENUM('Dine-in', 'Delivery') DEFAULT 'Delivery'");
        console.log("Column 'dining_option' added successfully.");

        process.exit(0);
    } catch (error) {
        console.error("Migration Error:", error);
        process.exit(1);
    }
}

migrateDiningOption();
