import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import BuildStatusCard, { BuildStatus, statusColorScheme } from '../BuildStatusCard';

const mockToastError = jest.fn();
const mockToastInfo = jest.fn();

jest.mock('@/lib/customToast', () => ({
  useErrorToast: () => mockToastError,
  useInfoToast: () => mockToastInfo,
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

const renderCard = (
  overrides: Partial<BuildStatus> = {},
  options: { onRerunSuccess?: () => Promise<void> | void } = {}
) =>
  render(
    <ChakraProvider>
      <BuildStatusCard
        buildStatus={{ ...base, ...overrides }}
        onRerunSuccess={options.onRerunSuccess}
      />
    </ChakraProvider>
  );

// ---------------------------------------------------------------------------
// Color scheme derivation
// ---------------------------------------------------------------------------
describe('BuildStatusCard — color scheme derivation', () => {
  afterEach(() => {
    mockToastError.mockReset();
    mockToastInfo.mockReset();
  });

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
  afterEach(() => {
    mockToastError.mockReset();
    mockToastInfo.mockReset();
  });

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
  afterEach(() => {
    mockToastError.mockReset();
    mockToastInfo.mockReset();
  });

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
  afterEach(() => {
    mockToastError.mockReset();
    mockToastInfo.mockReset();
  });

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

describe('BuildStatusCard — rerun failed jobs action', () => {
  const mockFetch = global.fetch as jest.Mock;

  afterEach(() => {
    mockFetch.mockReset();
    mockToastError.mockReset();
    mockToastInfo.mockReset();
  });

  it('shows rerun icon for GitHub failure cards with rerun metadata', () => {
    renderCard({
      platform: 'Github',
      status: 'failure',
      owner: 'microsoft',
      repo: 'vscode',
      runId: 123,
      failedJobInfo: [{ jobName: 'build', failedSteps: ['Run unit tests'] }],
    });

    expect(screen.getByLabelText('Rerun failed jobs')).toBeInTheDocument();
  });

  it('hides rerun icon when rerun metadata is incomplete', () => {
    renderCard({
      platform: 'Github',
      status: 'failure',
      owner: 'microsoft',
      repo: 'vscode',
      failedJobInfo: [{ jobName: 'build', failedSteps: ['Run unit tests'] }],
    });

    expect(screen.queryByLabelText('Rerun failed jobs')).not.toBeInTheDocument();
  });

  it('posts rerun payload and triggers immediate refresh callback on success', async () => {
    const user = userEvent.setup();
    const onRerunSuccess = jest.fn().mockResolvedValue(undefined);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '',
      json: async () => ({}),
    });

    renderCard(
      {
        platform: 'Github',
        status: 'failure',
        owner: 'microsoft',
        repo: 'vscode',
        runId: 123,
        failedJobInfo: [{ jobName: 'build', failedSteps: ['Run unit tests'] }],
      },
      { onRerunSuccess }
    );

    await user.click(screen.getByLabelText('Rerun failed jobs'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/github_rerun_failed_jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: 'microsoft', repo: 'vscode', runId: 123 }),
      });
    });
    expect(mockToastInfo).toHaveBeenCalledWith(
      'Rerun triggered',
      'Failed jobs rerun requested for my-service'
    );
    expect(onRerunSuccess).toHaveBeenCalledTimes(1);
  });

  it('disables rerun icon while request is in flight', async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: unknown) => void;
    const pendingRequest = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    mockFetch.mockReturnValueOnce(pendingRequest);

    renderCard({
      platform: 'Github',
      status: 'failure',
      owner: 'microsoft',
      repo: 'vscode',
      runId: 123,
      failedJobInfo: [{ jobName: 'build', failedSteps: ['Run unit tests'] }],
    });

    const rerunButton = screen.getByLabelText('Rerun failed jobs');
    await user.click(rerunButton);

    await waitFor(() => {
      expect(rerunButton).toBeDisabled();
    });

    resolveFetch!({
      ok: true,
      text: async () => '',
      json: async () => ({}),
    });

    await waitFor(() => {
      expect(rerunButton).not.toBeDisabled();
    });
  });

  it('shows error toast and skips refresh callback on failed rerun request', async () => {
    const user = userEvent.setup();
    const onRerunSuccess = jest.fn();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => JSON.stringify({ message: 'Forbidden' }),
      json: async () => ({ message: 'Forbidden' }),
    });

    renderCard(
      {
        platform: 'Github',
        status: 'failure',
        owner: 'microsoft',
        repo: 'vscode',
        runId: 123,
        failedJobInfo: [{ jobName: 'build', failedSteps: ['Run unit tests'] }],
      },
      { onRerunSuccess }
    );

    await user.click(screen.getByLabelText('Rerun failed jobs'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Forbidden');
    });
    expect(onRerunSuccess).not.toHaveBeenCalled();
  });
});
