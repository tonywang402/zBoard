# Project Timeline

This feature renders a **Gantt-style horizontal timeline** of all active cards on your Kanbanize board, giving the team a visual overview of what's in flight, who owns it, and when it's expected to be done — without leaving the dashboard.

---

## What You See

The timeline spans **1 month before today through 2 months after today**. Today's date is highlighted with a red circle and a vertical red line, making it easy to see what's overdue, in progress, or upcoming at a glance.

**Time axis:**
- Month labels are shown in a sticky header row on the left so they remain visible while scrolling
- Day numbers are shown in a second header row
- **Weekends** are shaded with a lighter background to distinguish them from working days

**Each card is rendered as a horizontal bar** on the timeline, positioned by its start and end date. The bar shows:
- **Card number and name** (e.g. `[1234] Implement login flow`)
- **Owner avatar** and **co-owner avatar** on the right edge of the bar
- **Card color** — inherited directly from the card's color in Kanbanize

Cards are packed compactly — if two cards don't overlap in time, they share the same row, minimising vertical space.

---

## How Start & End Dates Are Determined

The timeline calculates each card's dates from its **column transition history** in Kanbanize, not from manually entered dates:

| Date | How it's derived |
|---|---|
| **Start date** | The first time the card was moved into a configured `startColumns` (e.g. "To Do" or "In Progress") |
| **End date** | The first time the card was moved into a configured `endColumns` (e.g. "Done") — or the card's **deadline** if not yet done — or **start date + N weeks** if neither is set |

This means the timeline reflects actual workflow history, not estimates.

---

## Which Cards Are Shown

Only cards matching **all** of the following criteria are displayed:
- The card is in one of the configured **monitored columns** (e.g. To Do, In Progress, Code Review, QA, Done)
- The card is of one of the configured **monitored card types** (e.g. Business, Technical, Defect, Spike)
- The card's start date falls within the display window
- The card's start date and end date are different (single-day cards are excluded)

---

## Configuration

The timeline is configured in `project_timeline.config.js`. Key settings:

```js
kanbanize: {
  enabled: true,
  baseUrl: process.env.KANBANIZE_BASE_URL,  // e.g. https://your-org.kanbanize.com
  apikey: process.env.KANBANIZE_API_KEY,
  boardId: 123,                             // found in the board URL
  monitorColumns: [                         // columns whose cards appear on the timeline
    { id: 3942, name: 'To Do' },
    { id: 3943, name: 'In Progress' },
    { id: 3944, name: 'Done' },
    // ...
  ],
  monitorCardTypes: [                       // card types to include
    { id: 3955, name: 'Business' },
    { id: 3956, name: 'Technical' },
    // ...
  ],
  startColumns: [                           // entering these columns sets the start date
    { id: 3942, name: 'To Do' },
    { id: 3943, name: 'In Progress' },
  ],
  endColumns: [                             // entering this column sets the end date
    { id: 3944, name: 'Done(Iteration)' },
  ],
  defaultIterationWeeks: 2,                 // fallback duration if no end date or deadline
}
```

**Required environment variables:**

| Variable | Description |
|---|---|
| `KANBANIZE_BASE_URL` | Your Kanbanize instance URL, e.g. `https://your-org.kanbanize.com` |
| `KANBANIZE_API_KEY` | Kanbanize API key — [see guide](https://kanbanize.com/api) |

> Column IDs and card type IDs can be found by inspecting the Kanbanize API response when clicking a card. The `boardId` appears in the board's URL.
>
> When no token is configured, the board displays realistic fake timeline data so the UI is fully functional out of the box.
