---
name: "Component Tests"
description: "Component test boilerplate and test case guide for zBoard UI state transitions and date-based rendering logic."
applyTo: "**/tests/**"
---

# Component Tests

## Purpose

These component tests focus on components with **non-trivial rendering logic**: state machines, conditional sub-component rendering, and date-based logic. They do **not** test Chakra UI layout or styling.

Priority targets:
- **`AcknowledgeBox`** — two-state machine (Need ACK → ACKED) and conditional alarm mounting
- **`AlarmContainer` (`canPlay`)** — time-window gate (weekday + working hours), a pure exported function
- **`OwnerRotationCard`** — date-based current owner selection from a sorted members array

---

## Boilerplate

**`src/components/__tests__/AcknowledgeBox.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlarmToggleContext } from '../../pages/AlarmToggleContext';
import AcknowledgeBox from '../AcknowledgeBox';

jest.mock('../Alarm/AlarmContainer', () => () => <div data-testid="alarm-container" />);

const renderWithAlarm = (alarmToggle: boolean) =>
  render(
    <AlarmToggleContext.Provider value={{ alarmToggle, setAlarmToggle: jest.fn() }}>
      <AcknowledgeBox intervalMin={30} alarmSrc={['/audio/test.mp3']} needAlarm={true} />
    </AlarmToggleContext.Provider>
  );

describe('AcknowledgeBox', () => {
  it('shows "Need ACK" button before acknowledgement', () => {
    renderWithAlarm(false);
    expect(screen.getByText('Need ACK')).toBeInTheDocument();
    expect(screen.queryByText('ACKED')).not.toBeInTheDocument();
  });

  it('transitions to ACKED badge after clicking Need ACK', async () => {
    renderWithAlarm(false);
    await userEvent.click(screen.getByText('Need ACK'));
    expect(screen.getByText('ACKED')).toBeInTheDocument();
    expect(screen.queryByText('Need ACK')).not.toBeInTheDocument();
  });

  it('renders AlarmContainer when alarmToggle=true and needAlarm=true', () => {
    renderWithAlarm(true);
    expect(screen.getByTestId('alarm-container')).toBeInTheDocument();
  });

  it('does not render AlarmContainer when alarmToggle=false', () => {
    renderWithAlarm(false);
    expect(screen.queryByTestId('alarm-container')).not.toBeInTheDocument();
  });
});
```

---

**`src/components/__tests__/AlarmContainer.test.ts`**

```ts
import { canPlay } from '../Alarm/AlarmContainer';
import moment from 'moment';

const mockNow = (isoString: string) =>
  jest.spyOn(moment, 'now').mockReturnValue(new Date(isoString).getTime());

describe('canPlay', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns false on Saturday', () => {
    mockNow('2026-03-07T10:00:00');
    expect(canPlay()).toBe(false);
  });

  it('returns false on weekday before morning window', () => {
    mockNow('2026-03-06T09:00:00');
    expect(canPlay()).toBe(false);
  });

  it('returns true during morning window (09:30–11:30)', () => {
    mockNow('2026-03-06T10:00:00');
    expect(canPlay()).toBe(true);
  });

  it('returns false between 11:30 and 13:30', () => {
    mockNow('2026-03-06T12:00:00');
    expect(canPlay()).toBe(false);
  });

  it('returns true during afternoon window (13:30–18:00)', () => {
    mockNow('2026-03-06T15:00:00');
    expect(canPlay()).toBe(true);
  });

  it('returns false after 18:00', () => {
    mockNow('2026-03-06T18:30:00');
    expect(canPlay()).toBe(false);
  });
});
```

---

**`src/components/__tests__/OwnerRotationCard.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import OwnerRotationCard from '../OwnerRotationCard';

const members = [
  { name: 'Alice', startDate: '2026-01-01', endDate: '2026-03-31' },
  { name: 'Bob',   startDate: '2026-04-01', endDate: '2026-06-30' },
  { name: 'Carol', startDate: '2026-07-01', endDate: '2026-12-31' },
];

jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-06').getTime());

describe('OwnerRotationCard', () => {
  it('highlights the owner whose date window contains today', () => {
    render(<OwnerRotationCard subject="Stand Up" members={members} color="green.500" icon={null} />);
    const highlighted = screen.getByText('Alice');
    expect(highlighted).toHaveStyle('font-weight: bold');
  });

  it('shows next owner below current', () => {
    render(<OwnerRotationCard subject="Stand Up" members={members} color="green.500" icon={null} />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows "None" when no member matches today', () => {
    render(<OwnerRotationCard subject="Showcase" members={[]} color="blue.500" icon={null} />);
    expect(screen.getAllByText('None')).toHaveLength(3);
  });
});
```

---

## Test Case Guide

**`canPlay` — AlarmContainer.tsx**
- [ ] Weekend (Saturday/Sunday) → `false`
- [ ] Weekday before 09:30 → `false`
- [ ] Weekday 09:30–11:30 → `true`
- [ ] Weekday 11:30–13:30 → `false`
- [ ] Weekday 13:30–18:00 → `true`
- [ ] Weekday after 18:00 → `false`

**`AcknowledgeBox` component**
- [ ] Initial render → shows "Need ACK" button, no "ACKED" badge
- [ ] Click "Need ACK" → transitions to "ACKED" badge, button disappears
- [ ] `alarmToggle=true` + `needAlarm=true` → renders `AlarmContainer`
- [ ] `alarmToggle=false` → does not render `AlarmContainer`
- [ ] `needAlarm=false` → does not render `AlarmContainer` even when `alarmToggle=true`

**`OwnerRotationCard` component**
- [ ] Today falls within a member's date window → that member is displayed as current owner (bold/highlighted)
- [ ] The member before current (by `startDate` sort) is shown as previous owner
- [ ] The member after current is shown as next owner
- [ ] `members=[]` → previous, current, and next all display "None"
- [ ] Today is exactly on `startDate` boundary → owner is still matched (`isSameOrBefore`)
- [ ] Today is exactly on `endDate` boundary → owner is still matched (`isSameOrBefore`)
