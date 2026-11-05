const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');
const root = path.resolve(__dirname, '..');
const env = require('dotenv').parse(fs.readFileSync(path.join(root, 'recovered', '.env')));
const mainUrl = `http://127.0.0.1:${env.MAIN_SERVER_PORT}`;
const results = [], observations = [];
let runError = null;
async function request(base, route, method = 'GET', body, headers = {}) {
  const response = await fetch(base + route, { method, headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(5000) });
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = null; }
  return { status: response.status, data, type: response.headers.get('content-type'), size: text.length };
}
function check(name, actual, expected, valid = true) {
  const passed = actual.status === expected && !!valid;
  results.push({ name, status: actual.status, expected, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name} (${actual.status})`);
  if (!passed) throw new Error(`Check failed: ${name}; expected ${expected}, received ${actual.status}`);
}
async function waitReady(base, route, headers = {}) {
  for (let i = 0; i < 40; i++) {
    try { if ((await request(base, route, 'GET', null, headers)).status === 200) return; }
    catch { /* bounded startup retry */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Service did not become ready: ${base}${route}`);
}
async function run() {
  if (env.DB_NAME !== 'pa03_local' || env.DB_HOST !== '127.0.0.1') throw new Error('Synthetic smoke checks require isolated pa03_local database.');
  await waitReady(mainUrl, '/health');
  await waitReady(`http://127.0.0.1:${env.ZL_SERVER_PORT}`, '/health', { 'x-internal-auth': env.INTERNAL_AUTH_KEY });
  await waitReady(`http://127.0.0.1:${env.FILES_SERVER_PORT}`, '/local-test.png');
  let r = await request(mainUrl, '/health'); check('MAIN health', r, 200, r.data?.service === 'MAIN_SERVER');
  r = await request(mainUrl, '/api/not-an-endpoint'); check('Unknown API returns 404', r, 404);
  r = await request(mainUrl, '/api/auth/profile'); check('Profile requires login', r, 401);
  r = await request(`http://127.0.0.1:${env.ZL_SERVER_PORT}`, '/health'); check('ZL rejects missing internal key', r, 403);
  r = await request(`http://127.0.0.1:${env.ZL_SERVER_PORT}`, '/health', 'GET', null, { 'x-internal-auth': env.INTERNAL_AUTH_KEY }); check('ZL health with internal key', r, 200, r.data?.service === 'ZL_SERVER');
  r = await request(`http://127.0.0.1:${env.FILES_SERVER_PORT}`, '/local-test.png'); check('FILES serves synthetic PNG', r, 200, r.type === 'image/png' && r.size > 0);
  r = await request(mainUrl, '/api/auth/login', 'POST', { userName: env.LOCAL_ADMIN_USERNAME, password: env.LOCAL_ADMIN_PASSWORD });
  check('Admin account login through normal auth', r, 200, !!r.data?.data?.token);
  const admin = { authorization: `Bearer ${r.data.data.token}` };
  r = await request(mainUrl, '/api/auth/profile', 'GET', null, admin); check('Admin profile', r, 200, r.data?.data?.userRole === 1 && !r.data?.data?.password);
  r = await request(mainUrl, '/api/csrf-token', 'GET', null, admin); check('CSRF issuance', r, 200, r.data?.token?.length === 64);
  const csrf = r.data.token;
  r = await request(mainUrl, '/api/admin/tool-setup', 'PUT', {}, admin); check('Write rejects missing CSRF', r, 403);
  const reads = [
    ['/api/admin/users', 'Admin user list'],
    ['/api/admin/tool-setup', 'Tool configuration read'],
    ['/api/admin/products', 'Admin product list'],
    ['/api/admin/licenses', 'Admin license list'],
    ['/api/zalo-accounts', 'Zalo account list through gateway'],
    ['/api/send-image/history', 'Zalo history through gateway'],
    ['/api/send-image/stats', 'Zalo stats through gateway'],
    ['/api/licenses/products', 'Product catalog through gateway'],
    ['/api/licenses/my-licenses', 'Owned licenses through gateway'],
    ['/api/zalo-oa/templates', 'OA templates read'],
    ['/api/zalo-oa/results', 'OA results read']
  ];
  for (const [route, name] of reads) { r = await request(mainUrl, route, 'GET', null, admin); check(name, r, 200, r.data?.success); }
  // Use an explicit local CAPTCHA fixture, rather than an external challenge service.
  const db = await mysql.createConnection({ host: env.DB_HOST, port: Number(env.DB_PORT), database: env.DB_NAME, user: env.DB_USER_MAIN, password: env.DB_PASSWORD_MAIN });
  const userName = `smoke_${crypto.randomBytes(5).toString('hex')}`;
  let captchaID;
  try {
    r = await request(mainUrl, '/api/captcha/generate?purpose=register'); check('CAPTCHA generation', r, 200, !!r.data?.data?.captchaID);
    captchaID = r.data.data.captchaID;
    const answer = 'Aa23Bb', password = crypto.randomBytes(18).toString('hex');
    await db.execute('UPDATE captcha_sessions SET captchaText = ? WHERE captchaID = ?', [crypto.createHash('sha256').update(answer).digest('hex'), captchaID]);
    r = await request(mainUrl, '/api/auth/register', 'POST', { userName, password, email: `${userName}@example.test`, captchaID, captchaValue: answer });
    check('Registration with synthetic local CAPTCHA fixture', r, 201, !!r.data?.data?.token);
    const regular = { authorization: `Bearer ${r.data.data.token}` };
    r = await request(mainUrl, '/api/auth/login', 'POST', { userName, password }); check('Registered user login', r, 200, r.data?.data?.userRole === 2);
    r = await request(mainUrl, '/api/auth/profile', 'GET', null, regular); check('Registered user profile', r, 200, r.data?.data?.userName === userName);
    r = await request(mainUrl, '/api/admin/users', 'GET', null, regular); check('Regular user denied admin users', r, 403);
    r = await request(mainUrl, '/api/zalo-oa/templates', 'GET', null, regular); check('Regular user denied OA', r, 403);
    r = await request(mainUrl, '/api/send-image-v2/zalo-accounts', 'GET', null, regular); check('Regular user denied VIP tool', r, 403);
  // Record existing defects without treating them as working business features.
    r = await request(mainUrl, '/api/admin/tool-setup', 'PUT', {}, { ...admin, 'x-csrf-token': 'short' });
    observations.push({ name: 'Malformed short CSRF token', status: r.status, expectedCorrectBehavior: 403, knownBugReproduced: r.status === 500 });
    r = await request(mainUrl, '/api/logs/admin/search?limit=1', 'GET', null, regular);
    observations.push({ name: 'Regular user reaches admin log search', status: r.status, expectedCorrectBehavior: 403, knownBugReproduced: r.status !== 403 });
    r = await request(mainUrl, '/api/payos/history', 'GET', null, admin);
    observations.push({ name: 'PayOS service implementation absent', status: r.status, implementationPresent: false });
    // Confirm a valid token gets past CSRF using an empty config body: no configuration is changed.
    r = await request(mainUrl, '/api/admin/tool-setup', 'PUT', {}, { ...admin, 'x-csrf-token': csrf });
    check('Valid CSRF accepted for empty config update', r, 200, r.data?.success);
  } finally {
    await db.execute('DELETE FROM user WHERE userName = ? AND email = ?', [userName, `${userName}@example.test`]);
    if (captchaID) await db.execute('DELETE FROM captcha_sessions WHERE captchaID = ?', [captchaID]);
    await db.end();
  }
}
run().catch(error => { runError = error.message; console.error(error.message); process.exitCode = 1; }).finally(() => {
  const report = { checkedAt: new Date().toISOString(), completed: runError === null, error: runError, scope: 'Local synthetic database; no external Zalo, payment, data lookup or message send', passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length, results, observations };
  fs.mkdirSync(path.join(root, 'analysis'), { recursive: true });
  fs.writeFileSync(path.join(root, 'analysis', 'runtime-verification.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Smoke checks: ${report.passed} passed, ${report.failed} failed. Existing defects observed: ${observations.length}.`);
});
