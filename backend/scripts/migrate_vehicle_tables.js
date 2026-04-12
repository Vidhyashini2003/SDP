const db = require('../config/db');

(async () => {
    try {
        console.log('Running migration: dropping unused columns from hire_vehicle_for_arrival_or_departure...');

        const columnsToCheck = [
            'transfer_direction',
            'dropoff_location',
            'estimated_price',
            'pickup_time',
            'actual_km',
            'waiting_hours',
            'actual_start_time'
        ];

        // Get existing columns
        const [existing] = await db.query('DESCRIBE hire_vehicle_for_arrival_or_departure');
        const existingCols = existing.map(c => c.Field);

        const toDrop = columnsToCheck.filter(col => existingCols.includes(col));

        if (toDrop.length === 0) {
            console.log('No columns to drop - already migrated.');
        } else {
            const dropClause = toDrop.map(col => `DROP COLUMN ${col}`).join(', ');
            await db.query(`ALTER TABLE hire_vehicle_for_arrival_or_departure ${dropClause}`);
            console.log('Dropped columns:', toDrop.join(', '));
        }

        const [after] = await db.query('DESCRIBE hire_vehicle_for_arrival_or_departure');
        console.log('Remaining columns:', after.map(r => r.Field));
        process.exit(0);
    } catch(e) {
        console.error('Migration failed:', e.message);
        process.exit(1);
    }
})();
