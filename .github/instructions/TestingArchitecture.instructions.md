---
name: "Testing Architecture"
description: "Full testing architecture for zBoard: layers, tooling, setup, boilerplate, conventions, and test case guide."
applyTo: "**/tests/**"
---

# Testing Architecture

The codebase splits naturally into three testable layers, each with a different tool profile and scope.

## Layer Overview

| Layer | Scope | Tools | Location |
|---|---|---|---|
| **Unit** | API route business logic, data transformation, config-gate branching | Jest + ts-jest + jest-fetch-mock | `src/pages/api/__tests__/` |
| **Component** | UI state transitions, conditional rendering, date-based logic | React Testing Library + jest-dom | `src/components/__tests__/` |
| **Middleware** | Auth gate branches, redirect/401 logic, cookie validation | Jest + Web API polyfills | `src/__tests__/` |

---

## Installation

```bash
npm install --save-dev \
  jest ts-jest @types/jest jest-fetch-mock \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  jest-environment-jsdom
```

## `jest.config.ts` (project root)

```ts
export default {
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/pages/api/**/__tests__/**/*.test.ts',
                  '<rootDir>/src/lib/**/__tests__/**/*.test.ts'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
      setupFiles: ['./jest.setup.ts'],
    },
    {
      displayName: 'component',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/components/**/__tests__/**/*.test.tsx',
                  '<rootDir>/src/__tests__/middleware.test.ts'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
      setupFilesAfterFramework: ['@testing-library/jest-dom'],
    },
  ],
};
```

## `jest.setup.ts` (project root)

```ts
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();
```

## `package.json` scripts

```json
"scripts": {
  "test": "jest",
  "test:unit": "jest --selectProjects unit",
  "test:component": "jest --selectProjects component"
}
```

---

## Layer Details

For boilerplate, conventions, and test case guides, see the individual layer files:

- [UnitTests.instructions.md](UnitTests.instructions.md) — API route logic, config-gate branching, data transforms, HTTP error handling
- [ComponentTests.instructions.md](ComponentTests.instructions.md) — UI state machines, conditional rendering, date-based logic
- [MiddlewareTests.instructions.md](MiddlewareTests.instructions.md) — Auth gate branches, redirect/401 logic, cookie validation


---

## Boilerplate

**`src/pages/api/__tests__/build_status.test.ts`**

```typescript
import { getCIStatus } from '../build_status';
import { getAllCircleBuildStatus } from '../circle_build_status';
import { getAllGitHubStatus } from '../github_build_status';
import { getBuildStatusFakeData } from '../../../../fake/build_status.fake';

jest.mock('../../../config/build_status.config', () => ({
  buildStatusConfig: {
    datasource: {
      circleCI: { enabled: false, projects: [], apiToken: 'test-circle-token' },
      github: { enabled: false, projects: [], apiToken: 'test-gh-token', baseUrl: 'https://api.github.com' },
    },
  },
}));
jest.mock('../circle_build_status');
jest.mock('../github_build_status');
jest.mock('../../../../fake/build_status.fake');
jest.mock('@/lib/delay', () => ({ delay1s: (fn: () => any) => fn() }));

const mockGetAllCircleBuildStatus = getAllCircleBuildStatus as jest.MockedFunction<typeof getAllCircleBuildStatus>;
const mockGetAllGitHubStatus = getAllGitHubStatus as jest.MockedFunction<typeof getAllGitHubStatus>;

describe('getCIStatus', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns fake data when both circleCI.enabled and github.enabled are false', async () => {
    const fakeResult = [{ projectName: 'zboard-api', branch: 'master', status: 'success' }];
    (getBuildStatusFakeData as jest.Mock).mockReturnValue(fakeResult);

    const result = await getCIStatus();

    expect(result).toEqual(fakeResult);
    expect(mockGetAllCircleBuildStatus).not.toHaveBeenCalled();
    expect(mockGetAllGitHubStatus).not.toHaveBeenCalled();
  });

  it('merges CircleCI and GitHub results when any datasource is enabled', async () => {
    const circleResult = [{ platform: 'CircleCI', projectName: 'backend', status: 'success' }];
    const githubResult = [{ platform: 'Github', projectName: 'frontend', status: 'completed' }];
    mockGetAllCircleBuildStatus.mockResolvedValue(circleResult as any);
    mockGetAllGitHubStatus.mockResolvedValue(githubResult as any);

    const { buildStatusConfig } = require('../../../config/build_status.config');
    buildStatusConfig.datasource.circleCI.enabled = true;

    const result = await getCIStatus();
    expect(result).toEqual([...circleResult, ...githubResult]);

    buildStatusConfig.datasource.circleCI.enabled = false;
  });
});
```

