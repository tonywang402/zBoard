# On-Call Owner Rotation

This feature shows who is currently on call for each configured rotation (e.g. Stand-up host, Showcase host, incident responder), giving the whole team visibility into responsibilities at a glance.

---

## What You See

Each rotation is displayed as a **card**. Every card shows:
- **Subject name** — the name of the rotation (e.g. "Stand Up", "Showcase"), with a configurable icon (`calendar`, `email`, or `repeat`)
- **Current duty period** — the start and end date of the current on-call window (e.g. `01-01 - 06-30`)
- **Current owner** — displayed prominently in a highlighted color band, bold text
- **Previous owner** — shown in gray above the current owner
- **Next owner** — shown in gray below the current owner

The card's **left-edge color bar** uses the rotation's configured color, making it easy to distinguish rotations at a glance.

The current owner is determined automatically by today's date — the member whose `startDate` ≤ today ≤ `endDate` is shown as the active owner. No manual updates are needed on the dashboard.

---

## Refresh

The panel auto-refreshes every **1 hour** by default (configurable). Since rotation data changes infrequently, a high interval is appropriate.

---

## Configuration

Rotation data can come from three sources. Only one should be enabled at a time in `owner_rotation.config.js`.

### Option 1: Local static data

Best for simple, infrequently-changing rotations. Data is defined directly in the config file.

```js
localData: {
  enabled: true,
  rotations: [
    {
      subject: 'Stand Up',
      color: 'green',
      icon: 'email',
      members: [
        { name: 'Alice', startDate: '2025-01-01', endDate: '2025-06-30' },
        { name: 'Bob',   startDate: '2025-07-01', endDate: '2025-12-31' },
      ],
    },
  ],
}
```

### Option 2: ApiTable

Rotation schedule is managed in an [ApiTable](https://apitable.com) spreadsheet. Each rotation maps to one datasheet. The sheet must have columns: `name`, `startDate`, `endDate`.

```js
apiTable: {
  enabled: true,
  apiKey: process.env.API_TABLE_API_KEY,
  baseUrl: 'https://apitable.com/fusion/v1/datasheets/',
  rotations: [
    { subject: 'Stand Up', color: 'green', icon: 'calendar', datasheetId: 'dst-xxxxx' },
    { subject: 'Showcase', color: 'blue',  icon: 'repeat',   datasheetId: 'dst-yyyyy' },
  ],
}
```

### Option 3: Google Sheets

Rotation schedule is managed in a Google Sheet. Each rotation maps to one sheet tab. The sheet must have columns: `name`, `startDate`, `endDate`.

```js
googleSheet: {
  enabled: true,
  baseUrl: 'https://docs.google.com/spreadsheets/d/',
  docId: 'your-google-sheet-doc-id',
  rotations: [
    { subject: 'Stand Up', color: 'green', icon: 'calendar', sheetName: 'standup' },
    { subject: 'Showcase', color: 'blue',  icon: 'repeat',   sheetName: 'showcase' },
  ],
}
```

**Available icons:** `calendar`, `email`, `repeat`

> When no datasource is enabled, the board displays realistic fake rotation data so the UI is fully functional out of the box.
