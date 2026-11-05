const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const envPath = path.join(root, 'recovered', '.env');
fs.mkdirSync(path.join(root, '.runtime'), { recursive: true });
if (!fs.existsSync(envPath)) {
  const dbPassword = crypto.randomBytes(24).toString('hex');
  let text = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
  text = text.replace(/^(DB_PASSWORD_(?:MAIN|ZL_SERVER|FILE))=GENERATE_LOCALLY$/gm, (_, key) => `${key}=${dbPassword}`);
  text = text.replace(/^([A-Z_]+)=GENERATE_LOCALLY$/gm, (_, key) => `${key}=${crypto.randomBytes(32).toString('hex')}`);
  fs.writeFileSync(envPath, text);
  console.log('Created recovered/.env with random local credentials.');
} else console.log('Using existing recovered/.env.');
const env = require('dotenv').parse(fs.readFileSync(envPath));
if (env.DB_NAME !== 'pa03_local' || env.DB_HOST !== '127.0.0.1') throw new Error('Local setup requires DB_NAME=pa03_local and DB_HOST=127.0.0.1.');
fs.writeFileSync(path.join(root, '.runtime', 'LOCAL-ACCESS.txt'),
  `LOCAL SYNTHETIC ACCOUNT ONLY\nInterface: http://127.0.0.1:${env.UI_PORT || 13103}\nMain API: http://127.0.0.1:${env.MAIN_SERVER_PORT}\nUsername: ${env.LOCAL_ADMIN_USERNAME}\nPassword: ${env.LOCAL_ADMIN_PASSWORD}\nInterface defaults to labeled sample data. Use Connect backend to sign in.\n`);
console.log('Local account access saved to .runtime/LOCAL-ACCESS.txt.');
const fixtureDir = path.join(root, 'recovered', 'FILES_SERVER', 'files');
fs.mkdirSync(fixtureDir, { recursive: true });
fs.writeFileSync(path.join(fixtureDir, 'local-test.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT1kAAAAASUVORK5CYII=', 'base64'));