---

**`src/pages/api/__tests__/circle_build_status.test.ts`**

```typescript
import fetchMock from 'jest-fetch-mock';
import { getAllCircleBuildStatus } from '../circle_build_status';

jest.mock('../../../config/build_status.config', () => ({
  buildStatusConfig: {
    datasource: {
      circleCI: {
        enabled: true,
        apiToken: 'fake-circle-token',
        projects: [{ projectName: 'payment-service', projectSlug: 'gh/acme/payment-service', branch: 'main' }],
      },
      github: { enabled: false, projects: [] },
    },
  },
}));

const mockPipelineResponse = {
  items: [
    {
      id: 'pipe-001',
      updated_at: '2026-02-27T10:00:00Z',
      trigger: { actor: { login: 'dev-alice', avatar_url: 'https://avatars.gh/alice' } },
      vcs: { commit: { subject: 'fix: payment timeout' } },
    },
    {
      id: 'pipe-002',
      updated_at: '2026-02-26T08:00:00Z',
      trigger: { actor: { login: 'dev-bob', avatar_url: 'https://avatars.gh/bob' } },
      vcs: { commit: null },
    },
  ],
};

const mockWorkflowResponse = {
  items: [
    { status: 'failed', created_at: '2026-02-27T10:05:00Z' },
    { status: 'success', created_at: '2026-02-27T09:00:00Z' },
  ],
};

describe('getAllCircleBuildStatus', () => {
  beforeEach(() => fetchMock.resetMocks());

  it('returns empty array when circleCI is disabled', async () => {
    const { buildStatusConfig } = require('../../../config/build_status.config');
    buildStatusConfig.datasource.circleCI.enabled = false;

    const result = await getAllCircleBuildStatus();
    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();

    buildStatusConfig.datasource.circleCI.enabled = true;
  });

  it('selects most recent pipeline by updated_at desc', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify(mockPipelineResponse))
      .mockResponseOnce(JSON.stringify(mockWorkflowResponse));

    const [result] = await getAllCircleBuildStatus();

    expect(result.username).toBe('dev-alice');
    expect(result.commitSubject).toBe('fix: payment timeout');
    expect(result.status).toBe('failed');
    expect(result.platform).toBe('CircleCI');
  });

  it('falls back to "automatically triggered" when vcs.commit is null', async () => {
    const singleNullCommitPipeline = {
      items: [{
        id: 'pipe-002',
        updated_at: '2026-02-27T10:00:00Z',
        trigger: { actor: { login: 'dev-bob', avatar_url: 'https://avatars.gh/bob' } },
        vcs: { commit: null },
      }],
    };
    fetchMock
      .mockResponseOnce(JSON.stringify(singleNullCommitPipeline))
      .mockResponseOnce(JSON.stringify(mockWorkflowResponse));

    const [result] = await getAllCircleBuildStatus();
    expect(result.commitSubject).toBe('automatically triggered');
  });

  it('throws when CircleCI pipeline fetch returns non-ok', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    await expect(getAllCircleBuildStatus()).rejects.toThrow('{"message":"Unauthorized"}');
  });

  it('throws when CircleCI workflow fetch returns non-ok', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify(mockPipelineResponse))
      .mockResponseOnce(JSON.stringify({ message: 'Not Found' }), { status: 404 });
    await expect(getAllCircleBuildStatus()).rejects.toThrow('{"message":"Not Found"}');
  });
});
```

---

**`src/pages/api/__tests__/github_build_status.test.ts`**

