const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const root = path.resolve(__dirname, '..');
const env = require('dotenv').parse(fs.readFileSync(path.join(root, 'recovered', '.env')));
async function main() {
  if (env.DB_NAME !== 'pa03_local' || env.DB_HOST !== '127.0.0.1') throw new Error('Refusing to seed a non-local database.');
  const db = await mysql.createConnection({ host: env.DB_HOST, port: Number(env.DB_PORT), database: env.DB_NAME, user: env.DB_USER_MAIN, password: env.DB_PASSWORD_MAIN, multipleStatements: true });
  try {
    await db.query(fs.readFileSync(path.join(root, 'analysis', 'main-schema-inferred.sql'), 'utf8'));
    const extra = path.join(root, 'database', 'zalo-schema-inferred.sql');
    if (fs.existsSync(extra)) await db.query(fs.readFileSync(extra, 'utf8'));
    const [users] = await db.execute('SELECT userID FROM user WHERE userName = ?', [env.LOCAL_ADMIN_USERNAME]);
    if (users.length === 0) {
      const hash = await bcrypt.hash(env.LOCAL_ADMIN_PASSWORD, 10);
      await db.execute('INSERT INTO user (userName,password,email,userRole,totalMoney,isActive) VALUES (?,?,?,1,0,1)', [env.LOCAL_ADMIN_USERNAME, hash, 'local-admin@example.test']);
    }
    await db.query('INSERT INTO tool_setup (STT) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM tool_setup)');
    console.log('Inferred schema imported; synthetic local admin ready. No provider data seeded.');
  } finally { await db.end(); }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
