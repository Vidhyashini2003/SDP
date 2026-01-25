const db = require('./config/db');

const drivers = [
    {
        name: 'driver 02',
        email: 'driver02@gmail.com',
        phone: '0771234582',
        password: 'driver 02',
        vehicle_id: 2,
        address: '12 Temple Road, Kandy',
        nationality: 'SriLankan'
    },
    {
        name: 'driver 03',
        email: 'driver03@gmail.com',
        phone: '0771234583',
        password: 'driver 03',
        vehicle_id: 3,
        address: '34 Beach Road, Galle',
        nationality: 'SriLankan'
    },
    {
        name: 'driver 04',
        email: 'driver04@gmail.com',
        phone: '0771234584',
        password: 'driver 04',
        vehicle_id: 4,
        address: '56 Hill Street, Nuwara Eliya',
        nationality: 'SriLankan'
    },
    {
        name: 'driver 05',
        email: 'driver05@gmail.com',
        phone: '0771234585',
        password: 'driver 05',
        vehicle_id: 5,
        address: '78 City Center, Colombo',
        nationality: 'SriLankan'
    }
];

async function addDrivers() {
    try {
        console.log('Starting to add drivers...');
        for (const driver of drivers) {
            // Check if exists
            const [existing] = await db.query('SELECT * FROM driver WHERE driver_email = ?', [driver.email]);
            if (existing.length > 0) {
                console.log(`Driver ${driver.name} (${driver.email}) already exists. Skipping.`);
                continue;
            }

            // Insert (Note: license_number is removed, vehicle_id is present)
            // Wait, schema.sql says driver_address is not in the table? 
            // My SHOW COLUMNS result: ['driver_id', 'driver_name', 'driver_email', 'driver_phone', 'driver_password', 'vehicle_id']
            // IT DOES NOT SHOW 'driver_address' or 'nationality'.
            // The User requested "address random srilankan addresses", "nationality srilankan".
            // BUT THE TABLE DOES NOT HAVE THESE COLUMNS based on my `SHOW COLUMNS` output.

            // I must Ignore address and nationality for now, or add them? 
            // The user request implies I should add them? 
            // "add three guests ... address ... nationality" -> Guest table had them.
            // "create 4 driver accounts ... address ... nationality" -> Driver table ??

            // Let's re-read the SHOW COLUMNS output in Step 759:
            // [ 'driver_id', 'driver_name', 'driver_email', 'driver_phone', 'driver_password', 'vehicle_id' ]
            // Missing: address, nationality.

            // I will NOT insert address and nationality to avoid crash. 
            // I will mention this to the user.

            await db.query(
                'INSERT INTO driver (driver_name, driver_email, driver_phone, driver_password, vehicle_id) VALUES (?, ?, ?, ?, ?)',
                [driver.name, driver.email, driver.phone, driver.password, driver.vehicle_id]
            );
            console.log(`✅ Added driver: ${driver.name}`);
        }
        console.log('🎉 Done adding drivers.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding drivers:', err);
        process.exit(1);
    }
}

addDrivers();
