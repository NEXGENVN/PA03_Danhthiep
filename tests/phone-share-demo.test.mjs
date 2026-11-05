import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../web/data.js';
const memory = () => { const map = new Map(); return { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: k => map.delete(k) }; };
const input = { recipientName: 'Khách mẫu', targetUID: 'demo-target', purpose: 'Liên hệ lịch hẹn minh họa', ttlHours: 24 };
function setup() { const storage = memory(); const client = createClient({ mode: 'demo', storage, fetchImpl: () => { throw new Error('Demo must not send network traffic'); } }); return { storage, client }; }

test('demo consent response persists to owner list without network or wallet charge', async () => {
  const { storage, client } = setup(); const balance = client.user.totalMoney;
  const created = await client.api('/phone-share/requests', { method: 'POST', body: input });
  assert.equal(created.demo, true); assert.match(created.data.shareURL, /#demo\.[a-f0-9]{64}$/);
  const { demoPublicRead, demoPublicRespond } = await import('../web/phone-share-demo.js');
  assert.equal(demoPublicRead(storage, created.data.token).data.status, 'pending');
  assert.throws(() => demoPublicRespond(storage, created.data.token, { action: 'share', phoneNumber: '0901234567' }), /đồng ý/);
  const response = demoPublicRespond(storage, created.data.token, { action: 'share', phoneNumber: '0901234567', consent: true });
  assert.equal(response.data.status, 'shared'); assert.equal(response.data.phoneNumber, undefined);
  const fresh = createClient({ mode: 'demo', storage });
  const row = (await fresh.api('/phone-share/requests')).data[0];
  assert.equal(row.phoneNumber, '+84901234567'); assert.equal(row.verification, 'self_reported');
  assert.equal(client.user.totalMoney, balance);
  assert.throws(() => demoPublicRespond(storage, created.data.token, { action: 'decline' }), /phản hồi/);
});

test('reset demo removes phone-share records and invalidates their recipient links', async () => {
  const { storage, client } = setup(); const made = await client.api('/phone-share/requests', { method: 'POST', body: input });
  const { demoPublicRead } = await import('../web/phone-share-demo.js');
  client.resetDemo();
  assert.equal((await client.api('/phone-share/requests')).data.length, 0);
  assert.throws(() => demoPublicRead(storage, made.data.token), /không tồn tại/);
});

test('demo revoke/delete enforce one-use and storage failure never claims success', async () => {
  const { storage, client } = setup(); const made = await client.api('/phone-share/requests', { method: 'POST', body: input });
  const { demoPublicRespond } = await import('../web/phone-share-demo.js');
  await client.api(`/phone-share/requests/${made.data.id}/revoke`, { method: 'POST', body: {} });
  assert.throws(() => demoPublicRespond(storage, made.data.token, { action: 'decline' }), /hủy/);
  await client.api(`/phone-share/requests/${made.data.id}`, { method: 'DELETE' });
  assert.equal((await client.api('/phone-share/requests')).data.length, 0);
  storage.setItem = () => { throw new Error('quota'); };
  await assert.rejects(client.api('/phone-share/requests', { method: 'POST', body: input }), /lưu/);
});

test('demo expired link refuses response and public view omits UID and token', async () => {
  const { storage, client } = setup(); const made = await client.api('/phone-share/requests', { method: 'POST', body: input });
  const { DEMO_SHARE_KEY, demoPublicRead, demoPublicRespond } = await import('../web/phone-share-demo.js');
  const stored = JSON.parse(storage.getItem(DEMO_SHARE_KEY)); stored[0].expiresAt = '2020-01-01T00:00:00Z'; storage.setItem(DEMO_SHARE_KEY, JSON.stringify(stored));
  const view = demoPublicRead(storage, made.data.token).data;
  assert.equal(view.status, 'expired'); assert.equal(view.token, undefined); assert.equal(view.targetUID, undefined);
  assert.throws(() => demoPublicRespond(storage, made.data.token, { action: 'share', phoneNumber: '0901234567', consent: true }), /hết hạn/);
});
