const express = require('express');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const { createPhoneShareRouter } = require('./phone-share.cjs');
const root = path.resolve(__dirname, '..');
function localURL(value) {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('UI proxy only supports local HTTP services.');
  return url;
}
function createUiApp({ upstream = 'http://127.0.0.1:13100', healthTargets = [], webRoot = path.join(root, 'web'), shareStoreFile = path.join(root, '.runtime', 'phone-share.json'), shareBaseURL = 'http://127.0.0.1:13103', shareClock = Date.now } = {}) {
  const target = localURL(upstream);
  for (const item of healthTargets) localURL(item.url);
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self'; frame-src https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.get('/ui/status', async (req, res) => {
    const services = await Promise.all(healthTargets.map(async item => {
      const started = Date.now();
      try {
        const response = await fetch(item.url, { headers: item.headers || {}, signal: AbortSignal.timeout(2000) });
        await response.arrayBuffer();
        return { name: item.name, state: response.ok ? 'online' : 'offline', latency: Date.now() - started };
      } catch { return { name: item.name, state: 'offline', latency: null }; }
    }));
    res.json({ success: true, services, missing: ['Hẹn giờ', 'Tra cứu IP', 'DataFind', 'PayOS', 'Link'], time: new Date().toISOString() });
  });
  app.use(createPhoneShareRouter({ upstream: target.origin, storeFile: shareStoreFile, baseURL: shareBaseURL, clock: shareClock }));
  app.get('/share-phone', (req, res) => { res.setHeader('Referrer-Policy', 'no-referrer'); res.sendFile(path.join(webRoot, 'share-phone.html')); });
  app.use('/api', (req, res) => {
    const headers = { ...req.headers, host: target.host, 'x-forwarded-for': req.socket.remoteAddress || '127.0.0.1' };
    delete headers.origin; delete headers.referer; delete headers.connection; delete headers['proxy-authorization'];
    const proxy = http.request({ hostname: target.hostname, port: target.port, path: req.originalUrl, method: req.method, headers }, response => {
      res.status(response.statusCode || 502);
      for (const [name, value] of Object.entries(response.headers)) if (value !== undefined && !['connection', 'transfer-encoding', 'content-security-policy', 'x-powered-by', 'access-control-allow-origin', 'access-control-allow-credentials'].includes(name)) res.setHeader(name, value);
      response.pipe(res);
    });
    proxy.setTimeout(20000, () => proxy.destroy(new Error('timeout')));
    proxy.on('error', error => {
      if (!res.headersSent) res.status(error.message === 'timeout' ? 504 : 503).json({ success: false, message: error.message === 'timeout' ? 'Backend phản hồi quá lâu. Vui lòng kiểm tra dịch vụ và thử lại.' : 'Backend chưa sẵn sàng. Vui lòng bật máy chủ và thử lại.' });
      else res.destroy();
    });
    req.on('aborted', () => proxy.destroy());
    req.pipe(proxy);
  });
  app.use(express.static(webRoot, { dotfiles: 'deny', etag: false, index: 'index.html' }));
  app.use((req, res) => res.status(404).json({ success: false, message: 'Không tìm thấy trang hoặc tài nguyên.' }));
  return app;
}
if (require.main === module) {
  const envPath = path.join(root, 'recovered', '.env');
  const env = fs.existsSync(envPath) ? require('dotenv').parse(fs.readFileSync(envPath)) : {};
  const mainPort = env.MAIN_SERVER_PORT || 13100, zaloPort = env.ZL_SERVER_PORT || 13101, filesPort = env.FILES_SERVER_PORT || 13102;
  const port = Number(process.env.UI_PORT || env.UI_PORT || 13103);
  const app = createUiApp({ upstream: `http://127.0.0.1:${mainPort}`, shareBaseURL: process.env.PHONE_SHARE_BASE_URL || env.PHONE_SHARE_BASE_URL || `http://127.0.0.1:${port}`, healthTargets: [
    { name: 'MAIN_SERVER', url: `http://127.0.0.1:${mainPort}/health` },
    { name: 'ZL_SERVER', url: `http://127.0.0.1:${zaloPort}/health`, headers: { 'x-internal-auth': env.INTERNAL_AUTH_KEY || '' } },
    { name: 'FILES_SERVER', url: `http://127.0.0.1:${filesPort}/local-test.png` },
  ] });
  const server = app.listen(port, '127.0.0.1', () => console.log(`PA03 UI · Local: http://127.0.0.1:${port}`));
  server.on('error', error => { console.error(`UI server: ${error.message}`); process.exitCode = 1; });
}
module.exports = { createUiApp };
