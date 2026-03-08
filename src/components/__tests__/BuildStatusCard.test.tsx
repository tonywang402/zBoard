import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import BuildStatusCard, { BuildStatus, statusColorScheme } from '../BuildStatusCard';

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
// ---------------------------------------------------------------------------
describe('BuildStatusCard — color scheme derivation', () => {
  it.each([
    ['failed',          'red'],
    ['failure',         'red'],
    ['timed_out',       'red'],
    ['startup_failure', 'red'],
    ['success',         'green'],
    ['completed',       'green'],
    ['running',         'blue'],
    ['in_progress',     'blue'],
    ['waiting',         'yellow'],
    ['on_hold',         'purple'],
    ['action_required', 'purple'],
    ['canceled',        'gray'],
    ['cancelled',       'gray'],
    ['skipped',         'gray'],
    ['queued',          'gray'],
    ['requested',       'gray'],
    ['pending',         'gray'],
    ['stale',           'gray'],
  ])('status "%s" → color "%s"', (status, expectedColor) => {
    expect(statusColorScheme[status]).toBe(expectedColor);
  });

  it('unknown status falls back to red', () => {
    // statusColorScheme has no entry for the unknown key
    expect(statusColorScheme['totally_unknown_status']).toBeUndefined();
    // Component renders without crashing and uses the fallback
    renderCard({ status: 'totally_unknown_status' });
    expect(screen.getByText('totally_unknown_status')).toBeInTheDocument();
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

// ---------------------------------------------------------------------------
// Failure detail popover (GitHub Actions)
// ---------------------------------------------------------------------------
describe('BuildStatusCard — failure detail popover', () => {
  it('renders job name and step name in popover content when failedJobInfo is provided with failure status', async () => {
    renderCard({
      status: 'failure',
      failedJobInfo: [
        { jobName: 'build', failedSteps: ['Run unit tests', 'Upload artifacts'] },
      ],
    });

    expect(screen.getByText('build')).toBeInTheDocument();
    expect(screen.getByText('Run unit tests')).toBeInTheDocument();
    expect(screen.getByText('Upload artifacts')).toBeInTheDocument();
  });

  it('renders popover title when status is startup_failure and failedJobInfo is empty', () => {
    renderCard({ status: 'startup_failure', failedJobInfo: [] });

    expect(screen.getByText('Failed Jobs')).toBeInTheDocument();
  });

  it('renders failed job title with an empty step list for startup_failure', () => {
    renderCard({
      status: 'startup_failure',
      failedJobInfo: [{ jobName: 'load_test', failedSteps: [] }],
    });

    expect(screen.getByText('Failed Jobs')).toBeInTheDocument();
    expect(screen.getByText('load_test')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('renders popover title when failure status has no failedJobInfo', () => {
    renderCard({ status: 'failure' });

    expect(screen.getByText('Failed Jobs')).toBeInTheDocument();
    expect(screen.queryByText('build')).not.toBeInTheDocument();
  });

  it('does not render popover content for non-red status even when failedJobInfo exists', () => {
    renderCard({
      status: 'success',
      failedJobInfo: [{ jobName: 'build', failedSteps: ['Run unit tests'] }],
    });

    expect(screen.queryByText('Failed Jobs')).not.toBeInTheDocument();
    expect(screen.queryByText('build')).not.toBeInTheDocument();
  });
});
