const db = require('../config/db');

async function debugOrders() {
    try {
        console.log("--- Debugging Order Data ---");

        // Check Order 2
        console.log("\nChecking Order 2:");
        const [order2] = await db.query("SELECT * FROM foodorder WHERE order_id = 2");
        console.log("Order 2 (foodorder):", order2);
        const [items2] = await db.query("SELECT * FROM orderitem WHERE order_id = 2");
        console.log("Order 2 Items (orderitem):", items2);

        // Check Order 3
        console.log("\nChecking Order 3:");
        const [order3] = await db.query("SELECT * FROM foodorder WHERE order_id = 3");
        console.log("Order 3 (foodorder):", order3);
        const [items3] = await db.query("SELECT * FROM orderitem WHERE order_id = 3");
        console.log("Order 3 Items (orderitem):", items3);

        // Check why Order 3 isn't showing in UI (Controller uses JOIN)
        if (order3.length > 0 && items3.length === 0) {
            console.log("\nCONCLUSION: Order 3 exists in foodorder but has NO items in orderitem. The INNER JOIN excludes it.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Debug Error:", error);
        process.exit(1);
    }
}

debugOrders();
