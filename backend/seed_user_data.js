const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const usersToCreate = [
    { email: 'guest01@gmail.com', first: 'Kamal', last: 'Perera', phone: '0771112223', role: 'guest', nic: '199012345678', nat: 'Sri Lankan' },
    { email: 'guest02@gmail.com', first: 'Nimal', last: 'Silva', phone: '0712223334', role: 'guest', nic: '199123456789', nat: 'Sri Lankan' },
    { email: 'guest03@gmail.com', first: 'Sunil', last: 'Fernando', phone: '0763334445', role: 'guest', nic: '199234567890', nat: 'Sri Lankan' },
    { email: 'recep01@gmail.com', first: 'Saman', last: 'Kumara', phone: '0774445556', role: 'receptionist', address: 'Colombo' },
    { email: 'kitstaff01@gmail.com', first: 'Nuwan', last: 'Sampath', phone: '0715556667', role: 'chef', address: 'Kandy' },
    { email: 'driver01@gmail.com', first: 'Priyantha', last: 'Jayasooriya', phone: '0766667778', role: 'driver', address: 'Galle' },
    { email: 'driver02@gmail.com', first: 'Kasun', last: 'Madushanka', phone: '0777778889', role: 'driver', address: 'Matara' }
];

async function seed() {
    let conn;
    try {
        const passwordHash = await bcrypt.hash('@Vidhy117', 10);
        conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Kayal2003',
            port: 3308,
            database: 'hotelmanagement'
        });

        for (const u of usersToCreate) {
            // Delete if exists
            await conn.query('DELETE FROM Users WHERE email = ?', [u.email]);
            
            // Insert User
            const [ures] = await conn.query(
                `INSERT INTO Users (first_name, last_name, email, phone, password, role, account_status) 
                 VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
                [u.first, u.last, u.email, u.phone, passwordHash, u.role]
            );
            const userId = ures.insertId;

            // Insert into Role tables
            if (u.role === 'guest') {
                await conn.query(
                    'INSERT INTO Guest (user_id, guest_nic_passport, nationality) VALUES (?, ?, ?)',
                    [userId, u.nic, u.nat]
                );
            } else if (u.role === 'receptionist') {
                await conn.query(
                    'INSERT INTO Receptionist (user_id, receptionist_address) VALUES (?, ?)',
                    [userId, u.address]
                );
            } else if (u.role === 'chef') {
                await conn.query(
                    'INSERT INTO KitchenStaff (user_id, staff_address) VALUES (?, ?)',
                    [userId, u.address]
                );
            } else if (u.role === 'driver') {
                await conn.query(
                    'INSERT INTO Driver (user_id, driver_address) VALUES (?, ?)',
                    [userId, u.address]
                );
            }

            console.log(`Created ${u.role}: ${u.email} (user_id: ${userId})`);
        }
    } catch (e) {
        console.error('Error seeding:', e);
    } finally {
        if (conn) await conn.end();
    }
}

seed();
