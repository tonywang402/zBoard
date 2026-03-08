import handler from '../github_rerun_failed_jobs';

jest.mock('../../../../config/build_status.config', () => ({
  buildStatusConfig: {
    datasource: {
      github: {
        enabled: true,
        apiToken: 'ghp_fake_token',
        baseUrl: 'https://api.github.com',
        projects: [{ owner: 'microsoft', repo: 'vscode' }],
      },
      circleCI: { enabled: false, projects: [] },
    },
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const okResponse = () =>
  Promise.resolve({
    ok: true,
    json: async () => ({}),
    text: async () => '',
  });

const errJson = (body: unknown, status = 403) =>
  Promise.resolve({
    ok: false,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });

const createMockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
  };
  return res;
};

describe('github_rerun_failed_jobs route', () => {
  afterEach(() => {
    mockFetch.mockReset();
    const config = jest.requireMock('../../../../config/build_status.config').buildStatusConfig;
    config.datasource.github.enabled = true;
    config.datasource.github.apiToken = 'ghp_fake_token';
    config.datasource.github.projects = [{ owner: 'microsoft', repo: 'vscode' }];
  });

  it('returns 405 for non-POST methods', async () => {
    const req = { method: 'GET' };
    const res = createMockRes();

    await handler(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith('Allow', ['POST']);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Method not allowed',
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 when required body fields are missing', async () => {
    const req = { method: 'POST', body: { owner: 'microsoft' } };
    const res = createMockRes();

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'owner, repo, and runId are required',
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 200 and proxies GitHub rerun-failed-jobs call', async () => {
    mockFetch.mockReturnValueOnce(okResponse());

    const req = {
      method: 'POST',
      body: { owner: 'microsoft', repo: 'vscode', runId: '123' },
    };
    const res = createMockRes();

    await handler(req as any, res as any);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/microsoft/vscode/actions/runs/123/rerun-failed-jobs',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ghp_fake_token',
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Rerun request accepted',
    });
  });

  it('returns 403 when owner/repo is not configured for rerun', async () => {
    const req = {
      method: 'POST',
      body: { owner: 'another-org', repo: 'another-repo', runId: 123 },
    };
    const res = createMockRes();

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'owner/repo is not configured for rerun',
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 500 when GitHub API returns non-ok', async () => {
    mockFetch.mockReturnValueOnce(errJson({ message: 'Forbidden' }, 403));

    const req = {
      method: 'POST',
      body: { owner: 'microsoft', repo: 'vscode', runId: 123 },
    };
    const res = createMockRes();

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('{"message":"Forbidden"}');
  });
});