```typescript
import fetchMock from 'jest-fetch-mock';
import { getAllGitHubStatus } from '../github_build_status';

jest.mock('../../../config/build_status.config', () => ({
  buildStatusConfig: {
    datasource: {
      github: {
        enabled: true,
        apiToken: 'ghp_fake_token',
        baseUrl: 'https://api.github.com',
        projects: [{ projectName: 'vscode', owner: 'microsoft', repo: 'vscode', branch: 'master', workflowId: 123 }],
      },
      circleCI: { enabled: false, projects: [] },
    },
  },
}));

describe('getAllGitHubStatus', () => {
  beforeEach(() => fetchMock.resetMocks());

  it('returns empty array when github.enabled is false', async () => {
    const { buildStatusConfig } = require('../../../config/build_status.config');
    buildStatusConfig.datasource.github.enabled = false;
    const result = await getAllGitHubStatus();
    expect(result).toEqual([]);
    buildStatusConfig.datasource.github.enabled = true;
  });

  it('maps status to conclusion when workflow run is "completed"', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      workflow_runs: [{
        status: 'completed', conclusion: 'success',
        updated_at: '2026-02-27T12:00:00Z',
        triggering_actor: { login: 'jsmith', avatar_url: 'https://avatars.gh/jsmith' },
        head_commit: { message: 'chore: bump deps' },
      }],
    }));

    const [result] = await getAllGitHubStatus();
    expect(result.status).toBe('success');
    expect(result.username).toBe('jsmith');
  });

  it('keeps raw status when workflow is not "completed"', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      workflow_runs: [{
        status: 'in_progress', conclusion: null,
        updated_at: '2026-02-27T12:00:00Z',
        triggering_actor: null, head_commit: null,
      }],
    }));

    const [result] = await getAllGitHubStatus();
    expect(result.status).toBe('in_progress');
    expect(result.username).toBeUndefined();
    expect(result.commitSubject).toBeUndefined();
  });

  it('throws formatted error when GitHub API returns non-ok', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ message: 'Bad credentials' }), { status: 401 });
    await expect(getAllGitHubStatus()).rejects.toThrow('{"message":"Bad credentials"}');
  });
});
```

---

**`src/pages/api/__tests__/owner_rotation.test.ts`**

