const db = require('../config/db');

async function fixOrders() {
    try {
        console.log("--- Fixing Order Data ---");

        // Fix Order 2: Set to Delivered and Items to Completed
        // The user said it shows as Delivered in UI (probably cached or they want it to be)
        // and Pending in DB. Let's sync it to Delivered.
        console.log("Updating Order 2...");
        await db.query("UPDATE foodorder SET order_status = 'Delivered' WHERE order_id = 2");
        await db.query("UPDATE orderitem SET item_status = 'Completed' WHERE order_id = 2");
        console.log("Order 2 fixed.");

        // Fix Order 3: It has no items. Delete it to remove confusion.
        console.log("Deleting empty Order 3...");
        await db.query("DELETE FROM foodorder WHERE order_id = 3");
        console.log("Order 3 deleted.");

        process.exit(0);
    } catch (error) {
        console.error("Fix Error:", error);
        process.exit(1);
    }
}

fixOrders();
