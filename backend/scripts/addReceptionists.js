const db = require('./config/db');

const receptionists = [
    {
        name: 'recep01',
        email: 'recep01@gmail.com',
        phone: '0751234591',
        password: 'recep01',
        address: '10 Trinco Road, Trincomalee, Sri Lanka'
    },
    {
        name: 'recep02',
        email: 'recep02@gmail.com',
        phone: '0751234592',
        password: 'recep02',
        address: '22 Harbor View, Trincomalee, Sri Lanka'
    },
    {
        name: 'recep03',
        email: 'recep03@gmail.com',
        phone: '0751234593',
        password: 'recep03',
        address: '33 Beach Side, Trincomalee, Sri Lanka'
    },
    {
        name: 'recep04',
        email: 'recep04@gmail.com',
        phone: '0751234594',
        password: 'recep04',
        address: '44 Fort Fredrick, Trincomalee, Sri Lanka'
    },
    {
        name: 'recep05',
        email: 'recep05@gmail.com',
        phone: '0751234595',
        password: 'recep05',
        address: '55 Nilaveli Road, Trincomalee, Sri Lanka'
    }
];

async function addReceptionists() {
    try {
        console.log('Starting to add receptionists...');
        for (const staff of receptionists) {
            // Check if exists
            const [existing] = await db.query('SELECT * FROM receptionist WHERE receptionist_email = ?', [staff.email]);
            if (existing.length > 0) {
                console.log(`Receptionist ${staff.name} (${staff.email}) already exists. Skipping.`);
                continue;
            }

            // Insert
            await db.query(
                'INSERT INTO receptionist (receptionist_name, receptionist_email, receptionist_phone, receptionist_password, receptionist_address) VALUES (?, ?, ?, ?, ?)',
                [staff.name, staff.email, staff.phone, staff.password, staff.address]
            );
            console.log(`✅ Added receptionist: ${staff.name}`);
        }
        console.log('🎉 Done adding receptionists.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding receptionists:', err);
        process.exit(1);
    }
}

addReceptionists();
