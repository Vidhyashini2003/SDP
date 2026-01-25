const db = require('./config/db');

const staffMembers = [
    {
        name: 'kitstaff01',
        email: 'kitstaff01@gmail.com',
        phone: '0761234567',
        password: 'kitstaff01',
        address: '88 Market Road, Pettah',
        nationality: 'SriLankan'
    },
    {
        name: 'kitstaff02',
        email: 'kitstaff02@gmail.com',
        phone: '0761234568',
        password: 'kitstaff02',
        address: '99 Main Street, Negombo',
        nationality: 'SriLankan'
    },
    {
        name: 'kitstaff03',
        email: 'kitstaff03@gmail.com',
        phone: '0761234569',
        password: 'kitstaff03',
        address: '77 Sea Street, Trincomalee',
        nationality: 'SriLankan'
    }
];

async function addKitchenStaff() {
    try {
        console.log('Starting to add kitchen staff...');
        for (const staff of staffMembers) {
            // Check if exists
            const [existing] = await db.query('SELECT * FROM kitchenstaff WHERE staff_email = ?', [staff.email]);
            if (existing.length > 0) {
                console.log(`Staff ${staff.name} (${staff.email}) already exists. Skipping.`);
                continue;
            }

            // Insert
            // Note: DB has staff_address column based on check.
            await db.query(
                'INSERT INTO kitchenstaff (staff_name, staff_email, staff_phone, staff_password, staff_address) VALUES (?, ?, ?, ?, ?)',
                [staff.name, staff.email, staff.phone, staff.password, staff.address]
            );
            console.log(`✅ Added staff: ${staff.name}`);
        }
        console.log('🎉 Done adding kitchen staff.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding kitchen staff:', err);
        process.exit(1);
    }
}

addKitchenStaff();