```typescript
import { getAllOwners, sortMembers } from '../owner_rotation';

jest.mock('../../../config/owner_rotation.config');
jest.mock('@/lib/apiTableFetcher');
jest.mock('@/lib/googleSheetFetcher');
jest.mock('../../../../fake/owner_rotation.fake');
jest.mock('@/lib/delay', () => ({ delay1s: (fn: () => any) => fn() }));

import { ownerRotationConfig } from '../../../config/owner_rotation.config';
import { fetchFieldsFromApiTable } from '@/lib/apiTableFetcher';
import { fetchFieldsFromGoogleSheet } from '@/lib/googleSheetFetcher';
import { getOwnerRotationFakeData } from '../../../../fake/owner_rotation.fake';

const baseConfig = {
  datasource: {
    localData: { enabled: false, rotations: [] },
    apiTable: { enabled: false, baseUrl: 'https://apitable.com/fusion/v1/datasheets/', apiKey: 'at-key', rotations: [] },
    googleSheet: { enabled: false, baseUrl: 'https://docs.google.com/spreadsheets/d/', docId: 'doc123', rotations: [] },
  },
};

describe('getAllOwners — datasource routing', () => {
  beforeEach(() => {
    (ownerRotationConfig as any) = JSON.parse(JSON.stringify(baseConfig));
  });

  it('returns localData.rotations directly when localData.enabled', async () => {
    const localRotations = [{ subject: 'Stand Up', color: 'green', icon: 'email', members: [] }];
    (ownerRotationConfig as any).datasource.localData = { enabled: true, rotations: localRotations };

    const result = await getAllOwners();
    expect(result).toBe(localRotations);
    expect(fetchFieldsFromApiTable).not.toHaveBeenCalled();
  });

  it('loads from ApiTable when apiTable.enabled', async () => {
    (ownerRotationConfig as any).datasource.apiTable = {
      enabled: true,
      baseUrl: 'https://apitable.com/fusion/v1/datasheets/',
      apiKey: 'at-key',
      rotations: [{ subject: 'Showcase', color: 'blue', icon: 'repeat', datasheetId: 'ds-abc' }],
    };
    (fetchFieldsFromApiTable as jest.Mock).mockResolvedValue([
      { name: 'Alice', startDate: '2026-01-01', endDate: '2026-07-01' },
    ]);

    const result = await getAllOwners();
    expect(result[0].subject).toBe('Showcase');
    expect(result[0].members[0].name).toBe('Alice');
  });

  it('loads from GoogleSheet when googleSheet.enabled', async () => {
    (ownerRotationConfig as any).datasource.googleSheet = {
      enabled: true,
      baseUrl: 'https://docs.google.com/spreadsheets/d/',
      docId: 'doc123',
      rotations: [{ subject: 'Stand Up', color: 'green', icon: 'calendar', sheetName: 'Q1' }],
    };
    (fetchFieldsFromGoogleSheet as jest.Mock).mockResolvedValue([
      { name: 'Bob', startDate: '2026-02-01', endDate: '2026-08-01' },
    ]);

    const result = await getAllOwners();
    expect(result[0].subject).toBe('Stand Up');
    expect(fetchFieldsFromApiTable).not.toHaveBeenCalled();
  });

  it('falls back to fake data when all datasources are disabled', async () => {
    const fakeRotations = [{ subject: 'Fake Rotation' }];
    (getOwnerRotationFakeData as jest.Mock).mockReturnValue(fakeRotations);
    const result = await getAllOwners();
    expect(result).toEqual(fakeRotations);
  });
});

describe('sortMembers', () => {
  it('returns empty array when any row has non-YYYY-MM-DD startDate', () => {
    expect(sortMembers([{ name: 'Alice', startDate: '01/01/2026', endDate: '06/01/2026' }])).toEqual([]);
  });

  it('sorts by startDate ascending and maps to Member shape', () => {
    const rows = [
      { name: 'Charlie', startDate: '2026-03-01', endDate: '2026-09-01' },
      { name: 'Alice', startDate: '2026-01-01', endDate: '2026-07-01' },
    ];
    const result = sortMembers(rows);
    expect(result[0].name).toBe('Alice');
    expect(result[1].name).toBe('Charlie');
  });

  it('returns empty array when rows is undefined or empty', () => {
    expect(sortMembers(undefined as any)).toEqual([]);
    expect(sortMembers([])).toEqual([]);
  });
});
```

---

**`src/pages/api/__tests__/project_timeline.test.ts`**

```typescript
import moment from 'moment';
import { calculateStartEndDate, buildCardInfo } from '../project_timeline';

jest.mock('../../../config/project_timeline.config', () => ({
  projectTimelineConfig: {
    datasource: {
      kanbanize: {
        enabled: true,
        baseUrl: 'https://acme.kanbanize.com',
        apikey: 'kb-fake-key',
        boardId: 193,
        monitorColumns: [
          { id: 3942, name: 'To Do' },
          { id: 3943, name: 'In Progress' },
          { id: 3944, name: 'Done' },
        ],
        monitorCardTypes: [{ id: 3955, name: 'Business' }],
        startColumns: [{ id: 3942 }],
        endColumns: [{ id: 3944 }],
        defaultIterationWeeks: 2,
      },
    },
  },
}));

const baseCard = {
  card_id: 'CARD-42',
  title: 'Implement payment gateway',
  color: 'blue',
  column_id: 3943,
  owner_user_id: 101,
  co_owner_ids: [102, 103],
  deadline: '',
  transitions: [
    { column_id: 3942, start: '2026-02-01T09:00:00Z' },
    { column_id: 3944, start: '2026-02-14T17:00:00Z' },
  ],
};

describe('calculateStartEndDate', () => {
  it('uses transition start when both startColumn and endColumn transitions exist', () => {
    const [start, end] = calculateStartEndDate(baseCard as any);
    expect(start).toBe('2026-02-01');
    expect(end).toBe('2026-02-14');
  });

  it('falls back to card.deadline when no endColumn transition is found', () => {
    const card = { ...baseCard, deadline: '2026-03-01', transitions: [{ column_id: 3942, start: '2026-02-01T09:00:00Z' }] };
    const [, end] = calculateStartEndDate(card as any);
    expect(end).toBe('2026-03-01');
  });

  it('falls back to startDate + defaultIterationWeeks when no endColumn and no deadline', () => {
    const card = { ...baseCard, deadline: '', transitions: [{ column_id: 3942, start: '2026-02-01T09:00:00Z' }] };
    const [start, end] = calculateStartEndDate(card as any);
    expect(start).toBe('2026-02-01');
    expect(end).toBe(moment('2026-02-01T09:00:00Z').add(2, 'weeks').format('YYYY-MM-DD'));
  });
});

describe('buildCardInfo', () => {
  const mockBuildUserInfo = (userId: number) =>
    userId === 101 ? { name: 'Alice', avatar: 'alice.png' } : null;

  it('resolves column name from monitorColumns by column_id', () => {
    const card = buildCardInfo(baseCard as any, mockBuildUserInfo);
    expect(card.status).toBe('In Progress');
  });

  it('returns undefined status when column_id is not in monitorColumns', () => {
    const card = buildCardInfo({ ...baseCard, column_id: 9999 } as any, mockBuildUserInfo);
    expect(card.status).toBeUndefined();
  });

  it('returns null for unrecognized co-owner IDs', () => {
    const card = buildCardInfo(baseCard as any, mockBuildUserInfo);
    expect(card.owner).toEqual({ name: 'Alice', avatar: 'alice.png' });
    expect(card.coOwners).toEqual([null, null]);
  });
});
```

