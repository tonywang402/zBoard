import handler, { getMonitorColor } from '../datadog';

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

describe('datadog route', () => {
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
    mockSearchMonitors.mockResolvedValue({ counts: { status: [{ name: 'Alert', count: 1 }] } });
    const res = createMockRes();

    await handler({} as any, res as any);

    expect(mockSearchMonitors).toHaveBeenCalledTimes(1);
    const [params] = mockSearchMonitors.mock.calls[0];
    expect(params.query).toBe('env: prod status: alert tag:otr_team:otr_team_changan');
    expect(params.query).not.toContain('service:');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('maps Datadog counts and color in monitor response', async () => {
    mockSearchMonitors.mockResolvedValue({ counts: { status: [{ name: 'OK', count: 2 }] } });
    const res = createMockRes();

    await handler({} as any, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      {
        projectName: 'handover',
        monitorInfo: [
          {
            env: 'prod',
            priority: 1,
            alertStrategy: 'high',
            color: 'green',
            status: [{ name: 'OK', count: 2 }],
          },
        ],
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

describe('getMonitorColor', () => {
  it('returns "grey" when counts is undefined', () => {
    expect(getMonitorColor(undefined)).toBe('grey');
  });

  it('returns "grey" when counts.status is undefined', () => {
    expect(getMonitorColor({} as any)).toBe('grey');
  });

  it('returns "grey" when counts.status is an empty array', () => {
    expect(getMonitorColor({ status: [] } as any)).toBe('grey');
  });

  it('returns "red" when any status item has name "Alert"', () => {
    expect(
      getMonitorColor({ status: [{ name: 'OK', count: 5 }, { name: 'Alert', count: 2 }] } as any)
    ).toBe('red');
  });

  it('returns "red" when Alert is the only status item', () => {
    expect(getMonitorColor({ status: [{ name: 'Alert', count: 1 }] } as any)).toBe('red');
  });

  it('returns "green" when status items exist but none is "Alert"', () => {
    expect(getMonitorColor({ status: [{ name: 'OK', count: 10 }] } as any)).toBe('green');
  });

  it('returns "green" when status has multiple non-Alert items', () => {
    expect(
      getMonitorColor({ status: [{ name: 'OK', count: 5 }, { name: 'Warn', count: 2 }] } as any)
    ).toBe('green');
  });
});
