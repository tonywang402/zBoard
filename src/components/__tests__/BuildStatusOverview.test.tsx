import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import BuildStatusOverview from '../BuildStatusOverview';
import type { BuildStatus } from '../BuildStatusCard';

jest.mock('../../../config/build_status.config', () => ({
  buildStatusConfig: { title: 'Build Status', refreshIntervalSeconds: 0 },
}));
jest.mock('@/lib/customToast', () => ({
  useErrorToast: () => jest.fn(),
  useInfoToast: () => jest.fn(),
}));

const makeStatus = (
  projectName: string,
  status: string,
  level?: 'high' | 'medium' | 'low'
): BuildStatus => ({
  projectName,
  branch: 'main',
  status,
  level,
  stopTime: '2026-03-01T10:00:00Z',
  username: 'user',
  avatarUrl: '',
  commitSubject: `commit-${projectName}`,
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

  it('cards are sorted by level first, then urgency within each level', async () => {
    mockFetchData([
      makeStatus('low-running', 'running', 'low'),
      makeStatus('high-success', 'success', 'high'),
      makeStatus('medium-failed', 'failed', 'medium'),
      makeStatus('high-in_progress', 'in_progress', 'high'),
      makeStatus('low-failed', 'failed', 'low'),
      makeStatus('medium-on_hold', 'on_hold', 'medium'),
    ]);

    renderOverview();
    await screen.findByText('high-in_progress');

    const order = getCardHeadings();
    expect(order).toEqual([
      'high-in_progress',
      'high-success',
      'medium-on_hold',
      'medium-failed',
      'low-running',
      'low-failed',
    ]);
  });

  it('missing level is treated as medium for sorting', async () => {
    mockFetchData([
      makeStatus('low-running', 'running', 'low'),
      makeStatus('missing-failed', 'failed'),
      makeStatus('high-success', 'success', 'high'),
      makeStatus('medium-in_progress', 'in_progress', 'medium'),
    ]);

    renderOverview();
    await screen.findByText('high-success');

    const order = getCardHeadings();
    expect(order).toEqual([
      'high-success',
      'medium-in_progress',
      'missing-failed',
      'low-running',
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
