const db = require('../config/db');

async function addCategoryColumn() {
    try {
        console.log('🔄 Adding item_category column if needed...\n');

        // Check if column exists
        const [columns] = await db.query('DESCRIBE menuitem');
        const hasCategory = columns.some(col => col.Field === 'item_category');

        if (!hasCategory) {
            // Add category column
            await db.query(`
                ALTER TABLE menuitem 
                ADD COLUMN item_category VARCHAR(50) DEFAULT 'Other' AFTER item_availability
            `);
            console.log('✅ Added item_category column');

            // Update some items with categories
            await db.query("UPDATE menuitem SET item_category = 'Traditional' WHERE item_name IN ('Dosa', 'Pol Sambol & Hoppers', 'Koththu Roti')");
            await db.query("UPDATE menuitem SET item_category = 'Western' WHERE item_name IN ('Fried Rice', 'Chicken Bun')");
            console.log('✅ Updated categories');
        } else {
            console.log('✅ item_category column already exists');
        }

        // Display current schema
        const [items] = await db.query('SELECT item_id, item_name, item_category, meal_type, item_price FROM menuitem ORDER BY meal_type, item_name');

        console.log('\n📊 Current Menu Items:');
        console.log('─'.repeat(90));
        items.forEach(item => {
            console.log(`${item.item_id}\t${item.item_name.padEnd(25)}\t${(item.item_category || 'Other').padEnd(15)}\t${item.meal_type.padEnd(12)}\tRs. ${item.item_price}`);
        });

        console.log('\n✅ Update completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addCategoryColumn();
