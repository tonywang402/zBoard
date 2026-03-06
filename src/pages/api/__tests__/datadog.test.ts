import { getMonitorColor } from '../datadog';

jest.mock('@datadog/datadog-api-client', () => ({
  client: { createConfiguration: jest.fn() },
  v1: { MonitorsApi: jest.fn() },
}));
jest.mock('../../../../config/datadog_monitor.config', () => ({
  monitorConfig: {
    datasource: {
      datadog: { enabled: false, projects: [] },
    },
  },
}));

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
