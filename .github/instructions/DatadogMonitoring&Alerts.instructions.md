# Datadog Monitoring & Alerts

This feature provides two complementary views of your Datadog observability data on the dashboard: a **Monitor Health** overview and an **Active Alerts** list.

---

## Monitor Health

Each configured project is displayed as a group of **environment cards**, showing the health of all Datadog monitors tagged with that project's service name and environment.

**Each environment card shows:**
- **Environment name** (e.g. `CI`, `INT`, `SC`, `PROD`)
- **Status counts** — a breakdown of how many monitors are in each state (e.g. OK: 12, Alert: 1, Warning: 2, No Data: 0)
- **A color indicator** on the left edge of the card:
  - 🟢 **Green** — all monitors are healthy (no Alert state detected)
  - 🔴 **Red** — at least one monitor is in Alert state
  - ⚫ **Grey** — no monitor data available

**Card order** within a project is sorted by priority — the most critical environments (e.g. `prod`) appear at the top, with lower-priority environments (e.g. `ci`) below.

---

## Active Alerts

This panel shows all Datadog monitors currently in the **Alert state** across all configured projects and environments.

Alerts are grouped and displayed by severity — **high** alerts first, then **medium**, then **low**. Each alert card shows:
- **Alert name**
- **Triggered time**
- A **"Need ACK"** button (and possibly a **WeCom notification** button)

To keep the panel compact and readable on kiosk screens:
- Each severity group shows **2 alerts per page** at a time.
- Groups auto-rotate to the next page every **10 seconds**.
- Each severity group rotates **independently**.
- When a group has more than one page, users can switch pages manually with left/right controls.

The behavior of each alert depends on its configured `alertStrategy`:

| Strategy | Alert Style | Alarm Sound | WeCom Notification |
|---|---|---|---|
| `high` | 🔴 Error (red) | ✅ Plays `prodWarning.mp3` every 30 min | ✅ Sent automatically |
| `medium` | 🟡 Warning (yellow) | ❌ No sound | ❌ Not sent |
| `low` | 🔵 Info (blue) | ❌ No sound | ❌ Not sent |

For **high** alerts, clicking **"Need ACK"** silences the alarm and changes the button to an **"ACKED"** badge. The alarm only plays during working hours (weekdays 9:30–11:30 and 13:30–18:00).

---

## Refresh

Both panels auto-refresh every **30 seconds** (configurable). A manual refresh button is also available.

---

## Configuration

Monitor projects and environments are declared in `datadog_monitor.config.js`. Each project lists its environments, and each environment has a `priority` (lower = more important, shown first) and an `alertStrategy` (`high` / `medium` / `low`).

```js
projects: [
  {
    projectName: 'my-service',
    monitorConfigs: [
      { env: 'prod', priority: 1, alertStrategy: 'high' },
      { env: 'sc',   priority: 2, alertStrategy: 'medium' },
      { env: 'int',  priority: 3, alertStrategy: 'medium' },
      { env: 'ci',   priority: 4, alertStrategy: 'low' },
    ],
  },
]
```

> Monitors are queried from Datadog using the tag combination `service: <projectName> env: <env>`. Ensure your Datadog monitors are tagged accordingly.
>
> The Datadog API credentials are read from environment variables (`DD_API_KEY`, `DD_APP_KEY`) automatically by the `@datadog/datadog-api-client` SDK.
