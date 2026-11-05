# Yêu cầu chia sẻ số điện thoại

User requested this feature after accepting the proposed voluntary sharing flow. Implement directly in the existing local workspace; no public deployment or provider messages.

## Intent and approach

Create a one-use link the requester copies and sends themselves. The recipient opens a separate form, sees requester and purpose, and explicitly agrees before submitting a phone number, or declines. A submitted number is self-reported and does not verify the identity or ownership of a Zalo UID.

Alternatives: OA information-request messages require OA setup, correct OA-scoped UID and provider delivery that this package cannot currently demonstrate. A manual link works with existing infrastructure and needs no Zalo session. Use the manual link approach; automatic messages are outside this change.

## Behavior

- Add `#phone-share` with create, search, status filter, copy/open link, revoke pending request and delete request/results.
- Optional recipient label and UID are requester-supplied notes. No inference of phone number from UID, no matching by name, no automatic contact update or money charge.
- Require purpose, choose 24/72/168 hour expiry (default 72). States: pending, shared, declined, expired, revoked.
- Recipient form uses an unchecked consent checkbox, phone validation/normalization, decline action, and confirmation. Never labels a self-reported number verified. Public reads/submission responses never return the stored number, UID, owner ID or all requests.
- Owner APIs authenticate bearer against MAIN `/api/auth/profile`, scope every operation to that user ID, and reject inactive accounts. Request body cannot change owner or requester name.
- Store live records privately in `.runtime/phone-share.json`, outside web root and source package. Persist atomically. Do not log phone, bearer or link token. Limit input, request rate and record count; fail closed on storage/auth failure.
- Random 256-bit tokens in URL fragments; no tokens in URL path/query. Links can be forwarded; they do not prove who answered. Revocation/expiry prevents further response. Deletion erases record and response.
- Demo lives in separate browser storage, makes no provider/API requests, clearly identifies simulation and works only in the same browser. Reset demo clears these records too.
- Default service stays loopback. External recipients need separately deployed HTTPS hosting and `PHONE_SHARE_BASE_URL`; no deployment occurs here. Display a clear localhost limitation.
- Existing recovered JS remains unchanged. No new dependencies.

## Files

Shared pure model `web/phone-share-model.js`; demo storage `web/phone-share-demo.js`; owner screen `web/modules/phone-share.js`; recipient `web/share-phone.html`, `web/share-phone.js`; live store/router `ui/phone-share.cjs`. Integrate in `web/app.js`, `web/data.js`, `ui/server.cjs` and CSS. Tests cover boundaries, consent, terminal states, isolation, persistence and demo/live separation.
