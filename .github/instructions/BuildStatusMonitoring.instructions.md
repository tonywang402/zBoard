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


## Card Sort Order

Cards are not displayed in arbitrary order. They are sorted by urgency — actively running builds appear first, followed by holds and queues, then failures, and finally successes at the bottom. This means the most actionable pipelines are always at the top of the board.

## Refresh

The board auto-refreshes every **60 seconds** (configurable). A manual refresh button is also available.

## Configuration

Pipelines to monitor are declared in `build_status.config.js`. Each entry specifies the project name, repository slug / owner+repo, branch, and workflow ID (for GitHub Actions). Either or both providers can be enabled independently.

**CircleCI example:**
```js
circleCI: {
  enabled: true,
  apiToken: process.env.CIRCLE_CI_API_TOKEN,
  projects: [
    {
      projectName: 'my-service',
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
      owner: 'my-org',
      repo: 'my-service',
      branch: 'main',
      workflowId: 123456,
    },
  ],
}
```

> Workflow IDs can be looked up via `https://api.github.com/repos/OWNER/REPO/actions/workflows`.
>
> When no token is configured, the board displays realistic fake data so the UI is fully functional out of the box.
