---
name: "Unit Tests"
description: "Unit test boilerplate, conventions, and test case guide for zBoard API route business logic and data transformations."
applyTo: "**/tests/**"
---

# Unit Tests

## Purpose

These unit tests target the **pure business logic and config-branch decision functions** across the CI, rotation, timeline, ticketing, and monitoring API handlers. 

---


## Conventions

- **`jest.mock` path must exactly mirror the import string in the source file.** `circle_build_status.ts` imports `'../../../config/build_status.config'`, so `jest.mock` must use that exact string.

- **Colocate tests at `src/pages/api/__tests__/`, one `.test.ts` per route file.** Keeps test discovery (`jest --testPathPattern api`) natural and prevents a diverging top-level `__tests__` tree that goes out of sync as routes are added or renamed.

- **Mutate the mocked config reference within tests instead of calling `jest.resetModules()`.** Config constants like `const circleCIConfig = buildStatusConfig.datasource.circleCI` are evaluated once at module load. Mutate via `require(...)` and restore in `afterEach` — it is 10–20× faster than re-requiring the module per test.

- **Never mock `lodash` for `_.orderBy` — test with ≥2 fixture items in the correct and reversed order.** The sort direction (`'desc'`) and `[0]` selection are exactly the bug surface: a single-item array makes both pass vacuously. Provide two items in the wrong order and verify the result picks the right one.

- **Use `jest-fetch-mock` rather than `jest.spyOn(global, 'fetch')`.** Node 18's built-in `fetch` type differs subtly from `node-fetch`. `jest-fetch-mock` provides `mockResponseOnce` queuing and call count assertions that precisely match the sequential multi-fetch pattern in `fetchTickets`'s pagination loop and `fetchPipelines`/`fetchWorkflows`'s paired calls.

---

## Test Case Guide

**`getCIStatus` — build_status.ts**
- [ ] Both `circleCI.enabled=false` AND `github.enabled=false` → calls `getBuildStatusFakeData`, skips both fetchers
- [ ] At least one datasource enabled → calls `Promise.all([getAllCircleBuildStatus, getAllGitHubStatus])` and returns `.flat()` merged array

**`getAllCircleBuildStatus` — circle_build_status.ts**
- [ ] `circleCIConfig.enabled=false` → returns `[]`, zero fetch calls
- [ ] `pipelines.items` ordered by `updated_at` desc → `items[0]` is the most recent pipeline
- [ ] `vcs.commit.subject` present → used as `commitSubject`
- [ ] `vcs.commit` is `null` → `commitSubject` equals `'automatically triggered'`
- [ ] `fetchPipelines` response `!ok` → throws `Error` with `JSON.stringify(responseBody)`
- [ ] `fetchWorkflows` response `!ok` → throws `Error` with `JSON.stringify(responseBody)`
- [ ] `workflows.items` ordered by `created_at` desc → `items[0].status` used as build status

**`getAllGitHubStatus` — github_build_status.ts**
- [ ] `github.enabled=false` → returns `[]`
- [ ] `workflowRun.status === 'completed'` → `result.status` equals `workflowRun.conclusion`
- [ ] `workflowRun.status !== 'completed'` (e.g. `'in_progress'`) → `result.status` equals the raw status
- [ ] `triggering_actor` is `null` → `username` and `avatarUrl` are `undefined` (optional chaining `?.`)
- [ ] `head_commit` is `null` → `commitSubject` is `undefined`
- [ ] Response `!ok` → throws formatted JSON error string

**`buildCardInfo` — project_timeline.ts**
- [ ] `card.column_id` exists in `monitorColumns` → `status` is the column `name`
- [ ] `card.column_id` not in `monitorColumns` → `status` is `undefined`
- [ ] `co_owner_ids` is `undefined`/`null` → `coOwners` is `undefined` (optional chaining `?.map`)
- [ ] `buildUserInfo` returns `null` for unrecognized `owner_user_id` → `owner` is `null`


**`getMonitorColor` — datadog.ts**
- [ ] `counts` is `undefined` → `'grey'`
- [ ] `counts.status` is `undefined` → `'grey'`
- [ ] `counts.status` is `[]` → `'grey'`
- [ ] `counts.status` contains `{ name: 'Alert' }` → `'red'`
- [ ] `counts.status` has items, none named `'Alert'` → `'green'`

**`getAllBuildStatus` / `fetchTickets` — ticket_status.ts**
- [ ] `zendeskConfig.enabled=false` → returns fake data, no fetch
- [ ] Single page (`next_page: null`) → returns tickets from one response only
- [ ] Multi-page (`next_page` set, then `null`) → concatenates all pages into `allTickets`
- [ ] Any page returns `!response.ok` → throws `Error('failed to fetch zendesk tickets')`

**`getAllOwners` — owner_rotation.ts**
- [ ] `localData.enabled=true` → returns `localData.rotations` reference directly, no async calls
- [ ] `localData=false`, `apiTable.enabled=true` → calls `fetchFieldsFromApiTable` per rotation, returns sorted members
- [ ] `localData=false`, `apiTable=false`, `googleSheet.enabled=true` → calls `fetchFieldsFromGoogleSheet`
- [ ] All three disabled → returns fake data via `delay1s(getOwnerRotationFakeData)`

**`sortMembers` — owner_rotation.ts**
- [ ] All rows pass `/^\d{4}-\d{2}-\d{2}$/` → sorted ascending by `startDate`, mapped to `{ name, startDate, endDate }`
- [ ] Any row fails the date pattern (e.g. `'01/01/2026'`) → returns `[]`
- [ ] `rows` is `undefined` or `[]` → returns `[]`
- [ ] Two rows with equal `startDate` → order is stable (no crash)

**`calculateStartEndDate` — project_timeline.ts**
- [ ] Transition matching `startColumns` found → uses its `.start` as `startDate`
- [ ] Transition matching `endColumns` found → uses its `.start` as `endDate`
- [ ] No `endColumns` transition, `deadline` non-empty → uses `deadline` as `endDate`
- [ ] No `endColumns` transition, no `deadline` → `endDate = startDate + defaultIterationWeeks weeks`
- [ ] `transitions` is `undefined` or `[]` → `startTime`/`endTime` are both `undefined`, produces `'Invalid date'` (known edge case, document behavior)
