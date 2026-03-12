import handler from '../datadog_alert';

const mockSearchMonitors = jest.fn();

jest.mock('@datadog/datadog-api-client', () => ({
  client: { createConfiguration: jest.fn() },
  v1: {
    MonitorsApi: jest.fn(() => ({
      searchMonitors: mockSearchMonitors,
    })),
  },
}));

jest.mock('../../../../config/datadog_monitor.config', () => ({
  monitorConfig: {
    datasource: {
      datadog: {
        enabled: true,
        alertTags: ['otr_team:otr_team_changan'],
        projects: [
          {
            projectName: 'handover',
            monitorConfigs: [{ env: 'prod', priority: 1, alertStrategy: 'high' }],
          },
        ],
      },
    },
  },
}));

const createMockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
};

describe('datadog_alert route', () => {
  afterEach(() => {
    mockSearchMonitors.mockReset();

    const config = jest.requireMock('../../../../config/datadog_monitor.config').monitorConfig;
    config.datasource.datadog.enabled = true;
    config.datasource.datadog.alertTags = ['otr_team:otr_team_changan'];
    config.datasource.datadog.projects = [
      {
        projectName: 'handover',
        monitorConfigs: [{ env: 'prod', priority: 1, alertStrategy: 'high' }],
      },
    ];
  });

  it('queries Datadog by env + status + alert tag without service filter', async () => {
    mockSearchMonitors.mockResolvedValue({ monitors: [] });
    const res = createMockRes();

    await handler({} as any, res as any);

    expect(mockSearchMonitors).toHaveBeenCalledTimes(1);
    const [params] = mockSearchMonitors.mock.calls[0];
    expect(params.query).toBe('env: prod status: alert tag:otr_team:otr_team_changan');
    expect(params.query).not.toContain('service:');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('maps Datadog monitor fields to alert response shape', async () => {
    mockSearchMonitors.mockResolvedValue({
      monitors: [{ name: 'prod error monitor', id: 101, lastTriggeredTs: 1711000000 }],
    });
    const res = createMockRes();

    await handler({} as any, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      {
        name: 'prod error monitor',
        id: 101,
        triggeredTime: 1711000000,
        env: 'prod',
        priority: 1,
        alertStrategy: 'high',
      },
    ]);
  });

  it('returns 500 when alertTags[0] is missing', async () => {
    const config = jest.requireMock('../../../../config/datadog_monitor.config').monitorConfig;
    config.datasource.datadog.alertTags = [];
    const res = createMockRes();

    await handler({} as any, res as any);

    expect(mockSearchMonitors).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('datadog datasource alertTags[0] is required');
  });
});
