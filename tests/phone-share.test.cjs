const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createUiApp } = require('../ui/server.cjs');
const listen = app => new Promise(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
const close = server => new Promise(resolve => server.close(resolve));
const origin = server => `http://127.0.0.1:${server.address().port}`;

async function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pa03-share-test-'));
  let now = Date.parse('2026-11-03T12:00:00Z');
  const upstream = await listen(http.createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url !== '/api/auth/profile') { res.statusCode = 404; return res.end('{}'); }
    const id = { 'Bearer owner-a': 11, 'Bearer owner-b': 12 }[req.headers.authorization];
    res.statusCode = id ? 200 : 401;
    res.end(JSON.stringify(id ? { success: true, data: { userID: id, userName: `owner-${id}`, isActive: 1 } } : { success: false }));
  }));
  const options = { upstream: origin(upstream), shareStoreFile: path.join(dir, 'records.json'), shareClock: () => now };
  const server = await listen(createUiApp(options));
  t.after(async () => { await close(server); await close(upstream); fs.rmSync(dir, { recursive: true, force: true }); });
  const call = async (route, body, auth = 'owner-a', method = body === undefined ? 'GET' : 'POST', extraHeaders = {}) => {
    const r = await fetch(origin(server) + route, { method, headers: { ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...extraHeaders }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    return { status: r.status, body: await r.json() };
  };
  const create = () => call('/api/phone-share/requests', { recipientName: 'Khách hàng thử', targetUID: '123456789', purpose: 'Liên hệ về lịch hẹn đã đăng ký', ownerID: 12, requesterName: 'Tên giả' });
  return { call, create, options, dir, advance: ms => { now += ms; } };
}
const tokenOf = r => r.body.data.token;

test('create requires authentication and derives owner/requester from verified profile', async t => {
  const f = await fixture(t);
  assert.equal((await f.call('/api/phone-share/requests', {}, null)).status, 401);
  const made = await f.create();
  assert.equal(made.status, 201);
  assert.equal(made.body.data.requesterName, 'owner-11');
  assert.match(tokenOf(made), /^[a-f0-9]{64}$/);
  assert.equal(made.body.data.status, 'pending');
  assert.equal(Date.parse(made.body.data.expiresAt) - Date.parse(made.body.data.createdAt), 72 * 3600000);
  assert.equal((await f.call('/api/phone-share/requests', undefined, 'owner-b')).body.data.length, 0);
});

test('public read and response never disclose owner IDs, target UID, token or stored phone', async t => {
  const f = await fixture(t); const made = await f.create(); assert.equal(made.status, 201);
  const token = tokenOf(made);
  const before = await f.call('/ui/phone-share/read', { token }, null);
  assert.equal(before.status, 200);
  assert.equal(before.body.data.purpose, 'Liên hệ về lịch hẹn đã đăng ký');
  const submitted = await f.call('/ui/phone-share/respond', { token, action: 'share', phoneNumber: '090 123 4567', consent: true }, null);
  assert.equal(submitted.status, 200);
  assert.equal(submitted.body.data.status, 'shared');
  const after = await f.call('/ui/phone-share/read', { token }, null);
  for (const response of [before, submitted, after]) {
    for (const key of ['ownerID', 'targetUID', 'token', 'phoneNumber', 'consentAt']) assert.equal(response.body.data[key], undefined, key);
  }
  const owner = await f.call('/api/phone-share/requests');
  assert.equal(owner.body.data[0].phoneNumber, '+84901234567');
  assert.equal(owner.body.data[0].verification, 'self_reported');
  assert.ok(owner.body.data[0].consentAt);
});

test('omitted, false or string consent and invalid phone cannot save a number', async t => {
  const f = await fixture(t); const made = await f.create(); assert.equal(made.status, 201);
  const token = tokenOf(made);
  for (const consent of [undefined, false, 'true']) assert.equal((await f.call('/ui/phone-share/respond', { token, action: 'share', phoneNumber: '0901234567', consent }, null)).status, 400);
  for (const phoneNumber of ['abc', '123', '+1234567890123456', '0901234567 extension 9']) assert.equal((await f.call('/ui/phone-share/respond', { token, action: 'share', phoneNumber, consent: true }, null)).status, 400);
  assert.equal((await f.call('/api/phone-share/requests')).body.data[0].status, 'pending');
});

test('terminal responses are one-use and decline stores no phone', async t => {
  const f = await fixture(t); const made = await f.create(); assert.equal(made.status, 201);
  const token = tokenOf(made);
  assert.equal((await f.call('/ui/phone-share/respond', { token, action: 'decline', phoneNumber: '0901234567' }, null)).status, 200);
  assert.equal((await f.call('/ui/phone-share/respond', { token, action: 'share', phoneNumber: '0901234567', consent: true }, null)).status, 409);
  const row = (await f.call('/api/phone-share/requests')).body.data[0];
  assert.equal(row.status, 'declined'); assert.equal(row.phoneNumber, undefined);
});

test('expiry, owner isolation, revoke, delete and forged token prevent submission', async t => {
  const f = await fixture(t); const made = await f.create(); assert.equal(made.status, 201);
  const { id, token } = made.body.data;
  assert.equal((await f.call(`/api/phone-share/requests/${id}/revoke`, {}, 'owner-b')).status, 404);
  assert.equal((await f.call(`/api/phone-share/requests/${id}`, undefined, 'owner-b', 'DELETE')).status, 404);
  assert.equal((await f.call('/ui/phone-share/read', { token: 'a'.repeat(64) }, null)).status, 404);
  assert.equal((await f.call(`/api/phone-share/requests/${id}/revoke`, {})).status, 200);
  assert.equal((await f.call('/ui/phone-share/respond', { token, action: 'decline' }, null)).status, 409);
  assert.equal((await f.call(`/api/phone-share/requests/${id}`, undefined, 'owner-a', 'DELETE')).status, 200);
  assert.equal((await f.call('/ui/phone-share/read', { token }, null)).status, 404);
  const next = await f.create(); f.advance(72 * 3600000);
  assert.equal((await f.call('/ui/phone-share/read', { token: tokenOf(next) }, null)).body.data.status, 'expired');
  assert.equal((await f.call('/ui/phone-share/respond', { token: tokenOf(next), action: 'decline' }, null)).status, 410);
});

test('records survive a fresh server, private files stay inaccessible and foreign Origin fails', async t => {
  const f = await fixture(t); const made = await f.create(); assert.equal(made.status, 201);
  const restarted = await listen(createUiApp(f.options)); t.after(() => close(restarted));
  const persisted = await fetch(origin(restarted) + '/api/phone-share/requests', { headers: { Authorization: 'Bearer owner-a' } });
  assert.equal((await persisted.json()).data[0].id, made.body.data.id);
  assert.equal((await f.call('/ui/phone-share/read', { token: tokenOf(made) }, null, 'POST', { Origin: 'https://foreign.example' })).status, 403);
  assert.equal((await fetch(origin(restarted) + '/.runtime/phone-share.json')).status, 404);
  const page = await fetch(origin(restarted) + '/share-phone');
  assert.equal(page.status, 200); assert.match(await page.text(), /share-phone\.js/);
});

test('input limits and corrupt storage fail without overwriting existing records', async t => {
  const f = await fixture(t);
  for (const body of [{ purpose: '' }, { purpose: 'x'.repeat(301) }, { purpose: 'Liên hệ lịch hẹn', ttlHours: 999 }, { purpose: 'Liên hệ lịch hẹn', targetUID: '<script>' }]) assert.equal((await f.call('/api/phone-share/requests', body)).status, 400);
  fs.writeFileSync(f.options.shareStoreFile, 'not-json');
  assert.equal((await f.create()).status, 503);
  assert.equal(fs.readFileSync(f.options.shareStoreFile, 'utf8'), 'not-json');
});
