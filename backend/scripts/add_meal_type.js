const db = require('../config/db');

async function addMealType() {
    try {
        console.log('🔄 Adding meal_type column to menuitem table...\n');

        // Add meal_type column
        await db.query(`
            ALTER TABLE menuitem 
            ADD COLUMN meal_type ENUM('Breakfast', 'Lunch', 'Dinner', 'All Day') DEFAULT 'All Day' AFTER item_price
        `);
        console.log('✅ Added meal_type column');

        // Update existing items with appropriate meal types
        await db.query("UPDATE menuitem SET meal_type = 'Breakfast' WHERE item_name IN ('Dosa', 'Pol Sambol & Hoppers', 'Chicken Bun')");
        console.log('✅ Updated Breakfast items');

        await db.query("UPDATE menuitem SET meal_type = 'Dinner' WHERE item_name IN ('Koththu Roti', 'Fried Rice')");
        console.log('✅ Updated Dinner items');

        // Display updated items
        const [items] = await db.query('SELECT item_id, item_name, item_category, meal_type, item_price FROM menuitem ORDER BY meal_type, item_name');

        console.log('\n📊 Updated Menu Items:');
        console.log('─'.repeat(80));
        console.log('ID\tName\t\t\t\tMeal Type\tPrice');
        console.log('─'.repeat(80));

        items.forEach(item => {
            console.log(`${item.item_id}\t${item.item_name.padEnd(30)}\t${item.meal_type}\t\tRs. ${item.item_price}`);
        });

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️  meal_type column already exists, skipping...');

            // Just display current items
            const [items] = await db.query('SELECT item_id, item_name, item_category, meal_type, item_price FROM menuitem ORDER BY meal_type, item_name');
            console.log('\n📊 Current Menu Items:');
            console.log('─'.repeat(80));
            items.forEach(item => {
                console.log(`${item.item_id}\t${item.item_name.padEnd(30)}\t${item.meal_type}\t\tRs. ${item.item_price}`);
            });
            process.exit(0);
        }
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addMealType();
