import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../web/data.js';
{
  const memory = () => {
    const entries = new Map();
    return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, String(value)), removeItem: key => entries.delete(key) };
  };
  const demo = (storage = memory()) => createClient({ mode: 'demo', storage, fetchImpl: () => { throw new Error('Unexpected network request'); } });

  test('demo covers every resource without touching the network', async () => {
    const client = demo();
    for (const endpoint of ['/zalo-accounts', '/send-image/history', '/zalo-timer/history', '/zalo-oa/templates', '/zalo-oa/results', '/link/templates', '/link/domains', '/link/links', '/link/results', '/link/results-thumbnail', '/licenses/products', '/licenses/my-licenses', '/payos/history', '/admin/users', '/admin/ip-blocks', '/admin/requests', '/admin/leak-history', '/leak-lookup/history', '/logs']) {
      const response = await client.api(endpoint);
      assert.equal(response.success, true, endpoint);
      assert.equal(response.demo, true, endpoint);
      assert.ok(Array.isArray(response.data) && response.data.length > 0, endpoint);
      assert.ok(response.pagination.total >= response.data.length, endpoint);
      assert.match(response.message, /demo/i);
    }
    assert.equal((await client.api('/zalo-accounts')).data.length, 5);
    assert.equal((await client.api('/send-image/history')).data.length, 8);
    assert.equal((await client.api('/zalo-timer/history')).data.length, 3);
    assert.equal(client.user.totalMoney, client.user.balance);
    assert.equal(client.user.userName, client.user.username);
    assert.equal(client.user.userRole, client.user.role);
  });

  test('demo create, update and delete survive a fresh client', async () => {
    const storage = memory();
    let client = demo(storage);
    const created = await client.api('/api/zalo-accounts', { method: 'POST', body: { UID: 'demo-created', displayName: 'Nhóm thử nghiệm', phoneNumber: 'DEMO-006' } });
    assert.equal(created.data.UID, 'demo-created');
    client = demo(storage);
    await client.api('/zalo-accounts/demo-created', { method: 'PUT', body: { displayName: 'Nhóm đã cập nhật' } });
    client = demo(storage);
    assert.equal((await client.api('/zalo-accounts/demo-created')).data.displayName, 'Nhóm đã cập nhật');
    await client.api('/zalo-accounts/demo-created', { method: 'DELETE' });
    assert.equal((await demo(storage).api('/zalo-accounts')).data.length, 5);
  });

  test('license purchase maps numeric 1, 2, 3 to 1, 5, 10 uses and debits the wallet', async () => {
    for (const [licenseType, countDown, priceField] of [[1, 1, 'productOnePrice'], [2, 5, 'productFivePrice'], [3, 10, 'productTenPrice']]) {
      const client = demo();
      const product = (await client.api('/licenses/products')).data[0];
      const before = client.user.totalMoney;
      const result = await client.api('/licenses/purchase', { method: 'POST', body: { productID: product.productID, licenseType } });
      assert.equal(result.data.license.countDown, countDown);
      assert.equal(result.data.pricePaid, product[priceField]);
      assert.equal(client.user.totalMoney, before - product[priceField]);
      assert.equal((await client.api('/licenses/my-licenses')).data.length, 4);
    }
  });

  test('insufficient balance rejects payment without creating a request or license', async () => {
    const client = demo();
    await client.api(`/admin/users/${client.user.userID}`, { method: 'PUT', body: { totalMoney: 0 } });
    const before = (await client.api('/send-image/history')).pagination.total;
    await assert.rejects(client.api('/licenses/purchase', { method: 'POST', body: { productID: 1, licenseType: 1 } }), /số dư không đủ/i);
    await assert.rejects(client.api('/send-image-v2/send', { method: 'POST', body: { phoneNumber: 'DEMO-100', zaloUID: 'SYSTEM', imageUrl: 'https://example.test/demo.png' } }), /số dư không đủ/i);
    assert.equal((await client.api('/send-image/history')).pagination.total, before);
    assert.equal((await client.api('/licenses/my-licenses')).data.length, 3);
    assert.equal(client.user.totalMoney, 0);
  });

  test('pre-check is free and confirm adds a labeled demo request', async () => {
    const client = demo();
    const before = client.user.totalMoney;
    const check = await client.api('/check-status/pre-check', { method: 'POST', body: { type: 'phone', phoneNumber: 'DEMO-101', zaloUID: 'SYSTEM' } });
    assert.equal(check.data.currentBalance, before);
    assert.ok(check.data.profile.userId);
    assert.equal(client.user.totalMoney, before);
    const confirmed = await client.api('/check-status/confirm', { method: 'POST', body: { type: 'phone', phoneNumber: 'DEMO-101', targetUserId: check.data.profile.userId, zaloUID: 'SYSTEM' } });
    assert.equal(confirmed.newBalance, before - check.data.fee);
    assert.equal((await client.api('/send-image/history')).pagination.total, 9);
    assert.ok(confirmed.data.lastOnline);
  });

  test('seed uses original numeric roles and schedule statuses, and link tables have readable records', async () => {
    const client = demo();
    assert.equal(client.user.userRole, 1);
    const schedules = (await client.api('/zalo-timer/history')).data;
    assert.ok(schedules.every(item => [0, 1, 2, 3].includes(item.status)));
    const links = (await client.api('/link/links')).data;
    assert.ok(links.every(item => item.name && item.url));
    const results = (await client.api('/link/results')).data;
    assert.ok(results.every(item => item.link_name && item.result));
  });

  test('admin increasing a license count persists the requested extra uses', async () => {
    const storage = memory();
    const client = demo(storage);
    const license = (await client.api('/admin/licenses')).data[0];
    const response = await client.api(`/admin/licenses/${license.licenseKey}/extend`, { method: 'POST', body: { count: 3 } });
    assert.equal(response.data.newCountDown, license.countDown + 3);
    const restored = await demo(storage).api(`/admin/licenses/${license.licenseKey}`);
    assert.equal(restored.data.countDown, license.countDown + 3);
  });

  test('admin license filters find an off-page match before pagination including status zero', async () => {
    const client = demo();
    await client.api('/admin/licenses', { method: 'POST', body: { licenseKey: 'DEMO-FILTER-TARGET', productID: 2, status: 0, userName: 'offpage_demo' } });
    const nearMisses = [
      { productID: 2, status: 1, userName: 'offpage_demo' },
      { productID: 1, status: 0, userName: 'offpage_demo' },
      { productID: 2, status: 0, userName: 'offpage_demo_extra' },
    ];
    for (const [index, fields] of nearMisses.entries()) await client.api('/admin/licenses', { method: 'POST', body: { licenseKey: `DEMO-FILTER-NEAR-${index}`, ...fields } });
    for (let index = 0; index < 21; index++) await client.api('/admin/licenses', { method: 'POST', body: { licenseKey: `DEMO-FILTER-DECOY-${index}`, productID: 1, status: 1, userName: 'decoy_demo' } });
    const unfiltered = await client.api('/admin/licenses?page=1&limit=20');
    assert.equal(unfiltered.data.length, 20);
    assert.ok(!unfiltered.data.some(item => item.licenseKey === 'DEMO-FILTER-TARGET'));
    const filtered = await client.api('/admin/licenses?productID=2&status=0&userName=offpage_demo&page=1&limit=20');
    assert.deepEqual(filtered.data.map(item => item.licenseKey), ['DEMO-FILTER-TARGET']);
    assert.equal(filtered.pagination.total, 1);
    assert.equal(filtered.pagination.totalPages, 1);
    assert.equal((await client.api('/admin/licenses?productID=2&status=0&userName=offpage&page=1&limit=20')).pagination.total, 0);
  });

  test('Facebook lookup resolves a clearly synthetic UID without network access', async () => {
    const response = await demo().api('/facebook/find-uid', { method: 'POST', body: { link: 'https://example.test/demo-profile' } });
    assert.match(String(response.data.uid), /^demo-/);
    assert.match(response.message, /demo/i);
  });

  test('deposit create and cancel persist but never credit the wallet', async () => {
    const storage = memory();
    const client = demo(storage);
    const before = client.user.totalMoney;
    const response = await client.api('/payos/create', { method: 'POST', body: { amount: 250000 } });
    assert.equal(response.data.status, 'PENDING');
    assert.equal(client.user.totalMoney, before);
    await client.api('/payos/cancel', { method: 'POST', body: { addInfo: response.data.addInfo } });
    const restored = demo(storage);
    assert.equal((await restored.api('/payos/history')).data.find(item => item.addInfo === response.data.addInfo).status, 'CANCELLED');
    assert.equal(restored.user.totalMoney, before);
  });

  test('custom image with both IP types quotes and charges two request fees', async () => {
    const client = demo();
    const body = { phoneNumber: '0000002010', zaloUID: 'SYSTEM', imageType: 'custom', ipType: 'both' };
    const before = client.user.totalMoney;
    const quote = await client.api('/send-image-v2/search', { method: 'POST', body });
    assert.equal(quote.feeInfo.feeAmount, 70000);
    assert.equal(client.user.totalMoney, before);
    const response = await client.api('/send-image-v2/send', { method: 'POST', body });
    assert.equal(response.data.feeCharged, 70000);
    assert.equal(response.data.results.length, 2);
    assert.equal(client.user.totalMoney, before - 70000);
    assert.equal((await client.api('/send-image/history')).pagination.total, 10);
  });

  test('log records and system summary contain the fields shown in the UI', async () => {
    const client = demo();
    const logs = (await client.api('/logs')).data;
    assert.ok(logs.every(item => item.event_type && Number.isFinite(item.response_status)));
    const stats = (await client.api('/logs/admin/system-stats')).data;
    assert.equal(stats.summary.totalRequests, logs.length);
    assert.ok(stats.summary.totalSuccess > 0);
    assert.ok(stats.summary.totalErrors > 0);
  });

  test('reset restores demo data while live authentication remains isolated', async () => {
    const client = demo();
    await client.api('/admin/tool-setup', { method: 'PUT', body: { check_data_leak_money: 123 } });
    client.setMode('live');
    assert.equal(client.user, null);
    client.resetDemo();
    assert.equal(client.mode, 'live');
    client.setMode('demo');
    assert.notEqual((await client.api('/admin/tool-setup')).data.check_data_leak_money, 123);
    client.logout();
    assert.equal(client.mode, 'demo');
  });

  test('live login persists its JWT and obtains CSRF before a same-origin mutation', async () => {
    const storage = memory();
    const requests = [];
    const fetchImpl = async (path, options) => {
      requests.push({ path, options });
      const result = path === '/api/auth/login'
        ? { success: true, data: { token: 'fake-test-jwt', user: { userID: 9, userName: 'live-test', totalMoney: 100, userRole: 'user' } } }
        : path === '/api/csrf-token' ? { success: true, token: 'fake-test-csrf' }
          : { success: true, data: [] };
      return { ok: true, status: 200, json: async () => result, headers: { get: () => null } };
    };
    const client = createClient({ mode: 'live', storage, fetchImpl });
    await client.login({ userName: 'live-test', password: 'not-a-real-password' });
    const restored = createClient({ mode: 'live', storage, fetchImpl });
    assert.equal(restored.user.userName, 'live-test');
    await restored.api('/api/zalo-accounts', { method: 'POST', body: { UID: 'test' } });
    const mutation = requests.at(-1);
    assert.equal(mutation.path, '/api/zalo-accounts');
    assert.equal(mutation.options.headers.Authorization, 'Bearer fake-test-jwt');
    assert.equal(mutation.options.headers['X-CSRF-Token'], 'fake-test-csrf');
    assert.equal(mutation.options.credentials, 'same-origin');
    assert.equal(JSON.parse(mutation.options.body).UID, 'test');
    assert.equal(requests.filter(item => item.path === '/api/csrf-token').length, 1);
  });

  test('a rejected cached CSRF token is refreshed once and the exact JSON or FormData request succeeds', async () => {
    for (const multipart of [false, true]) {
      const requests = [];
      let issued = 0, backendToken, failure, acceptedPurchases = 0;
      const fetchImpl = async (path, options) => {
        requests.push({ path, body: options.body, headers: { ...options.headers } });
        let status = 200, result;
        if (path === '/api/auth/login') result = { success: true, data: { token: 'test-jwt', userID: 9, userName: 'live-test', userRole: 1 } };
        else if (path === '/api/csrf-token') { backendToken = `test-csrf-${++issued}`; result = { success: true, token: backendToken }; }
        else if (options.headers['X-CSRF-Token'] !== backendToken) { status = 403; result = failure; }
        else { if (path === '/api/licenses/purchase') acceptedPurchases++; result = { success: true, data: { newBalance: 51 } }; }
        return { ok: status === 200, status, json: async () => result, headers: { get: () => null } };
      };
      const client = createClient({ mode: 'live', storage: memory(), fetchImpl });
      await client.login({ userName: 'live-test', password: 'fake-test-password' });
      await client.api('/admin/tool-setup', { method: 'PUT', body: {} });
      backendToken = 'server-restarted';
      failure = multipart ? { success: false, code: 'CSRF_TOKEN_INVALID', message: 'Token rejected' } : { success: false, message: 'CSRF token đã hết hạn. Vui lòng tải lại trang.' };
      const body = multipart ? new FormData() : { productID: 1, licenseType: 1 };
      if (multipart) body.append('custom_image', new Blob(['test image'], { type: 'image/png' }), 'demo.png');
      const result = await client.api('/licenses/purchase', { method: 'POST', body });
      assert.equal(result.success, true);
      assert.equal(acceptedPurchases, 1, 'only one request reaches the protected action');
      assert.equal(issued, 2, 'cached token is replaced by one fresh token');
      const attempts = requests.filter(item => item.path === '/api/licenses/purchase');
      assert.equal(attempts.length, 2);
      assert.equal(attempts[0].headers['X-CSRF-Token'], 'test-csrf-1');
      assert.equal(attempts[1].headers['X-CSRF-Token'], 'test-csrf-2');
      assert.equal(attempts[1].headers.Authorization, 'Bearer test-jwt');
      assert.strictEqual(attempts[1].body, attempts[0].body);
      if (multipart) { assert.strictEqual(attempts[1].body, body); assert.equal(attempts[1].headers['Content-Type'], undefined); }
      else assert.deepEqual(JSON.parse(attempts[1].body), { productID: 1, licenseType: 1 });
      assert.equal(client.mode, 'live');
    }
  });

  test('ordinary authorization failures never retry a live financial mutation', async () => {
    let csrfRequests = 0, purchaseAttempts = 0;
    const client = createClient({ mode: 'live', storage: memory(), fetchImpl: async (path) => {
      let status = 200, result;
      if (path === '/api/auth/login') result = { success: true, data: { token: 'test-jwt', userID: 9 } };
      else if (path === '/api/csrf-token') { csrfRequests++; result = { success: true, token: 'test-csrf' }; }
      else { purchaseAttempts++; status = 403; result = { success: false, message: 'Bạn không có quyền thực hiện thao tác này.' }; }
      return { ok: status === 200, status, json: async () => result, headers: { get: () => null } };
    } });
    await client.login({ userName: 'live-test', password: 'fake-test-password' });
    await assert.rejects(client.api('/licenses/purchase', { method: 'POST', body: { productID: 1, licenseType: 1 } }), /không có quyền/);
    assert.equal(purchaseAttempts, 1);
    assert.equal(csrfRequests, 1);
    assert.equal(client.mode, 'live');
  });

  test('a second CSRF rejection is reported without further retry', async () => {
    let csrfRequests = 0, purchaseAttempts = 0;
    const client = createClient({ mode: 'live', storage: memory(), fetchImpl: async (path) => {
      let status = 200, result;
      if (path === '/api/auth/login') result = { success: true, data: { token: 'test-jwt', userID: 9 } };
      else if (path === '/api/csrf-token') { csrfRequests++; result = { success: true, token: `test-csrf-${csrfRequests}` }; }
      else { purchaseAttempts++; status = 403; result = { success: false, message: 'CSRF token không hợp lệ. Vui lòng tải lại trang.' }; }
      return { ok: status === 200, status, json: async () => result, headers: { get: () => null } };
    } });
    await client.login({ userName: 'live-test', password: 'fake-test-password' });
    await assert.rejects(client.api('/licenses/purchase', { method: 'POST', body: { productID: 1, licenseType: 1 } }), /CSRF token không hợp lệ/);
    assert.equal(purchaseAttempts, 2);
    assert.equal(csrfRequests, 2);
  });

  test('live send actions preserve compound results, request metadata and the updated wallet', async () => {
    for (const [path, feeField] of [['/send-image-v2/send', 'feeCharged'], ['/send-image-by-card/send', 'fee']]) {
      const data = { reqID: 401, results: [{ reqID: 401, type: 'ipv4', success: true, result: 'SUCCESS', detail: 'Fixture result' }], [feeField]: 20000, newBalance: 80000 };
      const client = createClient({ mode: 'live', storage: memory(), fetchImpl: async endpoint => {
        const result = endpoint === '/api/auth/login' ? { success: true, data: { token: 'test-jwt', userID: 9, totalMoney: 100000 } }
          : endpoint === '/api/csrf-token' ? { success: true, token: 'test-csrf' }
            : { success: true, message: 'Fixture send response', data };
        return { ok: true, status: 200, json: async () => result, headers: { get: () => null } };
      } });
      await client.login({ userName: 'live-test', password: 'fake-test-password' });
      const result = await client.api(path, { method: 'POST', body: { phoneNumber: '0000002001', targetUID: 'demo-target', zaloUID: 'demo-sender' } });
      assert.deepEqual(result.data, data);
      assert.equal(result.data.reqID, 401);
      assert.equal(result.data[feeField], 20000);
      assert.equal(result.data.newBalance, 80000);
      assert.equal(client.user.totalMoney, 80000);
      assert.equal(client.user.balance, 80000);
    }
  });

  test('OA synchronization returns only candidates that have not been saved', async () => {
    const client = demo();
    const first = await client.api('/zalo-oa/fetch-new-templates');
    assert.equal(first.data.length, 1);
    await client.api('/zalo-oa/templates', { method: 'POST', body: first.data[0] });
    const after = await client.api('/zalo-oa/fetch-new-templates');
    assert.equal(after.data.length, 0);
    assert.equal((await client.api('/zalo-oa/templates')).data.length, 4);
  });

  test('live unavailable responses and network failures never fall back to demo', async () => {
    for (const fetchImpl of [async () => ({ ok: false, status: 503, json: async () => ({ success: false, message: 'ZL_SERVER unavailable' }) }), async () => { throw new TypeError('fetch failed'); }]) {
      const client = createClient({ mode: 'live', storage: memory(), fetchImpl });
      await assert.rejects(client.api('/zalo-accounts'), /unavailable|không thể kết nối|chưa khả dụng/i);
      assert.equal(client.mode, 'live');
      assert.equal(client.user, null);
    }
  });

  test('health is the only demo method allowed to ask the local UI server for status', async () => {
    const calls = [];
    const client = createClient({ mode: 'demo', storage: memory(), fetchImpl: async path => { calls.push(path); return { ok: true, json: async () => ({ success: true, services: [] }) }; } });
    await client.api('/auth/profile');
    assert.equal(calls.length, 0);
    assert.equal((await client.health()).success, true);
    assert.deepEqual(calls, ['/ui/status']);
    await assert.rejects(client.api('https://example.test/api/users'), /đường dẫn|same-origin/i);
  });
}
