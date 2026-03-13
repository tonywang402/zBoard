import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import DatadogAlertsOverview from '../DatadogAlertsOverview';

const mockAlertCardLifecycle = {
  mountCount: 0,
  unmountCount: 0,
};

jest.mock('../../../config/datadog_monitor.config', () => ({
  monitorConfig: { title: 'Datadog Alerts', refreshIntervalSeconds: 0 },
}));

jest.mock('../RefreshWrapper', () => {
  const React = require('react');

  return {
    __esModule: true,
    default: ({
      onRefresh,
      render,
    }: {
      onRefresh: () => Promise<unknown[]>;
      render: (data: unknown[]) => JSX.Element;
    }) => {
      const [data, setData] = React.useState([] as unknown[]);

      React.useEffect(() => {
        let isActive = true;

        const loadData = async () => {
          const response = await onRefresh();
          if (isActive) {
            setData(response || []);
          }
        };

        loadData();
        return () => {
          isActive = false;
        };
      }, [onRefresh]);

      return <div data-testid="refresh-wrapper">{render(data as never[])}</div>;
    },
  };
});

jest.mock('../AlertCard', () => ({
  AlertCard: ({ alertStrategy, id }: { alertStrategy: string; id: number }) => {
    React.useEffect(() => {
      mockAlertCardLifecycle.mountCount += 1;

      return () => {
        mockAlertCardLifecycle.unmountCount += 1;
      };
    }, []);

    return <div data-testid={`alert-card-${alertStrategy}-${id}`}>{`alert-${alertStrategy}-${id}`}</div>;
  },
}));

interface TestAlert {
  name: string;
  id: number;
  triggeredTime: number;
  env: string;
  priority: number;
  alertStrategy: string;
}

interface TestStatusCount {
  name: string;
  count: number;
}

interface TestMonitorInfo {
  env: string;
  priority: number;
  alertStrategy: string;
  color: string;
  status?: TestStatusCount[];
}

interface TestMonitorProject {
  projectName: string;
  monitorInfo: TestMonitorInfo[];
}

const makeAlert = (id: number, alertStrategy: string): TestAlert => ({
  name: `Monitor alert ${id}`,
  id,
  triggeredTime: 1700000000 + id,
  env: 'prod',
  priority: 1,
  alertStrategy,
});

const makeMonitorInfo = (env: string, priority: number, alertCount: number): TestMonitorInfo => ({
  env,
  priority,
  alertStrategy: alertCount > 0 ? 'high' : 'medium',
  color: alertCount > 0 ? 'red' : 'green',
  status: [
    { name: 'OK', count: 4 },
    { name: 'Alert', count: alertCount },
    { name: 'No Data', count: 0 },
  ],
});

const defaultMonitorData: TestMonitorProject[] = [
  {
    projectName: 'handover',
    monitorInfo: [makeMonitorInfo('prod', 1, 1), makeMonitorInfo('int', 2, 0)],
  },
];

const renderOverview = () =>
  render(
    <ChakraProvider>
      <DatadogAlertsOverview />
    </ChakraProvider>
  );

const mockFetchData = ({
  alerts,
  monitors = defaultMonitorData,
}: {
  alerts: TestAlert[];
  monitors?: TestMonitorProject[];
}) => {
  let fallbackCallIndex = 0;

  (global.fetch as jest.Mock).mockImplementation(async (input: any) => {
    const url = typeof input === 'string' ? input : String(input?.url || input);

    const monitorResponse = {
      ok: true,
      json: async () => [...monitors],
    };

    const alertResponse = {
      ok: true,
      json: async () => [...alerts],
    };

    if (url.includes('/api/datadog_alert')) {
      return alertResponse;
    }

    if (url.includes('/api/datadog')) {
      return monitorResponse;
    }

    fallbackCallIndex += 1;
    return fallbackCallIndex % 2 === 1 ? monitorResponse : alertResponse;
  });
};

