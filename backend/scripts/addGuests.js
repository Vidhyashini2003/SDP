const db = require('./config/db');

const guests = [
    {
        name: 'Guest03',
        email: 'guest03@gmail.com',
        phone: '0771234569',
        password: 'Guest03',
        address: '123 Galle Road, Colombo',
        nationality: 'SriLankan'
    },
    {
        name: 'Guest04',
        email: 'guest04@gmail.com',
        phone: '0771234570',
        password: 'Guest04',
        address: '45 Kandy Road, Kandy',
        nationality: 'SriLankan'
    },
    {
        name: 'Guest05',
        email: 'guest05@gmail.com',
        phone: '0771234571',
        password: 'Guest05',
        address: '89 Main Street, Jaffna',
        nationality: 'SriLankan'
    }
];

async function addGuests() {
    try {
        console.log('Starting to add guests...');
        for (const guest of guests) {
            // Check if exists
            const [existing] = await db.query('SELECT * FROM guest WHERE guest_email = ?', [guest.email]);
            if (existing.length > 0) {
                console.log(`Guest ${guest.name} (${guest.email}) already exists. Skipping.`);
                continue;
            }

            // Insert
            await db.query(
                'INSERT INTO guest (guest_name, guest_email, guest_phone, guest_password, guest_address, nationality) VALUES (?, ?, ?, ?, ?, ?)',
                [guest.name, guest.email, guest.phone, guest.password, guest.address, guest.nationality]
            );
            console.log(`✅ Added guest: ${guest.name}`);
        }
        console.log('🎉 Done adding guests.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding guests:', err);
        process.exit(1);
    }
}

addGuests();
