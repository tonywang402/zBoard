# CI/CD Build Status Monitoring

This feature gives your team a real-time at-a-glance view of all monitored CI/CD pipelines on a single screen. It supports **CircleCI** and **GitHub Actions** simultaneously.

## What You See

Each monitored pipeline is displayed as a **color-coded card**. Each card shows:
- **Pipeline name** (project name)
- **Status badge** (e.g. `failed`, `running`)
- **Timestamp** of the last run
- **Committer avatar, username, and branch name**
- **Commit message** of the triggering commit

The card color immediately communicates the pipeline's health:

| Color | Statuses |
|---|---|
| 🟢 Green | `success`, `completed` |
| 🔵 Blue | `running`, `in_progress` |
| 🟡 Yellow | `waiting` |
| 🟣 Purple | `on_hold`, `action_required` |
| ⚫ Gray | `canceled`, `cancelled`, `skipped`, `queued`, `requested`, `pending`, `stale` |
| 🔴 Red | `failed`, `failure`, `timed_out`, `startup_failure` |


## Failure Detail on Hover

When a build card is red, hovering over it reveals a **popover**. When failure detail data is available, the popover is organized hierarchically:

- Each **failed job** is listed as a bold heading.
- Below each job, the **failed or timed-out steps** are listed by name.

If no failed job/step detail is available, the popover still appears and may only show the `Failed Jobs` title.

This lets you identify the root cause without leaving the dashboard or opening GitHub. The popover appears on hover and does not affect the card's layout or size.

> For GitHub Actions pipelines, failed job/step details are available when the API returns them.

### Rerun (GitHub Actions)

For eligible GitHub Actions red cards, a **rerun icon** appears to the right of the `Failed Jobs` title in the hover popover.

From a user perspective:
- Click the rerun icon on a `startup_failure` card to request **rerun the full workflow run**.
- Click the rerun icon on other eligible red cards to request **rerun failed jobs** for that workflow run.
- While the request is in progress, the icon is temporarily disabled and shows a loading state.
- On success, a confirmation toast appears, and the board refreshes to show the latest status.
- If rerun is not available for that card, the icon is simply not shown.

## Card Sort Order

Cards are not displayed in arbitrary order. They are sorted in two stages:

1. **By `level` first** — `high` cards appear first, then `medium`, then `low`.
2. **By urgency within each level** — actively running builds appear first, followed by holds and queues, then failures, and finally successes at the bottom.

If `level` is omitted, it is treated as `medium`.

## Refresh

The board auto-refreshes every **60 seconds** (configurable). A manual refresh button is also available.

## Configuration

Pipelines to monitor are declared in `build_status.config.js`. Each entry specifies the project name, `level`, repository slug / owner+repo, branch, and workflow ID (for GitHub Actions). Either or both providers can be enabled independently.

**CircleCI example:**
```js
circleCI: {
  enabled: true,
  apiToken: process.env.CIRCLE_CI_API_TOKEN,
  projects: [
    {
      projectName: 'my-service',
      level: 'high',
      projectSlug: 'gh/my-org/my-service',
      branch: 'main',
    },
  ],
}
```

**GitHub Actions example:**
```js
github: {
  enabled: true,
  apiToken: process.env.GITHUB_API_TOKEN,
  baseUrl: 'https://api.github.com',
  projects: [
    {
      projectName: 'my-service',
      level: 'high',
      owner: 'my-org',
      repo: 'my-service',
      branch: 'main',
      workflowId: 123456,
    },
  ],
}
```

> Valid `level` values are `high`, `medium`, and `low`.
>
> Workflow IDs can be looked up via `https://api.github.com/repos/OWNER/REPO/actions/workflows`.
>
> When no token is configured, the board displays realistic fake data so the UI is fully functional out of the box.