---

**`src/pages/api/__tests__/datadog.test.ts`**

```typescript
import { getMonitorColor } from '../datadog';

describe('getMonitorColor', () => {
  it('returns "grey" when counts is undefined', () => {
    expect(getMonitorColor(undefined)).toBe('grey');
  });

  it('returns "grey" when counts.status is missing', () => {
    expect(getMonitorColor({} as any)).toBe('grey');
  });

  it('returns "grey" when counts.status is an empty array', () => {
    expect(getMonitorColor({ status: [] } as any)).toBe('grey');
  });

  it('returns "red" when any status item has name "Alert"', () => {
    expect(getMonitorColor({ status: [{ name: 'OK', count: 5 }, { name: 'Alert', count: 2 }] } as any)).toBe('red');
  });

  it('returns "green" when status items exist but none is "Alert"', () => {
    expect(getMonitorColor({ status: [{ name: 'OK', count: 10 }] } as any)).toBe('green');
  });
});
```

---

**`src/pages/api/__tests__/ticket_status.test.ts`**

```typescript
import fetchMock from 'jest-fetch-mock';
import { getAllBuildStatus } from '../ticket_status';

jest.mock('../../../config/ticket_status.config', () => ({
  ticketStatusConfig: {
    datasource: {
      zendesk: {
        enabled: true,
        baseUrl: 'https://acme.zendesk.com',
        viewId: '360001234',
        userEmail: 'bot@acme.com',
        apiToken: 'zdtoken-fake',
      },
    },
  },
}));
jest.mock('@/lib/delay', () => ({ delay1s: (fn: () => any) => fn() }));
jest.mock('../../../../fake/ticket_status.fake');

describe('getAllBuildStatus — Zendesk ticket fetching', () => {
  beforeEach(() => fetchMock.resetMocks());

  it('returns fake data when zendesk is disabled', async () => {
    const { ticketStatusConfig } = require('../../../config/ticket_status.config');
    ticketStatusConfig.datasource.zendesk.enabled = false;
    const { getTicketStatusFakeData } = require('../../../../fake/ticket_status.fake');
    (getTicketStatusFakeData as jest.Mock).mockReturnValue([{ id: 1 }]);

    const result = await getAllBuildStatus();
    expect(result).toEqual([{ id: 1 }]);
    ticketStatusConfig.datasource.zendesk.enabled = true;
  });

  it('accumulates all tickets across paginated responses until next_page is null', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify({
        tickets: [{ id: 101, subject: 'Login broken' }],
        next_page: 'https://acme.zendesk.com/api/v2/views/360001234/tickets?page=2',
      }))
      .mockResponseOnce(JSON.stringify({
        tickets: [{ id: 102, subject: 'Checkout error' }],
        next_page: null,
      }));

    const result = await getAllBuildStatus();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(101);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws "failed to fetch zendesk tickets" on non-ok response', async () => {
    fetchMock.mockResponseOnce('Forbidden', { status: 403 });
    await expect(getAllBuildStatus()).rejects.toThrow('failed to fetch zendesk tickets');
  });
});
```

