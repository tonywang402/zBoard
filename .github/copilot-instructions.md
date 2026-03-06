# zBoard — Codebase Overview

## Project Purpose

**zBoard** is a DevOps team dashboard designed for large-screen / kiosk display. It aggregates and visualizes operational data — CI/CD build statuses, Datadog monitoring/alerts, Zendesk ticket queues, project timelines, and on-call owner rotations — all without a database. It supports Vercel deployment and local Mac mini kiosk setups.

## Features

Each feature has its own detailed Documentation and Guidance file.

| Feature | Summary | Reference |
|---|---|---|
| **CI/CD Build Status** | Real-time color-coded pipeline cards for CircleCI and GitHub Actions. Failed builds show a "Need ACK" button with optional audio alarm. Cards are sorted by urgency. | [BuildStatusMonitoring.instructions.md](instructions/BuildStatusMonitoring.instructions.md) |
| **Datadog Monitoring & Alerts** | Two views: a per-project/environment monitor health overview (OK/Warning/Alert counts with color indicator), and a live active alerts list grouped by severity with ACK and WeCom notification support. | [DatadogMonitoring&Alerts.instructions.md](instructions/DatadogMonitoring&Alerts.instructions.md) |
| **Zendesk Ticket Queue** | Displays New / Open / Pending ticket counts and a scrollable list with status badges, clickable subjects, and relative timestamps — all pulled from a configured Zendesk View. | [ZendeskTicketQueue.instructions.md](instructions/ZendeskTicketQueue.instructions.md) |
| **Project Timeline** | Gantt-style horizontal timeline of Kanbanize board cards. Start/end dates are derived from column transition history. Cards are color-coded and owner-avatared, packed compactly into rows. | [ProjectTimeline.instructions.md](instructions/ProjectTimeline.instructions.md) |
| **On-Call Owner Rotation** | Shows the current, previous, and next on-call owner for each configured rotation. Data can come from static config, ApiTable, or Google Sheets. Auto-resolved by today's date. | [On-CallOwnerRotation.md](instructions/On-CallOwnerRotation.md) |

---

## Tech Stack & Architecture

Next.js 13 (Pages Router) + TypeScript 5. UI built with Chakra UI v2. All integrations run server-side via Next.js API routes — no secrets are ever sent to the browser. Config-as-code via plain JS files in `config/`. Every data source has a fake data fallback so the board works out of the box without any tokens.

For full details on directory structure, key components, API routes, configuration files, authentication, and code conventions, see [TechStack&Architecture.instructions.md](instructions/TechStack&Architecture.instructions.md).

---

## Testing

The project has no tests yet. The testing architecture spans three layers: **unit tests** for API route business logic and data transformations (Jest + ts-jest + jest-fetch-mock), **component tests** for UI state and date-based rendering logic (React Testing Library), and **middleware tests** for the auth gate branches.

For the full architecture, tooling setup, boilerplate, conventions, and test case guide, see [TestingArchitecture.instructions.md](instructions/TestingArchitecture.instructions.md).
