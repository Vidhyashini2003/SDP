require('dotenv').config();
const db = require('./config/db');

async function test() {
  try {
    const [wig] = await db.query("INSERT INTO walkin_guest (first_name, last_name, email, phone, nic_passport, nationality) VALUES ('Migration', 'Test', 'migration_test@gmail.com', '0777777777', '123456789V', 'Sri Lankan')");
    const wigId = wig.insertId;
    console.log('Created wig_id:', wigId);
    
    await db.query("INSERT INTO roombooking (wig_id, room_id, rb_checkin, rb_checkout, rb_total_amount, rb_status) VALUES (?, 1, '2026-04-20', '2026-04-21', 5000, 'Booked')", [wigId]);
    console.log('Created room booking for wig_id');
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}
test();
