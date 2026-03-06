# Zendesk Ticket Queue

This feature displays the current state of your Zendesk support queue on the dashboard, giving the team an always-visible count of outstanding tickets without needing to log into Zendesk.

---

## What You See

The panel has two parts:

**Summary counters** at the top show large-number counts for each ticket state at a glance:
- **New** — tickets that have just arrived and haven't been touched
- **Open** — tickets actively being worked on
- **Pending** — tickets waiting on a response from the customer

**Ticket list** below the counters shows each individual ticket with:
- **Status badge** — color-coded by state:
  - 🟡 Yellow — `new`
  - 🔴 Red — `open`
  - ⚫ Gray — `hold`
  - 🔵 Blue — all other statuses (e.g. `pending`)
- **Ticket subject** — clickable link that opens the ticket directly in Zendesk
- **Last updated** — displayed as a relative time (e.g. "3 hours ago")

---

## Refresh

The panel auto-refreshes every **60 seconds** (configurable). A manual refresh button is also available.

---

## Configuration

The Zendesk integration is configured in `ticket_status.config.js`. You need to point it at a specific **Zendesk View** — the board will fetch all tickets in that view and display them.

```js
datasource: {
  zendesk: {
    enabled: true,
    baseUrl: process.env.ZENDESK_BASE_URL,      // e.g. https://your-org.zendesk.com
    userEmail: process.env.ZENDESK_USER_EMAIL,   // email of the API token owner
    apiToken: process.env.ZENDESK_API_TOKEN,     // Zendesk API token
    viewId: '30000000',                          // ID of the Zendesk view to monitor
  },
}
```

**Required environment variables:**

| Variable | Description |
|---|---|
| `ZENDESK_BASE_URL` | Your Zendesk instance URL, e.g. `https://your-org.zendesk.com` |
| `ZENDESK_USER_EMAIL` | The email address of the user who owns the API token |
| `ZENDESK_API_TOKEN` | Zendesk API token — [generate one here](https://support.zendesk.com/hc/en-us/articles/4408889192858) |

> The `viewId` can be found in the Zendesk admin panel under **Views**. The board fetches all tickets from that view, paginating through all pages automatically.
>
> When no token is configured, the board displays realistic fake ticket data so the UI is fully functional out of the box.
