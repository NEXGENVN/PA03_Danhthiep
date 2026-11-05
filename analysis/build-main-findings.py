"""Static inventory only. Does not import or execute recovered JavaScript."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'recovered' / 'MAIN_SERVER'
SOURCES = {str(p.relative_to(BASE)).replace('\\', '/'): p.read_text(encoding='utf-8-sig') for p in BASE.rglob('*.js')}

def cite(file, needle):
    lines = SOURCES[file].splitlines()
    found = [i + 1 for i, line in enumerate(lines) if needle in line]
    if not found:
        raise ValueError((file, needle))
    return {'file': 'recovered/MAIN_SERVER/' + file, 'line': found[0], 'excerpt': lines[found[0]-1].strip()}

def finding(id, severity, title, detail, refs, remediation, certainty='confirmed by static inspection'):
    return {'id': id, 'severity': severity, 'title': title, 'detail': detail, 'certainty': certainty,
            'evidence': [cite(*ref) for ref in refs], 'remediation': remediation}

F = []
def add(*args, **kwargs): F.append(finding(*args, **kwargs))

add('MAIN-001', 'high', 'Admin log routes have no admin authorization',
    'The /api/logs mount requires a valid user but not role 1. Every /admin/* log endpoint also omits adminMiddleware and controllers never check roles. Any active user can reach global searches, another user\'s logs, security alerts, system statistics and destructive cleanup. Existing DB-result bugs do not make this safe: search returns the first matching row as an object and cleanup runs DELETE before throwing.',
    [('main_server.js', "app.use('/api/logs'"), ('routes/logsRoutes.js', "router.get('/admin/search'"), ('routes/logsRoutes.js', "router.post('/admin/cleanup'"), ('controllers/logsController.js', 'const cleanupLogsController')],
    'Apply adminMiddleware to the complete /api/logs/admin router before handlers; verify role 2 and 3 receive 403, including cleanup.')
add('MAIN-002', 'high', 'Log APIs assume the wrong db.query return shape',
    'The DB wrapper returns rows directly, not mysql2\'s [rows, fields]. Log helpers and controller destructure const [logs], const [stats], const [countResult], etc. getMyLogs/getAllLogs dereference countResult[0] on a row object; stats/security attempt reduce on a row object or undefined; cleanup destructures a non-iterable ResultSetHeader after DELETE has already committed. Most log APIs therefore fail or return a single malformed row.',
    [('config/database.js', 'return rows;'), ('middleware/apiLogger.js', 'const [logs]'), ('middleware/apiLogger.js', 'const [stats]'), ('middleware/apiLogger.js', 'const [result]'), ('controllers/logsController.js', 'const [countResult]'), ('controllers/logsController.js', 'const [logs] = await db.query(query, params)')],
    'Keep a single DB wrapper contract and remove the extra destructuring in all log readers/deleters; verify result arrays, empty sets, counts and affectedRows.')
add('MAIN-003', 'high', 'CAPTCHA answers are delivered as machine-readable SVG text',
    'generateCaptchaSVG emits the actual six answer characters as ordered SVG text nodes. The response is merely base64 SVG, so a program can read the answer without OCR. Distortion, curves and noise do not prevent extraction from the document. This defeats the compulsory registration CAPTCHA and login challenge.',
    [('controllers/captchaController.js', 'chars.forEach((char, index)'), ('controllers/captchaController.js', '>${char}</text>'), ('controllers/captchaController.js', 'captchaImage: `data:image/svg+xml;base64,${base64Image}`')],
    'Use an established challenge service or rasterize text server-side into an image that does not include accessible answer text; use cryptographic randomness.')
add('MAIN-004', 'high', 'Client IP security relies on unconditionally trusted headers',
    'CAPTCHA/login attempt/block helpers accept X-Forwarded-For or X-Real-IP directly; CSRF and audit helpers additionally accept CF-Connecting-IP directly. These values are not checked against the connecting reverse proxy. If the application is directly reachable or the ingress forwards client-supplied headers, clients can choose their block/captcha/audit identity. Express trust proxy = 1 also requires an actual single trusted ingress. Different helpers use different header priority, so auth, CSRF and rate limits can disagree on the same request\'s IP.',
    [('controllers/captchaController.js', "return req.headers['x-forwarded-for']"), ('middleware/csrf.js', "const cfIP = req.headers['cf-connecting-ip']"), ('middleware/apiLogger.js', "if (req.headers['cf-connecting-ip'])"), ('main_server.js', "app.set('trust proxy', 1)")],
    'Define trusted proxy addresses, keep the gateway inaccessible directly when appropriate, normalize one client-IP function from validated proxy information, and have ingress overwrite forwarding headers.',
    certainty='confirmed trust issue; external exploitability depends on ingress configuration')
add('MAIN-005', 'high', 'Password-change logs include both plaintext passwords',
    'changePassword calls maskSensitiveData({currentPassword,newPassword}) and prints the result. maskSensitiveData\'s allowlist of sensitive names contains password but neither currentPassword nor newPassword, so both values remain unchanged in server logs. The API logger has a separate shallow list and does not redact currentPassword either.',
    [('controllers/authController.js', '...maskSensitiveData({ currentPassword, newPassword })'), ('utils/sanitize.js', 'const sensitiveKeys = ['), ('middleware/apiLogger.js', 'const sensitiveFields = [')],
    'Do not log password-change request values. Centralize recursive redaction including currentPassword/newPassword and remove existing sensitive logs according to retention requirements.')
add('MAIN-006', 'medium', 'Malformed CSRF header causes 500 instead of controlled rejection',
    'crypto.timingSafeEqual throws when buffer lengths differ. csrfProtection does not validate that the supplied header is a 64-character hexadecimal token or compare buffer lengths first, so a malformed authenticated request reaches the global error handler and receives 500.',
    [('middleware/csrf.js', 'crypto.timingSafeEqual'), ('main_server.js', "res.status(err.status || 500)")],
    'Validate header type/format and equal byte lengths before timingSafeEqual; return 403 for every invalid token.')
add('MAIN-007', 'medium', 'CSRF token storage prevents reliable multi-tab or multi-instance use',
    'Only one token is retained for each userID:IP. Every GET token request replaces it, invalidating other tabs/devices behind the same IP. Tokens disappear on process restart and are not shared across workers, so requests can fail randomly behind a load balancer. The implementation is a server-side synchronizer token, despite comments calling it double-submit; there is no cookie comparison.',
    [('middleware/csrf.js', 'const csrfTokenStore = new Map();'), ('middleware/csrf.js', 'csrfTokenStore.set(key,'), ('middleware/csrf.js', 'const token = generateCsrfToken(req.user.userID, clientIP)')],
    'Use stable session-scoped tokens in a shared store or an appropriate signed stateless design; avoid invalidating an existing valid token every time it is requested.')
add('MAIN-008', 'medium', 'CSRF and session audit columns are never populated accurately',
    'apiLogger reads req.csrfTokenValid before csrfProtection runs; csrfProtection never writes that property at all. req.user has no sessionId. All logged requests therefore have null csrf_token_valid and session_id, even when a CSRF check passes or fails.',
    [('main_server.js', 'const authAndLog = [authMiddleware, apiLogger]'), ('middleware/apiLogger.js', 'const csrfTokenValid = req.csrfTokenValid'), ('middleware/apiLogger.js', 'const sessionId = req.user?.sessionId'), ('middleware/auth.js', 'req.user = {')],
    'Capture CSRF result when the response finishes, explicitly set pass/fail in the CSRF middleware, and define a session identifier only if the authentication design has sessions.')
add('MAIN-009', 'medium', 'Database audit logging misses auth failures and rate-limit rejections',
    'Public auth/captcha/admin-login and token endpoints do not attach apiLogger. Protected routes run authMiddleware and role checks before logger, and the global limiter runs even earlier. Login/register/password changes and unauthenticated/forbidden/global-rate-limit requests are therefore absent from api_logs despite event classification code for them.',
    [('main_server.js', "app.use('/api/auth', authRoutes)"), ('main_server.js', "app.post('/api/admin/login'"), ('main_server.js', 'const authVipAndLog'), ('main_server.js', 'app.use(globalLimiter)')],
    'Install a request-finish audit hook early enough to observe rejects, while taking user identity at finish and aggressively redacting bodies.')
add('MAIN-010', 'medium', 'Audit request paths lose the API prefix',
    'apiLogger captures req.path inside path-mounted middleware. Express has already trimmed that mount prefix, so /api/admin/users is recorded as /users and several unrelated roots as /. The event classifier also uses req.path rather than req.originalUrl/baseUrl, undermining /admin, /send-image and /zalo-accounts classification.',
    [('middleware/apiLogger.js', 'const requestPath = req.path;'), ('middleware/apiLogger.js', 'const path = req.path;'), ('main_server.js', "app.use('/api/admin', authAndLog")],
    'Record a normalized path from req.originalUrl and classify from that captured full path; keep query values separate and sanitized.')
add('MAIN-011', 'medium', 'CAPTCHA verification is not bound to the issuing IP or atomic use',
    'The verifier accepts an ip argument and stores ipAddress during creation, but its SELECT only checks captchaID, purpose, isUsed and expiry. It never compares stored IP. SELECT and UPDATE are separate, unguarded operations, so concurrent requests can both validate one challenge before either marks it used.',
    [('controllers/captchaController.js', 'exports.verifyCaptcha = async'), ('controllers/captchaController.js', 'AND purpose = ?'), ('controllers/captchaController.js', "'UPDATE captcha_sessions SET isUsed = TRUE WHERE captchaID = ?'")],
    'Bind a challenge to its intended session/context and atomically consume it with a guarded update or transaction/row lock.')
add('MAIN-012', 'medium', 'CAPTCHA answers and submitted values are printed in every environment',
    'Unconditional debug logging prints the plaintext generated answer and user-submitted answer, plus hashes and full challenge/session information. NODE_ENV does not gate these messages.',
    [('controllers/captchaController.js', "console.log('🔐 Generated text (PLAIN):'"), ('controllers/captchaController.js', "console.log('🔍 Input captchaValue:'")],
    'Remove answer/input debug output and log only non-sensitive challenge outcomes.')
add('MAIN-013', 'blocker', 'Mandatory environment configuration is dereferenced before validation',
    'Several modules execute process.env.DOCKER_HOST.trim() at import time, so a missing value throws before the server can start. MAIN_SERVER_PORT/host, DB values, JWT_SECRET and rate-limit numbers have no complete startup validation. No original .env or package manifest was included in recovered source at this analysis stage.',
    [('main_server.js', 'const DOCKER_HOST = process.env.DOCKER_HOST.trim()'), ('config/database.js', 'if (process.env.DOCKER_HOST.trim()'), ('middleware/rateLimiter.js', 'windowMs: parseInt(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS)')],
    'Supply a documented local .env, validate required values and numeric ranges before importing dependent modules, and use explicit safe defaults where intended.')
add('MAIN-014', 'medium', 'No readiness validation or automatic core schema initialization',
    'startServer calls app.listen without db.testConnection or schema migrations. /health returns success unconditionally. database.js only defines fb_setup DDL and exports initFbSetup; MAIN never invokes it. The other tables and both log views must already exist, so a green /health does not demonstrate that login or admin APIs work.',
    [('main_server.js', "app.get('/health'"), ('main_server.js', 'app.listen(PORT, HOST'), ('config/database.js', 'async function testConnection()'), ('config/database.js', 'async function initFbSetup()')],
    'Provide explicit migrations/schema and a readiness check that verifies database connectivity and required migrations, while retaining a lightweight liveness route.')
add('MAIN-015', 'medium', 'Admin self-update checks have type and omission bugs',
    'When updating the current admin, userRole !== 1 rejects requests that omit userRole, even though later code treats it as optional. Self-lock protection only recognizes numeric 0; boolean false or string 0 can pass and persist an inactive account. Incoming role, active flag and balance are otherwise not validated.',
    [('controllers/adminController.js', '&& isActive === 0'), ('controllers/adminController.js', '&& userRole !== 1'), ('controllers/adminController.js', 'if (userRole !== undefined)')],
    'Normalize and validate role/boolean/money fields once, then apply self-protection only to explicitly provided normalized changes.')
add('MAIN-016', 'medium', 'License extension can concatenate strings and lose concurrent updates',
    'count is only checked for truthiness and count < 1, so numeric strings and fractional values are accepted. license.countDown + count concatenates a string count instead of adding numerically. The result is assigned to undeclared global newCountDown and written using read-modify-write without a transaction, allowing concurrent extensions to overwrite one another.',
    [('controllers/adminProductController.js', 'const { count } = req.body;'), ('controllers/adminProductController.js', 'newCountDown = license.countDown + count;'), ('controllers/adminProductController.js', 'SET countDown = ?')],
    'Validate a finite positive integer and use an atomic UPDATE countDown = countDown + ? with a scoped result variable.')
add('MAIN-017', 'medium', 'Product statistics uses inconsistent license fields',
    'getProductStats counts licenseID and aggregates license.isActivated/license.pricePaid, while the license screens and updates use status/countDown and store purchase price in user_link_license. Without the original schema it cannot be proved which fields exist; on a schema matching the other handlers this endpoint will fail or report stale/wrong totals. Adding compatibility columns alone does not synchronize them.',
    [('controllers/adminProductController.js', 'COUNT(l.licenseID) as totalLicenses'), ('controllers/adminProductController.js', 'SUM(CASE WHEN l.isActivated = TRUE'), ('controllers/adminProductController.js', 'SUM(l.pricePaid) as totalRevenue'), ('controllers/adminProductController.js', '(SELECT SUM(pricePaid) FROM user_link_license)')],
    'Confirm the original schema and derive per-product activated counts from status and revenue from purchase records consistently.', certainty='confirmed inconsistency; actual missing-column error depends on unavailable original schema')
add('MAIN-018', 'medium', 'Multi-step destructive operations are not transactional',
    'deleteLicense removes user_link_license rows and then deletes the license in a separate query; failure of the second statement leaves the purchase links missing. deleteProduct checks for licenses and then deletes/updates without a transaction, leaving a race with purchases. DB transaction helpers exist but are unused by these controllers.',
    [('controllers/adminProductController.js', "await db.query('DELETE FROM user_link_license"), ('controllers/adminProductController.js', "const sql = 'DELETE FROM license"), ('controllers/adminProductController.js', 'const checkLicenseSql = `'), ('config/database.js', 'async function transaction(callback)')],
    'Use transactions and the appropriate foreign keys/locking; make deletions and product availability checks consistent with purchase transactions.')
add('MAIN-019', 'medium', 'Global rate limiter exempts all auth and admin routes',
    'globalLimiter skips any path starting /api/admin or /api/auth. Only the two login routes attach loginLimiter. Registration, profile and password-change endpoints, plus admin data/mutation routes, have no request limiter at this layer. CAPTCHA generation has its own 10/minute limit but the SVG answer is extractable.',
    [('middleware/rateLimiter.js', "return req.path.startsWith('/api/admin')"), ('routes/authRoutes.js', "router.post('/register'"), ('routes/authRoutes.js', "router.post('/change-password'"), ('routes/captchaRoutes.js', 'max: 10,')],
    'Define route-specific limits for registration, credential changes and expensive admin operations; avoid blanket prefix exemptions.')
add('MAIN-020', 'medium', 'Password changes do not revoke existing JWTs',
    'Authentication verifies JWT signature/expiry and checks only user existence/isActive. changePassword only updates the password hash. An already-issued token remains valid after password reset until its original expiry, including the admin login\'s fixed 7-day token. There is no implemented logout, refresh, revocation list or token version.',
    [('middleware/auth.js', 'const decoded = jwt.verify('), ('middleware/auth.js', "'SELECT userID, userName, email, userRole, isActive"), ('controllers/authController.js', "'UPDATE user SET password = ?"), ('controllers/adminController.js', "{ expiresIn: '7d' }")],
    'If password changes are intended to end other sessions, introduce token-version/session revocation and increment/revoke it on credential changes.')
add('MAIN-021', 'medium', 'New-account and credential input validation is incomplete',
    'Registration checks only presence of userName/password/email, then hashes and inserts; it does not enforce a minimum password length, email shape, string types or length bounds. Password change enforces length >= 6 but not a complete type contract. Admin creation similarly has only presence checks and defaults an omitted role to 0 although registration uses role 2.',
    [('controllers/authController.js', 'if (!userName || !password || !email)'), ('controllers/authController.js', 'if (newPassword.length < 6)'), ('controllers/adminController.js', 'userRole || 0')],
    'Use shared schemas for string type/length/email/role validation and consistent policy for registration, admin creation and password changes.')
add('MAIN-022', 'medium', 'Global leak-history lookup sends an array to one prepared placeholder',
    'getGlobalLeakHistory executes WHERE userID IN (?) with [userIDs]. The DB wrapper uses mysql2 pool.execute prepared statements, which do not expand a JavaScript array into an IN list. For non-empty multi-user history this can throw or fail to match intended IDs.',
    [('controllers/adminController.js', "'SELECT userID, userName FROM user WHERE userID IN (?)'"), ('config/database.js', 'await pool.execute(sql, params)')],
    'Generate one placeholder per validated user ID, or use an explicitly supported set-valued SQL mechanism; keep values bound individually.', certainty='confirmed prepared-statement contract mismatch; exact error depends on mysql2/server versions')
add('MAIN-023', 'medium', 'PayOS forwarding has no timeout',
    'The create, history and cancel Axios calls have no timeout. A stalled payment upstream can keep requests open indefinitely. Return/cancel URLs also always use the first CORS_ORIGIN rather than the actual allowed origin selected for the user.',
    [('routes/payosProxyRoutes.js', 'const baseUrl = process.env.CORS_ORIGIN'), ('routes/payosProxyRoutes.js', 'const response = await axios.post(`${PAYOS_URL}/api/payos/create`'), ('routes/payosProxyRoutes.js', 'const response = await axios.get(`${PAYOS_URL}/api/payos/history')],
    'Set bounded upstream deadlines/cancellation and explicitly configure the user-facing payment return URL.')
add('MAIN-024', 'medium', 'Link thumbnail upload buffers files without a limit',
    'The admin-only link upload uses multer.memoryStorage without file-size or file-type limits. Even an accidental large upload can consume server memory. The regular PNG upload has a 3 MiB limit, but trusts client-provided MIME metadata rather than file bytes.',
    [('routes/linkProxyRoutes.js', 'const upload = multer({ storage: multer.memoryStorage() });'), ('routes/uploadProxyRoutes.js', "if (file.mimetype === 'image/png')")],
    'Set explicit per-file/part limits and validate decoded image content; avoid unbounded in-memory buffering.')
add('MAIN-025', 'medium', 'Upload proxy does not propagate internal authentication',
    'Most service proxy requests carry x-internal-auth. The file-upload proxy sends only multipart headers and x-user-id, so FILES_SERVER cannot authenticate this call using the shared secret from this request. If FILES_SERVER relies only on x-user-id and is reachable directly, callers can impersonate users. Exact downstream behavior is outside this MAIN analysis.',
    [('routes/uploadProxyRoutes.js', "'x-user-id': userID //"), ('routes/zaloAccountProxyRoutes.js', "'x-internal-auth': process.env.INTERNAL_AUTH_KEY")],
    'Use authenticated internal service-to-service requests and ensure FILES_SERVER validates caller identity before trusting x-user-id.', certainty='confirmed missing header; downstream exposure requires FILES_SERVER/ingress review')
add('MAIN-026', 'medium', 'Pagination and cleanup retention bounds are not enforced',
    'Log limit/offset/days and daysToKeep are parsed without positive bounds or maximum values. Negative retention days select a future threshold and may delete recent/all logs; very large limits allow expensive responses. License list limits have a lower bound but no upper bound.',
    [('controllers/logsController.js', 'const daysToKeep = parseInt(req.query.daysToKeep) || 90;'), ('middleware/apiLogger.js', 'WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)'), ('controllers/adminProductController.js', 'const limitNum = Math.max(1, parseInt(limit) || 50);')],
    'Validate positive bounded integers, use a fixed safe retention policy or explicit validated range, and cap page sizes.')
add('MAIN-027', 'low', 'Initial tool-setup insertion replaces explicit zero prices with defaults',
    'updateToolSetup permits zero in validation but initial INSERT uses value || default for each fee. A requested free fee is silently replaced by a nonzero default when no setup row exists. Subsequent UPDATE preserves zero, making behavior depend on whether setup was initialized.',
    [('controllers/adminController.js', 'zalo_system_money || 30000.00'), ('controllers/adminController.js', 'check_data_leak_money || 5000.00')],
    'Use explicit undefined/null fallback or nullish coalescing so valid zero values persist.')
add('MAIN-028', 'medium', 'CAPTCHA and block checks fail open on database errors',
    'isCaptchaRequired returns false and isIPBlocked returns {blocked:false} on database exceptions. A missing captcha/login/IP-block table can disable extra login protection while ordinary user-table login still works. recordLoginAttempt also catches and ignores its write error, so counters can silently stop working.',
    [('controllers/captchaController.js', "console.error('Check CAPTCHA Required Error:'"), ('controllers/captchaController.js', "console.error('Check IP Blocked Error:'"), ('controllers/captchaController.js', "console.error('Record Login Attempt Error:'")],
    'Treat unavailable security state explicitly: fail closed for the affected authentication operation or use a clearly designed fallback, and validate security tables during startup.')
add('MAIN-029', 'high', 'General timer mount bypasses the VIP card-scheduling guard',
    'The same timer router is mounted at /api/send-image-by-card-timer with authVipAndLog and at /api/zalo-timer with only authAndLog. Both expose POST /send. The handler chooses /api/schedule/card for every base URL not containing v2, so a regular role-2 user can reach the same card scheduling upstream through POST /api/zalo-timer/send. MAIN therefore does not enforce the intended VIP/admin gate consistently; a separate upstream check would be needed to prevent actual scheduling.',
    [('main_server.js', "app.use('/api/send-image-by-card-timer'"), ('main_server.js', "app.use('/api/zalo-timer'"), ('routes/zaloTimerProxyRoutes.js', "const endpoint = req.baseUrl.includes('v2')")],
    'Mount only read-only history at the general timer path, or apply the VIP/admin guard to its scheduling handler; enforce the same rule upstream.', certainty='confirmed gateway authorization bypass; successful scheduling additionally depends on missing timer upstream')

mounts = {
 'authRoutes.js': [('/api/auth','public or bearer by endpoint','local')],
 'captchaRoutes.js': [('/api/captcha','public','local')],
 'adminRoutes.js': [('/api/admin','admin (1)','local')],
 'adminProductRoutes.js': [('/api/admin','admin (1)','local')],
 'logsRoutes.js': [('/api/logs','any active authenticated user; admin paths lack role check','local')],
 'zaloAccountProxyRoutes.js': [('/api/zalo-accounts','any active authenticated user','ZL_SERVER')],
 'zaloOaProxyRoutes.js': [('/api/zalo-oa','admin (1)','ZL_SERVER')],
 'sendImageProxyRoutes.js': [('/api/send-image','any active authenticated user','ZL_SERVER')],
 'sendImageV2ProxyRoutes.js': [('/api/send-image-v2','admin (1) or VIP (3)','ZL_SERVER')],
 'sendImageByCardProxyRoutes.js': [('/api/send-image-by-card','admin (1) or VIP (3)','ZL_SERVER')],
 'zaloTimerProxyRoutes.js': [('/api/send-image-v2-timer','admin (1) or VIP (3)','ZL_TIMER_SERVER'),('/api/send-image-by-card-timer','admin (1) or VIP (3)','ZL_TIMER_SERVER'),('/api/zalo-timer','any active authenticated user','ZL_TIMER_SERVER')],
 'uploadProxyRoutes.js': [('/api/zalo/upload-custom-image','any active authenticated user','FILES_SERVER')],
 'checkStatusProxyRoutes.js': [('/api/check-status','admin (1) or VIP (3)','ZL_SERVER')],
 'licenseProxyRoutes.js': [('/api/licenses','any active authenticated user','ZL_SERVER')],
 'checkIpProxyRoutes.js': [('/api/check-ip','any active authenticated user','MINI_SERVICE_SERVER')],
 'dataFindProxyRoutes.js': [('/api/leak-lookup','admin (1)','DATA_FIND_SERVER')],
 'linkProxyRoutes.js': [('/api/link','admin (1)','LINK_SERVER')],
 'payosProxyRoutes.js': [('/api/payos','any active authenticated user','CASH_PAYOS')],
}
endpoints = []
for name, entries in mounts.items():
    file = 'routes/' + name
    for n, line in enumerate(SOURCES[file].splitlines(), 1):
        m = re.search(r"router\.(get|post|put|delete|patch)\('([^']+)'", line)
        if not m: continue
        for mount, role, service in entries:
            method, subpath = m.groups()
            path = mount + (subpath if subpath != '/' else '')
            auth = role
            if name == 'authRoutes.js': auth = 'public' if subpath in ('/register','/login') else 'any active authenticated user'
            csrf = method not in ('get','head','options') and name not in ('authRoutes.js','captchaRoutes.js')
            endpoints.append({'method':method.upper(),'path':path,'authorization':auth,'csrf_required':csrf,'implementation':service,
                              'file':'recovered/MAIN_SERVER/'+file,'line':n,'declaration':line.strip()})
for method,path,auth,needle in [('GET','/health','public',"app.get('/health'"),('GET','/api/csrf-token','any active authenticated user',"app.get('/api/csrf-token'"),('POST','/api/admin/login','public (admin credentials required)',"app.post('/api/admin/login'")]:
    endpoints.append({'method':method,'path':path,'authorization':auth,'csrf_required':False,'implementation':'local',**cite('main_server.js',needle)})

table_columns = {
 'user':'userID userName password email userRole totalMoney isActive lastLogin lastIP createdAt updatedAt',
 'captcha_sessions':'captchaID captchaText ipAddress purpose isUsed expiresAt',
 'login_attempts':'ipAddress userName attemptType isSuccess attemptTime',
 'ip_blocks':'blockID ipAddress blockType reason failedAttempts blockedAt expiresAt isActive',
 'api_logs':'ip_address user_agent request_method request_path request_query userID userName request_body response_status response_time event_type event_category event_description error_message session_id csrf_token_valid rate_limit_hit created_at',
 'tool_setup':'STT uid_zalo_system zalo_system_money zalo_custom_money check_phone_system_money check_phone_custom_money check_card_money check_data_leak_money',
 'zalo_account':'UID displayName phoneNumber Avatar accStatus ImportTime',
 'auto_request':'reqID phoneNumber UID displayName imageUrl sendResult Detail created_at fee_charged use_system_account sender_zalo_uid',
 'user_link_auto_request':'reqID userID',
 'product':'productID productName productDesc productOnePrice productFivePrice productTenPrice productImage isActive createdAt updatedAt',
 'license':'licenseID licenseKey productID isActivated pricePaid status activeTime createdAt updatedAt countDown',
 'user_link_license':'licenseKey userID pricePaid purchaseTime',
 'fb_setup':'id group_scan_price member_scan_price post_scan_price updatedAt',
}
tables = []
for table,cols in table_columns.items():
    refs=[]
    for file,source in SOURCES.items():
        for n,line in enumerate(source.splitlines(),1):
            if re.search(r'\b(?:FROM|JOIN|INTO|UPDATE|TABLE IF NOT EXISTS)\s+'+re.escape(table)+r'\b',line,re.I):
                refs.append({'file':'recovered/MAIN_SERVER/'+file,'line':n,'excerpt':line.strip()})
    tables.append({'name':table,'columns_seen_in_MAIN_SQL':cols.split(),'ddl_in_original_source':table=='fb_setup','references':refs})

services = [
 {'name':'MySQL/MariaDB','source_included':False,'required_for':'Authentication, roles, balances, captcha, IP blocks, logs, admin configuration, product/license records','config':['DB_HOST','DB_PORT','DB_USER_MAIN','DB_PASSWORD_MAIN','DB_NAME','DB_CONNECTION_LIMIT'],'notes':'No original dump/migrations; analysis/main-schema-inferred.sql is a synthetic approximation.'},
 {'name':'ZL_SERVER','source_included':True,'required_for':'Zalo account CRUD/import/status, immediate image sending, phone/card lookup, OA templates/tokens/results, license catalog and purchases','config':['ZL_SERVER_HOST','ZL_SERVER_PORT','INTERNAL_AUTH_KEY'],'notes':'Not executed as part of this read-only task; obfuscated implementation reviewed separately.'},
 {'name':'FILES_SERVER','source_included':True,'required_for':'Custom PNG upload and hosted image retrieval','config':['FILES_SERVER_HOST','FILES_SERVER_PORT'],'notes':'Proxy forwards multipart custom_image + x-user-id; shared-secret header absent.'},
 {'name':'ZL_TIMER_SERVER','source_included':False,'required_for':'Scheduled v2/card sending and history','config':['ZL_TIMER_SERVER_HOST','ZL_TIMER_SERVER_PORT','INTERNAL_AUTH_KEY'],'upstream_paths':['POST /api/schedule/v2','POST /api/schedule/card','GET /api/history/:userID']},
 {'name':'MINI_SERVICE_SERVER','source_included':False,'required_for':'IP geolocation lookup','config':['MINI_SERVICE_SERVER_HOST','MINI_SERVICE_SERVER_PORT','INTERNAL_AUTH_KEY'],'upstream_paths':['POST /api/check-ip/location']},
 {'name':'DATA_FIND_SERVER','source_included':False,'required_for':'Admin phone/email leak lookup, fee precheck/confirm, own and global history','config':['DATA_FIND_SERVER_HOST','DATA_FIND_SERVER_PORT','INTERNAL_AUTH_KEY'],'upstream_paths':['POST /api/search','POST /api/pre-check','POST /api/confirm','GET /api/history/:userID','GET /api/admin/history']},
 {'name':'CASH_PAYOS','source_included':False,'required_for':'Create deposit payment, history and cancel; provider callbacks and balance updates are outside MAIN','config':['PAYOS_HOST','PAYOS_PORT','INTERNAL_AUTH_KEY'],'upstream_paths':['POST /api/payos/create','GET /api/payos/history','POST /api/payos/cancel']},
 {'name':'LINK_SERVER','source_included':False,'required_for':'Metadata fetch, domains/templates/links, thumbnail upload, result tracking','config':['LINK_SERVER_HOST','LINK_SERVER_PORT','INTERNAL_AUTH_KEY'],'notes':'Host defaults to 127.0.0.1; port defaults to 3130.'},
]

report = {
 'scope':'Static review of recovered/MAIN_SERVER only; source was read, never imported or executed by this analysis script.',
 'source_note':'Leading File: metadata is not JavaScript. It was stripped during recovery by parent; citations use current recovered files after stripping.',
 'line_number_convention':'1-based lines in recovered source, not the uploaded source container/dump.',
 'source_hashes':{k:hashlib.sha256(v.encode()).hexdigest() for k,v in SOURCES.items()},
 'architecture':{'entrypoint':'recovered/MAIN_SERVER/main_server.js','purpose':'Express authentication/authorization and service routing hub','port':'MAIN_SERVER_PORT (comment mentions 3100; no code default)','dotenv':'recovered/.env, resolved from ../.env with override:true','database':'mysql2/promise connection pool; pool.execute returns rows through custom db.query','roles':{'1':'admin','2':'regular registered user','3':'VIP','0':'default in admin createUser when role omitted; not documented consistently'},'authentication':'Bearer JWT required; current user role and active state re-read from DB on every request; password hashes bcryptjs for regular auth and bcrypt for admin','jwt_lifetimes':'Registration/login JWT_EXPIRE or 24h; admin login hard-coded 7d; no refresh/logout/revocation implementation','csrf':'Server-side synchronizer token stored in Map per userID:IP; 32 random bytes as 64 hex characters, 1h expiry, cleanup every 10min; safe methods exempt','middleware_order':['Helmet','CORS allowlist (no Origin allowed)','JSON/form body parsers','Morgan','globalLimiter','request console logging','routes: auth, role guard where present, API logging, CSRF, handler'],'proxy_trust':'trust proxy=1; custom IP parsers also directly trust forwarded headers','internal_routing':'Mostly HTTP upstream requests with x-internal-auth; authenticated userID appended after client fields so caller cannot override it; upload is exception using only x-user-id.'},
 'features':[
  {'name':'Regular account lifecycle','capabilities':['Register with required CAPTCHA; new role 2 and balance 0','Login by username + bcrypt password','Authenticated sanitized profile/balance','Change password with current password and minimum new length 6'],'limitations':['No email verification/recovery/reset/refresh/logout route','No original admin seed included']},
  {'name':'Admin user management','capabilities':['Dedicated admin login','List/read/create/update/delete users','Change roles, active state, balances/passwords','Prevent self-delete and intended self-lock/demotion','Aggregate user, Zalo, request and fee statistics']},
  {'name':'CAPTCHA and IP blocks','capabilities':['6 mixed-case alphanumeric characters returned as base64 SVG','UUID challenge, SHA256 answer stored in DB, purpose register/login/admin_login, five-minute lifetime','Require login CAPTCHA after 2 failures within 15min','10 accumulated failures within 30min triggers 15min block','Admin block/list/unblock IPs','Generation limit 10 per minute'],'limitations':['Failed counters combine all attempt types for blocking','Successful login deletes failed attempts for that IP/type; successful attempts are not recorded','No cleanup scheduler for expired DB captcha/attempt/block records in MAIN']},
  {'name':'Zalo accounts','capabilities':['List/detail/import/update/delete','Auto-fetch account','Single/all-account status checks'],'upstream':'ZL_SERVER'},
  {'name':'Immediate image sending','capabilities':['Standard send/history/stats for authenticated users','VIP/admin v2 phone search/send/account list','VIP/admin card/FID decode/send/personal-account list'],'upstream':'ZL_SERVER'},
  {'name':'Scheduled sending','capabilities':['VIP/admin v2 or card scheduling','Timer history, also exposed through general authenticated /api/zalo-timer'],'upstream':'ZL_TIMER_SERVER (missing)'},
  {'name':'Zalo OA administration','capabilities':['Token/read-refresh','Template CRUD/fetch latest','Send templates by phone or UID','Results/preview/status'],'authorization':'admin only','upstream':'ZL_SERVER'},
  {'name':'Tool pricing','capabilities':['Select system Zalo UID','Configure system/custom send fees, system/custom phone lookup, card lookup and data-leak lookup fees','Auto-create default tool_setup row on GET when table is empty']},
  {'name':'License storefront and administration','capabilities':['Authenticated catalog/license list/purchase proxy','Admin product CRUD/pricing (1/5/10 tiers)','Admin license list/filter/detail/revoke/usage-count extension/delete and statistics'],'upstream':'Purchase/catalog through ZL_SERVER; admin CRUD local SQL'},
  {'name':'IP lookup','capabilities':['Authenticated IP location lookup'],'upstream':'MINI_SERVICE_SERVER (missing)'},
  {'name':'Leak lookup','capabilities':['Admin phone/email lookup','Fee/balance precheck and payment-confirmed lookup','Own lookup history and global enriched admin history'],'upstream':'DATA_FIND_SERVER (missing)'},
  {'name':'Link management','capabilities':['Admin website metadata fetch','Template/domain CRUD','Link list/create/update','Thumbnail upload','Link/thumbnail result lists'],'upstream':'LINK_SERVER (missing)'},
  {'name':'File upload','capabilities':['Authenticated custom PNG upload, field custom_image, 3 MiB limit, forwarded in memory'],'upstream':'FILES_SERVER'},
  {'name':'Payments','capabilities':['Authenticated deposit creation, history and manual cancel','Return/cancel URLs point to first configured frontend origin + /dashboard.html'],'upstream':'CASH_PAYOS (missing)'},
  {'name':'Audit logs','capabilities':['Request timing, status, event/category, user/IP/body/query/error capture','Own/global/other-user log queries, stats/security alerts/search/cleanup'],'limitations':['Authorization and DB-shape bugs detailed in findings','Async insert on response finish; logger DB failure never blocks response']},
  {'name':'Operations','capabilities':['JSON health endpoint','Helmet/CORS/Morgan/global+login limiters','Signal-based database-pool shutdown'],'limitations':['Health does not test dependencies','No source package manifest/lockfile or original schema included']},
 ],
 'endpoint_count':len(endpoints),'endpoints':endpoints,
 'sql':{'tables':tables,'views':[{'name':'v_api_logs_with_user','columns_seen':['*','userID','created_at'],'definition_included':False},{'name':'v_security_alerts','columns_seen':['*','created_at','alert_type'],'definition_included':False}],'schema_artifact':'analysis/main-schema-inferred.sql','schema_warning':'Only fb_setup has original DDL. All other types/defaults/indexes/view definitions are inferred for local synthetic data, not an original schema.'},
 'services':services,
 'external_npm_dependencies':sorted(set(re.findall(r"require\('([^'./][^']*)'\)", '\n'.join(SOURCES.values()))) - {'crypto','path'}),
 'environment_variables':sorted(set(re.findall(r'process\.env\.([A-Z_0-9]+)', '\n'.join(SOURCES.values())))),
 'findings':F,
 'verification_limits':['Static inspection only: no external provider/network calls, source execution, production DB or real user data were used.','Dependencies versions are unknown because no original package manifest/lockfile was recovered.','Missing upstream functions cannot be verified through a successful MAIN health response.','Some issues depend on original schema/ingress versions; those findings explicitly state that uncertainty.','No source edits made by this analysis task; the parent handles runtime setup.'],
}
out = ROOT/'analysis'/'main-findings.json'
out.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'output':str(out),'endpoints':len(endpoints),'tables':len(tables),'findings':len(F)},ensure_ascii=False))
