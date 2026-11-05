const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const target = path.resolve(__dirname, '../ui/server.cjs');
const createUiApp = fs.existsSync(target) ? require(target).createUiApp : undefined;
const listen = app => new Promise(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
const close = server => new Promise(resolve => server.close(resolve));
const origin = server => `http://127.0.0.1:${server.address().port}`;
test('serves UI assets while hiding local environment files', async () => {
  const app = createUiApp?.();
  assert.ok(app, 'A local UI server must serve the Vietnamese app');
  const server = await listen(app);
  try {
    const page = await fetch(origin(server));
    assert.equal(page.status, 200);
    assert.match(await page.text(), /<html[^>]+lang="vi"/);
    assert.equal((await fetch(origin(server) + '/.env')).status, 404);
    assert.equal((await fetch(origin(server) + '/recovered/.env')).status, 404);
  } finally { await close(server); }
});
test('proxy preserves API path, bearer and raw body without forwarding browser Origin', { skip: !createUiApp }, async () => {
  let received;
  const upstream = await listen(http.createServer((req, res) => {
    let body = ''; req.on('data', c => body += c); req.on('end', () => {
      received = { path: req.url, auth: req.headers.authorization, origin: req.headers.origin, body };
      res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ success: true, data: 'received' }));
    });
  }));
  const server = await listen(createUiApp({ upstream: origin(upstream) }));
  try {
    const r = await fetch(origin(server) + '/api/echo?q=one', { method: 'POST', headers: { authorization: 'Bearer test-only', origin: origin(server), 'content-type': 'application/json' }, body: '{"value":42}' });
    assert.equal(r.status, 200);
    assert.deepEqual(received, { path: '/api/echo?q=one', auth: 'Bearer test-only', origin: undefined, body: '{"value":42}' });
  } finally { await close(server); await close(upstream); }
});
test('unavailable upstream returns a clear error, never demo success', { skip: !createUiApp }, async () => {
  const unused = await listen(http.createServer()); const url = origin(unused); await close(unused);
  const server = await listen(createUiApp({ upstream: url }));
  try {
    const r = await fetch(origin(server) + '/api/auth/profile');
    assert.equal(r.status, 503);
    const body = await r.json(); assert.equal(body.success, false); assert.match(body.message, /Backend/);
    assert.equal(body.demo, undefined);
  } finally { await close(server); }
});
test('status response does not expose internal credentials', { skip: !createUiApp }, async () => {
  const backend = await listen(http.createServer((req, res) => res.end('{"success":true}')));
  const secret = 'private-test-key';
  const server = await listen(createUiApp({ healthTargets: [{ name: 'MAIN', url: origin(backend) + '/health', headers: { 'x-internal-auth': secret } }] }));
  try { const r = await fetch(origin(server) + '/ui/status'); const text = await r.text(); assert.equal(r.status, 200); assert.ok(!text.includes(secret)); assert.match(text, /online/); }
  finally { await close(server); await close(backend); }
});