describe('DatadogAlertsOverview summary and carousel', () => {
  afterEach(() => {
    jest.useRealTimers();
    (global.fetch as jest.Mock).mockReset();
    mockAlertCardLifecycle.mountCount = 0;
    mockAlertCardLifecycle.unmountCount = 0;
  });

  it('does not unmount alert cards when switching carousel pages', async () => {
    jest.useFakeTimers();

    mockFetchData({
      alerts: [makeAlert(1, 'high'), makeAlert(2, 'high'), makeAlert(3, 'high'), makeAlert(4, 'low')],
    });

    renderOverview();

    await screen.findByTestId('alert-card-high-1');
    expect(mockAlertCardLifecycle.unmountCount).toBe(0);

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockAlertCardLifecycle.unmountCount).toBe(0);
  });

  it('renders monitor alert stats and only high alerts in the carousel', async () => {
    mockFetchData({
      alerts: [
        makeAlert(1, 'high'),
        makeAlert(2, 'high'),
        makeAlert(3, 'high'),
        makeAlert(4, 'medium'),
        makeAlert(5, 'low'),
      ],
    });

    renderOverview();

    await screen.findByTestId('alert-card-high-1');
    expect(screen.getByTestId('monitor-alert-count-prod')).toHaveTextContent('1');
    expect(screen.getByTestId('monitor-alert-count-int')).toHaveTextContent('0');
    expect(screen.getByTestId('alert-card-high-1')).toBeVisible();
    expect(screen.getByTestId('alert-card-high-2')).toBeVisible();
    expect(screen.getByTestId('alert-card-high-3')).not.toBeVisible();
    expect(screen.queryByTestId('alert-card-medium-4')).not.toBeInTheDocument();
    expect(screen.queryByTestId('alert-card-low-5')).not.toBeInTheDocument();
  });

  it('auto-rotates the high alert group every 10 seconds', async () => {
    jest.useFakeTimers();

    mockFetchData({
      alerts: [makeAlert(1, 'high'), makeAlert(2, 'high'), makeAlert(3, 'high')],
    });

    renderOverview();

    await screen.findByTestId('alert-card-high-1');
    expect(screen.getByTestId('alert-card-high-1')).toBeVisible();
    expect(screen.getByTestId('alert-card-high-3')).not.toBeVisible();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.getByTestId('alert-card-high-1')).not.toBeVisible();
    expect(screen.getByTestId('alert-card-high-3')).toBeVisible();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.getByTestId('alert-card-high-1')).toBeInTheDocument();
    expect(screen.queryByTestId('alert-card-medium-4')).not.toBeInTheDocument();
    expect(screen.queryByTestId('alert-card-low-9')).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it('manual next button updates the high alert page', async () => {
    mockFetchData({
      alerts: [makeAlert(1, 'high'), makeAlert(2, 'high'), makeAlert(3, 'high')],
    });

    renderOverview();

    await screen.findByTestId('alert-card-high-1');
    const nextHighButton = screen.getByRole('button', { name: 'Next high alerts' });
    fireEvent.click(nextHighButton);

    expect(screen.getByTestId('alert-card-high-1')).not.toBeVisible();
    expect(screen.getByTestId('alert-card-high-3')).toBeVisible();
    expect(screen.queryByTestId('alert-card-medium-4')).not.toBeInTheDocument();
  });

  it('hides navigation buttons when high alerts fit on one page', async () => {
    mockFetchData({
      alerts: [makeAlert(1, 'high'), makeAlert(2, 'high'), makeAlert(7, 'low')],
    });

    renderOverview();

    await screen.findByTestId('alert-card-high-1');
    expect(screen.queryByRole('button', { name: 'Next high alerts' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous high alerts' })).not.toBeInTheDocument();
  });

  it('shows high-alert empty state when only non-high alerts are returned', async () => {
    mockFetchData({ alerts: [makeAlert(7, 'low'), makeAlert(8, 'medium')] });

    renderOverview();

    await screen.findByTestId('monitor-alert-count-prod');
    expect(screen.getByTestId('monitor-alert-count-prod')).toHaveTextContent('1');
    expect(screen.getByText('No high alerts to display')).toBeInTheDocument();
    expect(screen.queryByTestId('alert-card-low-7')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next high alerts' })).not.toBeInTheDocument();
  });

  it('aggregates monitor alert counts by environment across projects and shows zero values', async () => {
    mockFetchData({
      alerts: [makeAlert(1, 'high')],
      monitors: [
        {
          projectName: 'project-a',
          monitorInfo: [
            makeMonitorInfo('prod', 1, 2),
            makeMonitorInfo('int', 3, 0),
          ],
        },
        {
          projectName: 'project-b',
          monitorInfo: [
            makeMonitorInfo('prod', 2, 1),
            {
              env: 'sc',
              priority: 2,
              alertStrategy: 'medium',
              color: 'green',
              status: [{ name: 'OK', count: 9 }],
            },
          ],
        },
      ],
    });

    renderOverview();

    await screen.findByTestId('monitor-alert-count-prod');
    expect(screen.getByTestId('monitor-alert-count-prod')).toHaveTextContent('3');
    expect(screen.getByTestId('monitor-alert-count-sc')).toHaveTextContent('0');
    expect(screen.getByTestId('monitor-alert-count-int')).toHaveTextContent('0');
  });

  it('renders an empty slot when a severity page has only one alert', async () => {
    mockFetchData({ alerts: [makeAlert(1, 'high')] });

    renderOverview();

    await screen.findByTestId('alert-card-high-1');
    expect(screen.getByTestId('alert-card-high-1')).toBeVisible();
    expect(screen.getByTestId('empty-alert-slot-high')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next high alerts' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous high alerts' })).not.toBeInTheDocument();
  });

  it('renders an empty slot on the last page when high alert count is odd', async () => {
    mockFetchData({ alerts: [makeAlert(1, 'high'), makeAlert(2, 'high'), makeAlert(3, 'high')] });

    renderOverview();

    await screen.findByTestId('alert-card-high-1');
    expect(screen.getByTestId('alert-card-high-1')).toBeVisible();
    expect(screen.getByTestId('alert-card-high-3')).not.toBeVisible();
    expect(screen.queryByTestId('empty-alert-slot-high')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next high alerts' }));

    expect(screen.getByTestId('alert-card-high-1')).not.toBeVisible();
    expect(screen.getByTestId('alert-card-high-3')).toBeVisible();
    expect(screen.getByTestId('empty-alert-slot-high')).toBeInTheDocument();
  });
});
