# zBoard — Codebase Overview

## Project Purpose

**zBoard** is a DevOps team dashboard designed for large-screen / kiosk display. It aggregates and visualizes operational data — CI/CD build statuses, Datadog monitoring/alerts, Zendesk ticket queues, project timelines, and on-call owner rotations — all without a database. It supports Vercel deployment and local Mac mini kiosk setups.

---

## Tech Stack & Key Dependencies

| Category | Library / Tool |
|---|---|
| Framework | Next.js 13.3 (Pages Router) |
| Language | TypeScript 5, strict mode |
| UI | Chakra UI v2 + Framer Motion |
| Styling | Emotion (Chakra's CSS-in-JS engine) |
| Audio | Howler.js (alarm sounds) |
| Date/Time | Moment.js |
| Utilities | Lodash, Universal Cookie |
| Analytics | `@vercel/analytics` |
| Datadog SDK | `@datadog/datadog-api-client` |
| Dev/Test | `@faker-js/faker`, ESLint, Prettier |
| Runtime | Node 18 |
| Dev port | `2000` |

---

## Directory Structure

```
/
├── config/               # JS config files — all data source settings, tokens via process.env
├── fake/                 # Faker-based fake data generators (used when no API token configured)
├── public/audio/         # Alarm audio files served statically
├── src/
│   ├── middleware.ts     # Auth gate: password check via cookie before all routes
│   ├── components/       # UI widgets, each focused on one dashboard section
│   │   ├── Alarm/        # Alarm sub-components (player, toggle, WeCom integration)
│   │   └── WeComAlert/   # WeCom (enterprise WeChat) alert toggle
│   ├── lib/              # Shared utilities (toast, delay, data fetchers)
│   ├── pages/
│   │   ├── _app.tsx      # Root: ChakraProvider + Head + Analytics
│   │   ├── _document.tsx # Custom HTML document
│   │   ├── index.tsx     # Main dashboard layout
│   │   ├── login.tsx     # Login page (site password)
│   │   ├── AlarmToggleContext.tsx  # React context for alarm state
│   │   ├── api/          # Next.js API routes (backend proxies)
│   │   └── example/      # Standalone example pages per widget
│   ├── styles/globals.css
│   └── theme/theme.ts    # Chakra theme extension (light mode default)
└── docs/screenshots/     # Documentation images
```

---

## Key Components

| Component | Purpose |
|---|---|
| `BuildStatusOverview` | Fetches `/api/build_status`, sorts by severity, renders `BuildStatusCard` grid via `RefreshWrapper` |
| `BuildStatusCard` | Single CI pipeline card with status badge, commit subject, timestamps |
| `DatadogMonitorOverview` | Fetches `/api/datadog`, renders monitor health per project/env via `DatadogMonitorCard` |
| `DatadogAlertsOverview` | Fetches `/api/datadog_alert_status`, shows active alert list |
| `DatadogMonitorCard` | Per-project monitor status breakdown (counts by state per env/priority) |
| `OwnerRotationOverview` / `OwnerRotationCard` | Shows current on-call rotation member |
| `TicketStatusOverview` / `TicketList` | Zendesk view queue display |
| `ProjectTimeline` | Kanbanize board cards displayed as a timeline |
| `RefreshWrapper` | **Core reusable pattern** — wraps any data widget with: auto-poll interval, manual refresh button, loading skeleton, last-updated timestamp, and error toast |
| `CollapseNavbar` | Collapsible top navigation |
| `UpdateChecker` | Fetches upstream `package.json` from GitHub on mount; shows toast if a newer version exists |
| `AlertCard` / `AcknowledgeBox` | Alert display + acknowledge interaction |
| `ThemeToggle` | Light/dark mode switcher |
| `Alarm/AlarmContainer` | Conditionally plays alarm audio only on weekdays 9:30–11:30 and 13:30–18:00 |
| `Alarm/IntervalAlarmPlayer` | Plays audio on a configurable interval using Howler |
| `Alarm/AlarmToggle` | UI toggle to enable/disable alarms globally |
| `Alarm/AlarmToWeCom` | Sends alert notification to WeCom (enterprise WeChat) |
| `WeComAlert/WeComAlertToggle` | UI toggle for WeCom notification delivery |

---

## API Routes (`src/pages/api/`)

All routes are **backend-only proxies** — they keep tokens server-side and never expose them to the client.

| Route | Purpose |
|---|---|
| `build_status.ts` | Aggregates CircleCI + GitHub Actions statuses; returns fake data if no source is enabled |
| `circle_build_status.ts` | CircleCI-specific fetcher (called by `build_status.ts`) |
| `github_build_status.ts` | GitHub Actions-specific fetcher (called by `build_status.ts`) |
| `datadog.ts` | Fetches Datadog monitor state counts per project/env using the Datadog client SDK |
| `datadog_alert.ts` | Fetches actively triggered Datadog alert events |
| `datadog_alert_status.ts` | Alert status summary (aggregated view) |
| `owner_rotation.ts` | Reads rotation data from ApiTable, Google Sheets, or static local config |
| `project_timeline.ts` | Fetches card data from Kanbanize board |
| `ticket_status.ts` | Fetches Zendesk view queue |
| `hello.ts` | Default Next.js hello stub |

---

## Configuration Files (`config/`)

All config files are plain JS modules exporting a config object. Secrets are read from `process.env` at import time. Config files are only imported in API routes (server-side), never in frontend components.

| File | Configures |
|---|---|
| `site.config.js` | `siteName`, `enableSitePassword`, `sitePassword` (`SITE_PASSWORD` env) |
| `build_status.config.js` | CircleCI and GitHub Actions: toggles, tokens, projects/branches, refresh interval |
| `ticket_status.config.js` | Zendesk: base URL, user email, token, view ID, refresh interval |
| `project_timeline.config.js` | Kanbanize: board ID, columns, card types, start/end column logic, iteration weeks |
| `owner_rotation.config.js` | Rotation data source (localData / ApiTable / GoogleSheet), subjects, members, date ranges |
| `datadog_monitor.config.js` | Datadog: projects, per-env monitor configs (priority, alertStrategy), refresh interval |

---

## Authentication & Middleware

`src/middleware.ts` runs on every request (except static assets and `favicon.ico`).

**Logic:**
1. If `siteConfig.enableSitePassword` is `false` or `SITE_PASSWORD` env is unset → allow all traffic.
2. Authentication is cookie-based: the cookie `site_password` must equal `siteConfig.sitePassword`.
3. Unauthenticated requests to `/api/*` → 401 JSON response.
4. All other unauthenticated requests → redirect to `/login`.
5. Authenticated requests to `/login` → redirect to `/`.

The login page sets the `site_password` cookie on the client via `universal-cookie`.

---

## Notable Patterns & Conventions

- **`RefreshWrapper` pattern**: All dashboard widgets use this reusable component. They pass a `fetchData` async function and a `render` function as props — this centralizes polling, loading state, error handling, and the manual refresh button.

- **Fake data fallback**: When no API token is configured, every backend route returns realistic `@faker-js/faker`-generated data from `fake/*.fake.ts`. This keeps the board fully functional out of the box.

- **Config-as-code**: All data sources are defined in declarative JS config objects in `config/`. Swapping or adding integrations requires only config changes, not code changes.

- **Secrets never leave the server**: Config files read `process.env` but are only `import`ed in API routes, never in frontend components. API routes return shaped display-only data.

- **`@/*` path alias**: `tsconfig.json` maps `@/*` → `./src/*`. Config files are accessed as `@/../config/*.config.js`.

- **Working-hours alarm gate**: `AlarmContainer` checks weekday + time window (9:30–11:30, 13:30–18:00) before playing audio, preventing off-hours noise.

- **Global UI state via Context**: `AlarmToggleContext` (in `pages/AlarmToggleContext.tsx`) wraps the dashboard to share alarm-on/off and WeCom-send-on/off state across unrelated components.

- **Version update notification**: `UpdateChecker` polls the upstream GitHub repo's `package.json` on mount and notifies users of new releases via a toast. The current version is baked into the bundle via a webpack `DefinePlugin`.

- **Example pages**: `src/pages/example/` contains isolated standalone pages for each widget, useful for development and demonstration without loading the full dashboard.
