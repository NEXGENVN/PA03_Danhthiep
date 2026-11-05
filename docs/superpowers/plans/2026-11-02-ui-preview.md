# PA03 UI implementation plan

**Goal:** Complete local Vietnamese UI for 31 existing feature groups, with honest demo and live modes.

**Spec:** docs/superpowers/specs/2026-11-02-ui-design.md

- [x] Build shared shell, components and responsive style in web/.
- [x] Implement isolated demo/API client with meaningful tests and original endpoint contracts.
- [x] Implement Zalo/OA module and workspace/commerce/admin module against shared contract.
- [x] Add loopback UI server/proxy and tests; wire start/stop/package scripts.
- [x] Verify all routes and representative actions in browser; fix console/layout problems.
- [x] Fresh review, current backend smoke, source package, handoff with local URL.

## Decisions

- Work additively in current project on codex/ui-preview: repository has no initial commit and all recovered source is untracked; a linked worktree would omit it. No original business source is modified.
- Default demo fulfills user's request to inspect all functionality despite missing original services. Existing backend is explicitly optional live mode. All sample states remain labeled.
- Current scope is local viewing and API wiring; no provider integration rebuild or public hosting.

## Verification and review fixes

- 25 adapter/server tests pass; current 29 backend smoke checks pass.
- Browser: 24 routes; 48 responsive checks at 1440 and 390 pixels; no page overflow or JS errors.
- Browser workflows: phone mock send, five-use mock license, OA candidate review/save, product create, reset; real local backend login/read.
- Auth cancellation with saved session reproduced mode isolation bug in browser before fix; after fix cancel preserves previous mode and rerenders. Auth-tab changes carry the original mode.
- Fresh review also found lost compound live send responses, stale cached CSRF, discarded OA candidates and page-only license filtering. Each corrected; adapter regressions green, module contract checks and browser import verified.
- Mobile grid/table overflow reproduced then fixed by min-width constraints; all routes rechecked after fix.
- Original business JS hashes remain unchanged. No provider operations or public hosting.
