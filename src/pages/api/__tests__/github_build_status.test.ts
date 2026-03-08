import { getAllGitHubStatus } from '../github_build_status';

jest.mock('../../../../config/build_status.config', () => ({
  buildStatusConfig: {
    datasource: {
      github: {
        enabled: true,
        apiToken: 'ghp_fake_token',
        baseUrl: 'https://api.github.com',
        projects: [
          {
            projectName: 'vscode',
            owner: 'microsoft',
            repo: 'vscode',
            branch: 'master',
            workflowId: 123,
            level: 'high',
          },
        ],
      },
      circleCI: { enabled: false, projects: [] },
    },
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const okJson = (body: unknown) =>
  Promise.resolve({ ok: true, json: async () => body });
const errJson = (body: unknown, status = 401) =>
  Promise.resolve({ ok: false, status, json: async () => body });

describe('getAllGitHubStatus', () => {
  afterEach(() => {
    mockFetch.mockReset();
    jest.requireMock('../../../../config/build_status.config').buildStatusConfig.datasource.github.enabled = true;
  });

  it('returns empty array when github.enabled is false', async () => {
    jest.requireMock('../../../../config/build_status.config').buildStatusConfig.datasource.github.enabled = false;

    const result = await getAllGitHubStatus();
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('maps status to conclusion when workflow run is "completed"', async () => {
    mockFetch.mockReturnValueOnce(okJson({
      workflow_runs: [{
        id: 1001,
        status: 'completed',
        conclusion: 'success',
        updated_at: '2026-02-27T12:00:00Z',
        triggering_actor: { login: 'jsmith', avatar_url: 'https://avatars.gh/jsmith' },
        head_commit: { message: 'chore: bump deps' },
      }],
    }));

    const [result] = await getAllGitHubStatus();
    expect(result.status).toBe('success');
    expect(result.username).toBe('jsmith');
    expect(result.avatarUrl).toBe('https://avatars.gh/jsmith');
    expect(result.commitSubject).toBe('chore: bump deps');
    expect(result.platform).toBe('Github');
    expect(result.level).toBe('high');
    expect(result.owner).toBe('microsoft');
    expect(result.repo).toBe('vscode');
    expect(result.runId).toBe(1001);
  });

  it('keeps raw status when workflow run is not "completed"', async () => {
    mockFetch.mockReturnValueOnce(okJson({
      workflow_runs: [{
        id: 1002,
        status: 'in_progress',
        conclusion: null,
        updated_at: '2026-02-27T12:00:00Z',
        triggering_actor: null,
        head_commit: null,
      }],
    }));

    const [result] = await getAllGitHubStatus();
    expect(result.status).toBe('in_progress');
    expect(result.username).toBeUndefined();
    expect(result.avatarUrl).toBeUndefined();
    expect(result.commitSubject).toBeUndefined();
  });

  it('throws clear error when no workflow run is returned', async () => {
    mockFetch.mockReturnValueOnce(okJson({ workflow_runs: [] }));
    await expect(getAllGitHubStatus()).rejects.toThrow(
      'No workflow runs found for microsoft/vscode workflow 123'
    );
  });

  it('throws formatted error when GitHub API returns non-ok', async () => {
    mockFetch.mockReturnValueOnce(errJson({ message: 'Bad credentials' }, 401));
    await expect(getAllGitHubStatus()).rejects.toThrow('{"message":"Bad credentials"}');
  });

  it('fetches jobs_url and returns failedJobInfo when conclusion is "failure"', async () => {
    mockFetch
      .mockReturnValueOnce(okJson({
        workflow_runs: [{
          id: 1003,
          status: 'completed',
          conclusion: 'failure',
          updated_at: '2026-02-27T12:00:00Z',
          jobs_url: 'https://api.github.com/repos/microsoft/vscode/actions/runs/999/jobs',
          triggering_actor: { login: 'jsmith', avatar_url: 'https://avatars.gh/jsmith' },
          head_commit: { message: 'fix: something' },
        }],
      }))
      .mockReturnValueOnce(okJson({
        total_count: 1,
        jobs: [
          {
            name: 'build',
            conclusion: 'failure',
            steps: [
              { name: 'Set up Node', conclusion: 'success', number: 1 },
              { name: 'Run unit tests', conclusion: 'failure', number: 2 },
              { name: 'Upload artifacts', conclusion: 'skipped', number: 3 },
            ],
          },
          {
            name: 'lint',
            conclusion: 'success',
            steps: [{ name: 'Run ESLint', conclusion: 'success', number: 1 }],
          },
        ],
      }));

    const [result] = await getAllGitHubStatus();
    expect(result.status).toBe('failure');
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://api.github.com/repos/microsoft/vscode/actions/runs/999/jobs',
      expect.objectContaining({ headers: { Authorization: 'Bearer ghp_fake_token' } }),
    );
    expect(result.failedJobInfo).toEqual([
      { jobName: 'build', failedSteps: ['Run unit tests'] },
    ]);
  });

  it('fetches jobs_url and returns failedJobInfo when conclusion is "startup_failure"', async () => {
    mockFetch
      .mockReturnValueOnce(okJson({
        workflow_runs: [{
          status: 'completed',
          conclusion: 'startup_failure',
          updated_at: '2026-02-27T12:00:00Z',
          jobs_url: 'https://api.github.com/repos/microsoft/vscode/actions/runs/1000/jobs',
          triggering_actor: { login: 'jsmith', avatar_url: 'https://avatars.gh/jsmith' },
          head_commit: { message: 'fix: startup fail' },
        }],
      }))
      .mockReturnValueOnce(okJson({
        total_count: 1,
        jobs: [
          {
            name: 'setup-runner',
            conclusion: 'startup_failure',
            steps: [{ name: 'Provision runner', conclusion: 'startup_failure', number: 1 }],
          },
        ],
      }));

    const [result] = await getAllGitHubStatus();
    expect(result.status).toBe('startup_failure');
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.failedJobInfo).toEqual([
      { jobName: 'setup-runner', failedSteps: ['Provision runner'] },
    ]);
  });

  it('does not fetch jobs_url and leaves failedJobInfo undefined when conclusion is "success"', async () => {
    mockFetch.mockReturnValueOnce(okJson({
      workflow_runs: [{
        id: 1004,
        status: 'completed',
        conclusion: 'success',
        updated_at: '2026-02-27T12:00:00Z',
        jobs_url: 'https://api.github.com/repos/microsoft/vscode/actions/runs/999/jobs',
        triggering_actor: { login: 'jsmith', avatar_url: 'https://avatars.gh/jsmith' },
        head_commit: { message: 'fix: all good' },
      }],
    }));

    const [result] = await getAllGitHubStatus();
    expect(result.status).toBe('success');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.failedJobInfo).toBeUndefined();
  });

  it('trims job name to the last slash segment when job name contains "/"', async () => {
    mockFetch
      .mockReturnValueOnce(okJson({
        workflow_runs: [{
          id: 1005,
          status: 'completed',
          conclusion: 'failure',
          updated_at: '2026-02-27T12:00:00Z',
          jobs_url: 'https://api.github.com/repos/microsoft/vscode/actions/runs/999/jobs',
          triggering_actor: { login: 'jsmith', avatar_url: 'https://avatars.gh/jsmith' },
          head_commit: { message: 'fix: broken' },
        }],
      }))
      .mockReturnValueOnce(okJson({
        total_count: 2,
        jobs: [
          {
            name: 'provider_verify_pact / verify-pact-as-provider',
            conclusion: 'failure',
            steps: [{ name: 'Run pact test', conclusion: 'failure', number: 1 }],
          },
          {
            name: 'deploy_and_test',
            conclusion: 'failure',
            steps: [{ name: 'Functional test', conclusion: 'failure', number: 1 }],
          },
        ],
      }));

    const [result] = await getAllGitHubStatus();
    expect(result.failedJobInfo).toEqual([
      { jobName: 'verify-pact-as-provider', failedSteps: ['Run pact test'] },
      { jobName: 'deploy_and_test', failedSteps: ['Functional test'] },
    ]);
  });

  it('returns failed job name with empty failedSteps when failed step does not exist', async () => {
    mockFetch
      .mockReturnValueOnce(okJson({
        workflow_runs: [{
          status: 'completed',
          conclusion: 'failure',
          updated_at: '2026-02-27T12:00:00Z',
          jobs_url: 'https://api.github.com/repos/microsoft/vscode/actions/runs/1001/jobs',
          triggering_actor: { login: 'jsmith', avatar_url: 'https://avatars.gh/jsmith' },
          head_commit: { message: 'fix: unclear error' },
        }],
      }))
      .mockReturnValueOnce(okJson({
        total_count: 2,
        jobs: [
          {
            name: 'build',
            conclusion: 'failure',
            steps: [
              { name: 'Set up Node', conclusion: 'success', number: 1 },
              { name: 'Upload artifacts', conclusion: 'skipped', number: 2 },
            ],
          },
          {
            name: 'lint',
            conclusion: 'success',
            steps: [{ name: 'Run ESLint', conclusion: 'failure', number: 1 }],
          },
        ],
      }));

    const [result] = await getAllGitHubStatus();
    expect(result.status).toBe('failure');
    expect(result.failedJobInfo).toEqual([
      { jobName: 'build', failedSteps: [] },
    ]);
  });

  it('returns failedJobInfo as empty array when no failed job exists', async () => {
    mockFetch
      .mockReturnValueOnce(okJson({
        workflow_runs: [{
          status: 'completed',
          conclusion: 'failure',
          updated_at: '2026-02-27T12:00:00Z',
          jobs_url: 'https://api.github.com/repos/microsoft/vscode/actions/runs/1002/jobs',
          triggering_actor: { login: 'jsmith', avatar_url: 'https://avatars.gh/jsmith' },
          head_commit: { message: 'fix: no failed jobs' },
        }],
      }))
      .mockReturnValueOnce(okJson({
        total_count: 2,
        jobs: [
          {
            name: 'build',
            conclusion: 'success',
            steps: [{ name: 'Set up Node', conclusion: 'success', number: 1 }],
          },
          {
            name: 'lint',
            conclusion: 'success',
            steps: [{ name: 'Run ESLint', conclusion: 'failure', number: 1 }],
          },
        ],
      }));

    const [result] = await getAllGitHubStatus();
    expect(result.status).toBe('failure');
    expect(result.failedJobInfo).toEqual([]);
  });

  it('returns failedJobInfo as empty array when jobs API call fails', async () => {
    mockFetch
      .mockReturnValueOnce(okJson({
        workflow_runs: [{
          id: 1006,
          status: 'completed',
          conclusion: 'failure',
          updated_at: '2026-02-27T12:00:00Z',
          jobs_url: 'https://api.github.com/repos/microsoft/vscode/actions/runs/999/jobs',
          triggering_actor: { login: 'jsmith', avatar_url: 'https://avatars.gh/jsmith' },
          head_commit: { message: 'fix: broken' },
        }],
      }))
      .mockReturnValueOnce(errJson({ message: 'Not Found' }, 404));

    const [result] = await getAllGitHubStatus();
    expect(result.status).toBe('failure');
    expect(result.failedJobInfo).toEqual([]);
  });
});

