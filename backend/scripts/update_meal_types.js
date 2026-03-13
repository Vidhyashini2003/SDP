const db = require('../config/db');

async function updateMealTypes() {
    try {
        console.log('🔄 Updating meal types for existing menu items...\n');

        // Update existing items with appropriate meal types
        await db.query("UPDATE menuitem SET meal_type = 'Breakfast' WHERE item_name IN ('Dosa', 'Pol Sambol & Hoppers', 'Chicken Bun')");
        console.log('✅ Updated Breakfast items');

        await db.query("UPDATE menuitem SET meal_type = 'Dinner' WHERE item_name IN ('Koththu Roti', 'Fried Rice')");
        console.log('✅ Updated Dinner items');

        // Display updated items
        const [items] = await db.query('SELECT item_id, item_name, meal_type, item_price, item_availability FROM menuitem ORDER BY meal_type, item_name');

        console.log('\n📊 Updated Menu Items:');
        console.log('─'.repeat(90));
        console.log('ID\tName\t\t\t\tMeal Type\t\tPrice\t\tAvailability');
        console.log('─'.repeat(90));

        items.forEach(item => {
            console.log(`${item.item_id}\t${item.item_name.padEnd(30)}\t${item.meal_type.padEnd(15)}\tRs. ${item.item_price}\t${item.item_availability}`);
        });

        console.log('\n✅ Update completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

updateMealTypes();