---

# Layer 2 — Component Tests

Focus on components with **non-trivial logic**: state transitions and date-based rendering. Skip testing Chakra UI layout/styling.

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

# Layer 3 — Middleware Tests

The `middleware()` function has 6 distinct branches that must all be verified.

**`src/__tests__/middleware.test.ts`**

```ts
import { middleware } from '../middleware';
import { NextRequest } from 'next/server';

jest.mock('../../config/site.config', () => ({
  siteConfig: { enableSitePassword: true, sitePassword: 'secret123' },
}));

const makeRequest = (pathname: string, cookieValue?: string): NextRequest => {
  const req = new NextRequest(new URL(`http://localhost${pathname}`));
  if (cookieValue) req.cookies.set('site_password', cookieValue);
  return req;
};

describe('middleware', () => {
  it('allows through when sitePassword is disabled', () => {
    jest.resetModules();
    jest.mock('../../config/site.config', () => ({
      siteConfig: { enableSitePassword: false, sitePassword: '' },
    }));
    const res = middleware(makeRequest('/dashboard'));
    expect(res.status).toBe(200);
  });

  it('redirects unauthenticated request to /login', () => {
    const res = middleware(makeRequest('/dashboard'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('returns 401 for unauthenticated /api/* requests', () => {
    const res = middleware(makeRequest('/api/build_status'));
    expect(res.status).toBe(401);
  });

  it('allows authenticated request through', () => {
    const res = middleware(makeRequest('/dashboard', 'secret123'));
    expect(res.status).toBe(200);
  });

  it('redirects authenticated user away from /login to /', () => {
    const res = middleware(makeRequest('/login', 'secret123'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/');
  });

  it('allows unauthenticated user to access /login page', () => {
    const res = middleware(makeRequest('/login'));
    expect(res.status).toBe(200);
  });
});
```

---

# Recommended Conventions

- **`jest.mock` path must exactly mirror the import string in the source file.** `circle_build_status.ts` imports `'../../../config/build_status.config'`, so `jest.mock` must use that exact string. Path alias mismatches cause silent mock bypass — the real config runs and tests produce false-green or false-red results.

- **Colocate tests at `src/pages/api/__tests__/`, one `.test.ts` per route file.** Keeps test discovery (`jest --testPathPattern api`) natural and prevents a diverging top-level `__tests__` tree that goes out of sync as routes are added or renamed.

- **Mutate the mocked config reference within tests instead of calling `jest.resetModules()`.** Config constants like `const circleCIConfig = buildStatusConfig.datasource.circleCI` are evaluated once at module load. Mutate via `require(...)` and restore in `afterEach` — it is 10–20× faster than re-requiring the module per test.

- **Never mock `lodash` for `_.orderBy` — test with ≥2 fixture items in the correct and reversed order.** The sort direction (`'desc'`) and `[0]` selection are exactly the bug surface: a single-item array makes both pass vacuously. Provide two items in the wrong order and verify the result picks the right one.

- **Use `jest-fetch-mock` rather than `jest.spyOn(global, 'fetch')`.** Node 18's built-in `fetch` type differs subtly from `node-fetch`. `jest-fetch-mock` provides `mockResponseOnce` queuing and call count assertions that precisely match the sequential multi-fetch pattern in `fetchTickets`'s pagination loop and `fetchPipelines`/`fetchWorkflows`'s paired calls.

---

# Test Case Writing Guide

**`getCIStatus` — build_status.ts**
- [ ] Both `circleCI.enabled=false` AND `github.enabled=false` → calls `getBuildStatusFakeData`, skips both fetchers
- [ ] At least one datasource enabled → calls `Promise.all([getAllCircleBuildStatus, getAllGitHubStatus])` and returns `.flat()` merged array

**`getAllCircleBuildStatus` — circle_build_status.ts**
- [ ] `circleCIConfig.enabled=false` → returns `[]`, zero fetch calls
- [ ] `pipelines.items` ordered by `updated_at` desc → `items[0]` is the most recent pipeline
- [ ] `vcs.commit.subject` present → used as `commitSubject`
- [ ] `vcs.commit` is `null` → `commitSubject` equals `'automatically triggered'`
- [ ] `fetchPipelines` response `!ok` → throws `Error` with `JSON.stringify(responseBody)`
- [ ] `fetchWorkflows` response `!ok` → throws `Error` with `JSON.stringify(responseBody)`
- [ ] `workflows.items` ordered by `created_at` desc → `items[0].status` used as build status

**`getAllGitHubStatus` — github_build_status.ts**
- [ ] `github.enabled=false` → returns `[]`
- [ ] `workflowRun.status === 'completed'` → `result.status` equals `workflowRun.conclusion`
- [ ] `workflowRun.status !== 'completed'` (e.g. `'in_progress'`) → `result.status` equals the raw status
- [ ] `triggering_actor` is `null` → `username` and `avatarUrl` are `undefined` (optional chaining `?.`)
- [ ] `head_commit` is `null` → `commitSubject` is `undefined`
- [ ] Response `!ok` → throws formatted JSON error string

**`getAllOwners` — owner_rotation.ts**
- [ ] `localData.enabled=true` → returns `localData.rotations` reference directly, no async calls
- [ ] `localData=false`, `apiTable.enabled=true` → calls `fetchFieldsFromApiTable` per rotation, returns sorted members
- [ ] `localData=false`, `apiTable=false`, `googleSheet.enabled=true` → calls `fetchFieldsFromGoogleSheet`
- [ ] All three disabled → returns fake data via `delay1s(getOwnerRotationFakeData)`

**`sortMembers` — owner_rotation.ts**
- [ ] All rows pass `/^\d{4}-\d{2}-\d{2}$/` → sorted ascending by `startDate`, mapped to `{ name, startDate, endDate }`
- [ ] Any row fails the date pattern (e.g. `'01/01/2026'`) → returns `[]`
- [ ] `rows` is `undefined` or `[]` → returns `[]`
- [ ] Two rows with equal `startDate` → order is stable (no crash)

**`calculateStartEndDate` — project_timeline.ts**
- [ ] Transition matching `startColumns` found → uses its `.start` as `startDate`
- [ ] Transition matching `endColumns` found → uses its `.start` as `endDate`
- [ ] No `endColumns` transition, `deadline` non-empty → uses `deadline` as `endDate`
- [ ] No `endColumns` transition, no `deadline` → `endDate = startDate + defaultIterationWeeks weeks`
- [ ] `transitions` is `undefined` or `[]` → `startTime`/`endTime` are both `undefined`, produces `'Invalid date'` (known edge case, document behavior)

**`buildCardInfo` — project_timeline.ts**
- [ ] `card.column_id` exists in `monitorColumns` → `status` is the column `name`
- [ ] `card.column_id` not in `monitorColumns` → `status` is `undefined`
- [ ] `co_owner_ids` is `undefined`/`null` → `coOwners` is `undefined` (optional chaining `?.map`)
- [ ] `buildUserInfo` returns `null` for unrecognized `owner_user_id` → `owner` is `null`

**`getMonitorColor` — datadog.ts**
- [ ] `counts` is `undefined` → `'grey'`
- [ ] `counts.status` is `undefined` → `'grey'`
- [ ] `counts.status` is `[]` → `'grey'`
- [ ] `counts.status` contains `{ name: 'Alert' }` → `'red'`
- [ ] `counts.status` has items, none named `'Alert'` → `'green'`

**`getAllBuildStatus` / `fetchTickets` — ticket_status.ts**
- [ ] `zendeskConfig.enabled=false` → returns fake data, no fetch
- [ ] Single page (`next_page: null`) → returns tickets from one response only
- [ ] Multi-page (`next_page` set, then `null`) → concatenates all pages into `allTickets`
- [ ] Any page returns `!response.ok` → throws `Error('failed to fetch zendesk tickets')`

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

**`middleware` — middleware.ts**
- [ ] `enableSitePassword=false` → all requests pass through
- [ ] No cookie, non-API path → redirect to `/login`
- [ ] No cookie, `/api/*` path → 401 response
- [ ] Valid cookie, any path → pass through
- [ ] Valid cookie, `/login` path → redirect to `/`
- [ ] No cookie, `/login` path → pass through (show login page)
