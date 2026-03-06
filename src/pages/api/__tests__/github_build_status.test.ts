import { getAllGitHubStatus } from '../github_build_status';

jest.mock('../../../../config/build_status.config', () => ({
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
  });

  it('keeps raw status when workflow run is not "completed"', async () => {
    mockFetch.mockReturnValueOnce(okJson({
      workflow_runs: [{
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

  it('throws formatted error when GitHub API returns non-ok', async () => {
    mockFetch.mockReturnValueOnce(errJson({ message: 'Bad credentials' }, 401));
    await expect(getAllGitHubStatus()).rejects.toThrow('{"message":"Bad credentials"}');
  });
});

