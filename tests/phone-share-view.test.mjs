import test from 'node:test';
import assert from 'node:assert/strict';
const view = await import('../web/phone-share-view.js').catch(() => ({}));

test('recipient frame includes local reachability warning for pending, terminal and error content', () => {
  assert.equal(typeof view.recipientFrame, 'function', 'Recipient views must use a shared frame with the loopback warning');
  for (const hostname of ['127.0.0.1', 'localhost', '[::1]']) {
    for (const content of ['<h1>Chia sẻ số điện thoại</h1>', '<h1>Yêu cầu đã được phản hồi</h1>', '<h1>Yêu cầu không khả dụng</h1>']) {
      const html = view.recipientFrame(content, { demo: false, hostname });
      assert.match(html, /chỉ mở được trên máy này/); assert.match(html, /HTTPS/); assert.ok(html.includes(content));
    }
  }
  assert.doesNotMatch(view.recipientFrame('<h1>Chia sẻ</h1>', { demo: false, hostname: 'contacts.example.test' }), /chỉ mở được trên máy này/);
});

test('a reopened terminal link reports request status without attributing consent to the viewer', () => {
  assert.equal(typeof view.terminalText, 'function');
  assert.deepEqual(view.terminalText('shared'), ['Đã nhận phản hồi chia sẻ', 'Yêu cầu đã nhận số điện thoại được người phản hồi đồng ý chia sẻ. Số này được ghi nhận là thông tin tự khai.']);
  assert.equal(view.terminalText('declined')[0], 'Yêu cầu đã bị từ chối');
  assert.doesNotMatch(view.terminalText('shared').join(' '), /Bạn đã/);
});
