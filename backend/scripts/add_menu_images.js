const db = require('../config/db');

async function addImagesToMenu() {
    try {
        console.log('Adding images to menu items...\n');

        // Define image mappings for specific menu items
        const imageUpdates = [
            { name: 'Pol Roti and Sambol', image: 'pol_rotti_sambol.png' },
            { name: 'Dosa', image: 'dosa.png' },
            { name: 'Chicken Bun', image: 'chicken_bun.png' },
            { name: 'Fried Rice', image: 'fried_rice.png' },
            { name: 'Kothu Rotti', image: 'kothu_rotti.png' }
        ];

        for (const item of imageUpdates) {
            const [result] = await db.query(
                'UPDATE menuitem SET item_image = ? WHERE item_name LIKE ?',
                [item.image, `%${item.name}%`]
            );

            if (result.affectedRows > 0) {
                console.log(`✓ Updated ${result.affectedRows} item(s) matching "${item.name}" with image: ${item.image}`);
            } else {
                console.log(`⚠ No items found matching "${item.name}"`);
            }
        }

        // Show all menu items with their images
        console.log('\n📋 Current menu items with images:');
        const [items] = await db.query('SELECT item_id, item_name, item_image FROM menuitem ORDER BY item_name');
        items.forEach(item => {
            console.log(`  ${item.item_name}: ${item.item_image || '(no image)'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addImagesToMenu();
