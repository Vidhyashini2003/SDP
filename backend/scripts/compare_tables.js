const db = require('../config/db');

async function compareTables() {
    try {
        console.log("--- FoodOrder Columns ---");
        const [foCols] = await db.query("SHOW COLUMNS FROM foodorder");
        foCols.forEach(c => console.log(c.Field));

        console.log("\n--- OrderItem Columns ---");
        const [oiCols] = await db.query("SHOW COLUMNS FROM orderitem");
        oiCols.forEach(c => console.log(c.Field));

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

compareTables();
