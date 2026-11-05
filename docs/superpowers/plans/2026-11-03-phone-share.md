# Phone Share Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add a working voluntary phone sharing request flow to the local PA03 UI.

**Architecture:** One pure model serves Node and browser demo. UI service adds owner-authenticated local APIs and token-authorized recipient APIs; private JSON storage persists live records. A standalone recipient form and dashboard page use these contracts.

**Tech Stack:** Existing Node 24, Express 4, browser ES modules, node:test.

**Spec:** `docs/superpowers/specs/2026-11-03-phone-share-design.md`

## Global Constraints

- Existing recovered JS remains unchanged. No new dependencies.
- No public deployment or provider messages.
- Only owner can see phone; public responses never disclose it.
- Consent unchecked initially; no OTP/UID verification claims.
- Default expiry 72h; supported 24/72/168h.

## Review Focus

- Cross-owner reads, spoofed userID and forged tokens fail closed.
- Replayed, revoked or expired link cannot submit or reveal a number.
- Consent false/string/omitted cannot save phone.
- Demo/reset cannot access or mutate live data; failed storage must not claim success.
- Forwarded link and loopback reachability limitations are visible to both users.

### Task 1: Model and live API

**Files:** `web/phone-share-model.js`, `ui/phone-share.cjs`, `ui/server.cjs`, `tests/phone-share.test.cjs`.

**Interfaces:** `createPhoneShareRouter({ upstream, storeFile, baseURL, clock })`; owner `/api/phone-share/requests`; recipient `/ui/phone-share/read`, `/ui/phone-share/respond`.

- [x] Write tests for authenticated create/list, owner isolation, explicit consent, phone normalization, one-use, expiry, revoke/delete, persistence, public redaction, origin and input limits.
- [x] Run tests: fail because feature routes missing (7 failures, HTTP 404).
- [x] Implement model/router/storage and serve `/share-phone`.
- [x] Run tests: all pass.

### Task 2: Demo and screens

**Files:** `web/phone-share-demo.js`, `web/modules/phone-share.js`, `web/share-phone.html`, `web/share-phone.js`, `web/app.js`, `web/data.js`, `web/styles.css`, `tests/phone-share-demo.test.mjs`.

**Interfaces:** reuse model; `demoShareApi(storage, owner, route, method, body)`; `demoPublicRead`, `demoPublicRespond`; dashboard `renderPhoneShare(route,app)`.

- [x] Write demo tests: no network, recipient response persists to owner list, reset erases it, invalid/expired/replayed input fails.
- [x] Run and confirm missing behavior (4 failures, unsupported demo API).
- [x] Implement dashboard and recipient form with truthful mode/status labels, copy fallback, link limits and optional UID notes.
- [x] Run `npm.cmd run test:ui` and syntax checks.

### Task 3: Verify and deliver

**Files:** documentation, `.env.example`, package; runtime ignored evidence only.

- [x] Start local services with validated tracked process script; previous service PIDs were absent and ports unoccupied.
- [x] Browser verify demo create/open/consent/decline/revoke, copy, card-to-request prefill, mobile layout; live API create/respond/delete checked through normal local login. Delete and reset behavior covered by automated synthetic tests.
- [x] Fresh code review; resolve material findings with regression tests.
- [x] Run UI tests (38/38), backend share smoke (11/11), startup smoke (29/29), original source audit (73 syntax-valid); package excludes runtime records/secrets.
- [x] Document usage, localhost and self-reported identity limits; working UI at `http://127.0.0.1:13103/#phone-share`.

## Execution ledger

- User authorized implementation of the proposed consent flow. Native execution in existing `codex/ui-preview` unborn branch; no commits or worktree migration of the user's untracked source.
- Preflight: Node consumes browser model with synchronous `require(esm)` (Node >=24.11.0); demo and public page share browser storage. Existing data adapter adds CSRF to writes; share APIs also require bearer, JSON and same-origin validation.
- Task 1 complete: 7 new server tests RED→GREEN. Task 2 complete: 4 new demo tests RED→GREEN; 36/36 suite passed initially.
- Browser regression: navigating responded token A → pending token B in same tab showed A (RED). Added hashchange loader + version guard; browser verified A terminal → B pending (GREEN).
- Fresh review: no critical defects. Important local-reachability warning missing on recipient; added shared frame for pending/terminal/error and 2 rendering regressions RED→GREEN, 38/38 full suite. Neutral terminal wording now avoids assigning another respondent's consent to the current viewer.
- Reviewer declined deployment, multi-process JSON writes, unrelated original authentication/provider bugs and browser visuals; each remains outside scope except browser visuals, which were checked by main implementer.
- Backend-specific verification: 11/11 normal-auth local checks; synthetic phone only, request deleted, no provider calls. Original backend startup smoke: 29/29 passed.
- Final verification: 38/38 automated tests; all 73 recovered JS byte hashes unchanged. Browser creator/recipient at 390px and default desktop have no horizontal page overflow; no console errors. Screenshots in `docs/images/phone-share-owner.jpg` and `phone-share-recipient.jpg` contain synthetic data only.
