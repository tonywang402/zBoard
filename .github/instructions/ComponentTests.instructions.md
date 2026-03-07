---
name: "Component Tests"
description: "Component test boilerplate and test case guide for zBoard UI state transitions and date-based rendering logic."
applyTo: "**/tests/**"
---

# Component Tests

## Purpose

Component tests in zBoard target **feature logic embedded in UI components** . The bar for writing a component test is: *does this component contain branching logic, derived state, or data transformation that could silently produce the wrong output?*

Tests should **not** assert hex colors, CSS class names, padding, or Chakra UI token values. Assert rendered text, `data-testid` presence, and conditional sub-tree mounting.

---

## Conventions


## Test Case Guide

### `BuildStatusCard` — `src/components/BuildStatusCard.tsx`

**Color scheme derivation**
- [ ] Each color group renders the correct scheme: green (success/completed), blue (running/in_progress), yellow (waiting), purple (on_hold/action_required), gray (canceled/skipped/queued/pending/stale), red (failed/failure/timed_out/startup_failure)
- [ ] Unknown/unrecognized status string falls back to `red`

**Conditional `AcknowledgeBox` mount**
- [ ] Red-scheme statuses (e.g. `failed`) render `AcknowledgeBox` in the card footer
- [ ] Non-red statuses (e.g. `success`, `running`, `on_hold`) do **not** render `AcknowledgeBox`
- [ ] Unknown status (falls back to red) **does** render `AcknowledgeBox`

**Field rendering**
- [ ] All fields (`projectName`, `status`, `branch`, `username`, `commitSubject`) are rendered in the card
- [ ] `stopTime` is formatted as `YYYY-MM-DD HH:mm:ss`, not the raw ISO string

**Edge cases**
- [ ] Empty or missing string fields render without crashing
- [ ] `stopTime: ''` → displays `'Invalid date'` without crashing

---

### `BuildStatusOverview` — sort order (`statusPriority`)

- [ ] Actively running jobs (`in_progress`, `running`) sort before blocked jobs (`on_hold`, `queued`)
- [ ] Blocked jobs sort before failures (`failed`, `startup_failure`, `timed_out`)
- [ ] Failures sort before terminal/neutral states (`canceled`, `skipped`, `stale`)
- [ ] Successes (`success`, `completed`) appear last

