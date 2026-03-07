import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import BuildStatusOverview from '../BuildStatusOverview';
import type { BuildStatus } from '../BuildStatusCard';

jest.mock('../../../config/build_status.config', () => ({
  buildStatusConfig: { title: 'Build Status', refreshIntervalSeconds: 0 },
}));
jest.mock('@/lib/customToast', () => ({ useErrorToast: () => jest.fn() }));

const makeStatus = (projectName: string, status: string): BuildStatus => ({
  projectName,
  branch: 'main',
  status,
  stopTime: '2026-03-01T10:00:00Z',
  username: 'user',
  avatarUrl: '',
  commitSubject: 'commit',
});

const renderOverview = () =>
  render(
    <ChakraProvider>
      <BuildStatusOverview />
    </ChakraProvider>
  );

const mockFetchData = (items: BuildStatus[]) => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => [...items],
  });
};


const getCardHeadings = () =>
  screen
    .getAllByRole('heading')
    .map((el) => el.textContent ?? '')
    .filter((name) => name !== 'Build Status');


describe('BuildStatusOverview — sort order', () => {
  afterEach(() => (global.fetch as jest.Mock).mockReset());

  it('cards are sorted by urgency: running → blocked → failures → terminal → successes', async () => {
    mockFetchData([
      makeStatus('svc-success',         'success'),         // priority 19
      makeStatus('svc-stale',           'stale'),           // priority 16
      makeStatus('svc-failed',          'failed'),          // priority 5
      makeStatus('svc-on_hold',         'on_hold'),         // priority 4
      makeStatus('svc-in_progress',     'in_progress'),     // priority 1
      makeStatus('svc-completed',       'completed'),       // priority 20
    ]);

    renderOverview();
    await screen.findByText('svc-in_progress');

    const order = getCardHeadings();
    expect(order).toEqual([
      'svc-in_progress',
      'svc-on_hold',
      'svc-failed',
      'svc-stale',
      'svc-success',
      'svc-completed',
    ]);
  });

  it('renders a placeholder image and no cards when fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      text: async () => 'Internal Server Error',
    });

    renderOverview();

    // Wait for the async refresh to complete — DefaultImage should appear
    await screen.findByRole('img');
    expect(getCardHeadings()).toHaveLength(0);
  });
});
