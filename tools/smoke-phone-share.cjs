// Synthetic, loopback-only verification; no provider calls or real contact data.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const env = require('dotenv').parse(fs.readFileSync(path.join(root, 'recovered', '.env')));
const base = `http://127.0.0.1:${env.UI_PORT || 13103}`;
let fixtureID, auth;
const results = [];
async function call(route, body, authorization, method = body === undefined ? 'GET' : 'POST') {
  const response = await fetch(base + route, { method, headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(authorization ? { authorization } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(6000) });
  return { status: response.status, body: await response.json() };
}
function check(name, value) { assert.ok(value, name); results.push(name); console.log(`PASS ${name}`); }
(async () => {
  if (env.DB_HOST !== '127.0.0.1' || env.DB_NAME !== 'pa03_local') throw new Error('Run only against the isolated local fixture.');
  try {
    const login = await call('/api/auth/login', { userName: env.LOCAL_ADMIN_USERNAME, password: env.LOCAL_ADMIN_PASSWORD });
    check('normal local login', login.status === 200 && login.body.data?.token);
    auth = `Bearer ${login.body.data.token}`;
    check('owner list requires authentication', (await call('/api/phone-share/requests')).status === 401);
    const created = await call('/api/phone-share/requests', { recipientName: 'SMOKE · Disposable fixture', targetUID: 'synthetic-no-zalo-user', purpose: 'Kiểm tra luồng đồng ý bằng dữ liệu giả, không liên hệ người thật.', ttlHours: 24 }, auth);
    fixtureID = created.body.data?.id;
    check('live request persists', created.status === 201 && fixtureID);
    const token = created.body.data.token;
    check('local link is explicitly marked', created.body.data.localOnly && created.body.data.shareURL.startsWith(base + '/share-phone#'));
    const initial = await call('/ui/phone-share/read', { token });
    check('recipient reads pending request', initial.status === 200 && initial.body.data.status === 'pending');
    const noConsent = await call('/ui/phone-share/respond', { token, action: 'share', phoneNumber: '0000000000', consent: false });
    check('missing consent rejected', noConsent.status === 400);
    const shared = await call('/ui/phone-share/respond', { token, action: 'share', phoneNumber: '0000000000', consent: true });
    check('explicit synthetic consent accepted', shared.status === 200 && shared.body.data.status === 'shared' && shared.body.data.phoneNumber === undefined);
    const owned = (await call('/api/phone-share/requests', undefined, auth)).body.data.find(r => r.id === fixtureID);
    check('owner sees self-reported number with consent time', owned.phoneNumber === '+84000000000' && owned.verification === 'self_reported' && owned.consentAt);
    check('single-use response rejects replay', (await call('/ui/phone-share/respond', { token, action: 'decline' })).status === 409);
    check('synthetic request deleted', (await call(`/api/phone-share/requests/${fixtureID}`, undefined, auth, 'DELETE')).status === 200);
    fixtureID = null;
    check('deleted link is inaccessible', (await call('/ui/phone-share/read', { token })).status === 404);
    fs.writeFileSync(path.join(root, '.runtime', 'phone-share-live-check.json'), JSON.stringify({ time: new Date().toISOString(), passed: results.length, checks: results, providerCalls: 0, fixtureCleaned: true }, null, 2));
    console.log(`Phone-share local checks: ${results.length} passed. Synthetic record removed.`);
  } finally {
    if (fixtureID && auth) await call(`/api/phone-share/requests/${fixtureID}`, undefined, auth, 'DELETE');
    auth = undefined;
  }
})().catch(() => { console.error('Phone-share smoke failed; no credentials or response payloads printed.'); process.exitCode = 1; });
