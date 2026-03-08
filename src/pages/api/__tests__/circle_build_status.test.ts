import { getAllCircleBuildStatus } from '../circle_build_status';

jest.mock('../../../../config/build_status.config', () => ({
  buildStatusConfig: {
    datasource: {
      circleCI: {
        enabled: true,
        apiToken: 'fake-circle-token',
        projects: [
          {
            projectName: 'payment-service',
            projectSlug: 'gh/acme/payment-service',
            branch: 'main',
            level: 'high',
          },
        ],
      },
      github: { enabled: false, projects: [] },
    },
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const pipelineBody = {
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

const workflowBody = {
  items: [
    { id: 'wf-001', status: 'failed', created_at: '2026-02-27T10:05:00Z' },
    { id: 'wf-002', status: 'success', created_at: '2026-02-27T09:00:00Z' },
  ],
};

const okJson = (body: unknown) =>
  Promise.resolve({ ok: true, json: async () => body });
const errJson = (body: unknown, status = 401) =>
  Promise.resolve({ ok: false, status, json: async () => body });

describe('getAllCircleBuildStatus', () => {
  afterEach(() => {
    mockFetch.mockReset();
    jest.requireMock('../../../../config/build_status.config').buildStatusConfig.datasource.circleCI.enabled = true;
  });

  it('returns empty array when circleCI is disabled', async () => {
    jest.requireMock('../../../../config/build_status.config').buildStatusConfig.datasource.circleCI.enabled = false;

    const result = await getAllCircleBuildStatus();
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('selects most recent pipeline ordered by updated_at desc', async () => {
    mockFetch
      .mockReturnValueOnce(okJson(pipelineBody))
      .mockReturnValueOnce(okJson(workflowBody));

    const [result] = await getAllCircleBuildStatus();

    expect(result.username).toBe('dev-alice');
    expect(result.commitSubject).toBe('fix: payment timeout');
    expect(result.platform).toBe('CircleCI');
    expect(result.branch).toBe('main');
    expect(result.level).toBe('high');
  });

  it('selects most recent workflow ordered by created_at desc', async () => {
    mockFetch
      .mockReturnValueOnce(okJson(pipelineBody))
      .mockReturnValueOnce(okJson(workflowBody));

    const [result] = await getAllCircleBuildStatus();
    // wf-001 has created_at 10:05, wf-002 has 09:00 — desc order picks wf-001 = 'failed'
    expect(result.status).toBe('failed');
  });

  it('falls back to "automatically triggered" when vcs.commit is null', async () => {
    const nullCommitPipeline = {
      items: [{
        id: 'pipe-002',
        updated_at: '2026-02-27T10:00:00Z',
        trigger: { actor: { login: 'dev-bob', avatar_url: 'https://avatars.gh/bob' } },
        vcs: { commit: null },
      }],
    };
    mockFetch
      .mockReturnValueOnce(okJson(nullCommitPipeline))
      .mockReturnValueOnce(okJson(workflowBody));

    const [result] = await getAllCircleBuildStatus();
    expect(result.commitSubject).toBe('automatically triggered');
  });

  it('throws when CircleCI pipeline fetch returns non-ok', async () => {
    mockFetch.mockReturnValueOnce(errJson({ message: 'Unauthorized' }, 401));
    await expect(getAllCircleBuildStatus()).rejects.toThrow('{"message":"Unauthorized"}');
  });

  it('throws when CircleCI workflow fetch returns non-ok', async () => {
    mockFetch
      .mockReturnValueOnce(okJson(pipelineBody))
      .mockReturnValueOnce(errJson({ message: 'Not Found' }, 404));
    await expect(getAllCircleBuildStatus()).rejects.toThrow('{"message":"Not Found"}');
  });
});
