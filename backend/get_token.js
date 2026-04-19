require('dotenv').config();
const db = require('./config/db');

async function run() {
  try {
    const [users] = await db.query('SELECT user_id, email FROM Users WHERE email = ?', ['migration_test@gmail.com']);
    if(users.length === 0) { console.log('User not found'); process.exit(1); }
    const uid = users[0].user_id;
    const [tokens] = await db.query('SELECT token FROM activation_tokens WHERE user_id = ?', [uid]);
    if(tokens.length === 0) { console.log('Token not found'); process.exit(1); }
    console.log('TOKEN:' + tokens[0].token);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
run();
