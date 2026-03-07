import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import BuildStatusCard, { BuildStatus } from '../BuildStatusCard';

// Mock AcknowledgeBox to avoid audio / Howler cascades and to get a reliable testid
jest.mock('../AcknowledgeBox', () => ({
  __esModule: true,
  default: () => <div data-testid="acknowledge-box" />,
}));

const base: BuildStatus = {
  projectName: 'my-service',
  branch: 'main',
  status: 'success',
  stopTime: '2026-03-06T14:30:00Z',
  username: 'alice',
  avatarUrl: 'https://example.com/avatar.png',
  commitSubject: 'fix: some bug',
};

const renderCard = (overrides: Partial<BuildStatus> = {}) =>
  render(
    <ChakraProvider>
      <BuildStatusCard buildStatus={{ ...base, ...overrides }} />
    </ChakraProvider>
  );

// ---------------------------------------------------------------------------
// Color scheme derivation
// The color scheme drives the conditional AcknowledgeBox mount (red → renders,
// non-red → does not), which is the most reliable observable output in jsdom.
// ---------------------------------------------------------------------------
describe('BuildStatusCard — color scheme derivation', () => {
  it.each([
    // Red group → AcknowledgeBox should mount
    ['failed',          true],
    ['failure',         true],
    ['timed_out',       true],
    ['startup_failure', true],
    // Green group
    ['success',         false],
    ['completed',       false],
    // Blue group
    ['running',         false],
    ['in_progress',     false],
    // Yellow group
    ['waiting',         false],
    // Purple group
    ['on_hold',         false],
    ['action_required', false],
    // Gray group
    ['canceled',        false],
    ['cancelled',       false],
    ['skipped',         false],
    ['queued',          false],
    ['requested',       false],
    ['pending',         false],
    ['stale',           false],
  ])('status "%s" → AcknowledgeBox mounted: %s', (status, shouldMount) => {
    renderCard({ status });
    if (shouldMount) {
      expect(screen.getByTestId('acknowledge-box')).toBeInTheDocument();
    } else {
      expect(screen.queryByTestId('acknowledge-box')).not.toBeInTheDocument();
    }
  });

  it('unknown status falls back to red → AcknowledgeBox is mounted', () => {
    renderCard({ status: 'totally_unknown_status' });
    expect(screen.getByTestId('acknowledge-box')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Field rendering
// ---------------------------------------------------------------------------
describe('BuildStatusCard — field rendering', () => {
  it('renders projectName, status, branch, username, and commitSubject', () => {
    renderCard({
      projectName: 'payments-service',
      status: 'running',
      branch: 'feature/checkout',
      username: 'bob',
      commitSubject: 'feat: add checkout flow',
    });

    expect(screen.getByText('payments-service')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
    expect(screen.getByText('feature/checkout')).toBeInTheDocument();
    expect(screen.getByText(/bob/)).toBeInTheDocument();
    expect(screen.getByText('feat: add checkout flow')).toBeInTheDocument();
  });

  it('formats stopTime as YYYY-MM-DD HH:mm:ss (not the raw ISO string)', () => {
    renderCard({ stopTime: '2026-03-06T14:30:00Z' });
    // Raw ISO string must not appear
    expect(screen.queryByText('2026-03-06T14:30:00Z')).not.toBeInTheDocument();
    // Formatted string matches expected pattern (timezone-independent assertion)
    expect(
      screen.getByText(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
describe('BuildStatusCard — edge cases', () => {
  it('renders without crashing when string fields are empty', () => {
    expect(() =>
      renderCard({ username: '', avatarUrl: '', commitSubject: '', branch: '' })
    ).not.toThrow();
  });

  it('displays "Invalid date" without crashing when stopTime is empty', () => {
    renderCard({ stopTime: '' });
    expect(screen.getByText('Invalid date')).toBeInTheDocument();
  });
});
