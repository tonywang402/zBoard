import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import DatadogAlertsOverview from '../DatadogAlertsOverview';

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
  AlertCard: ({ alertStrategy, id }: { alertStrategy: string; id: number }) => (
    <div data-testid={`alert-card-${alertStrategy}-${id}`}>{`alert-${alertStrategy}-${id}`}</div>
  ),
}));

interface TestAlert {
  name: string;
  id: number;
  triggeredTime: number;
  env: string;
  priority: number;
  alertStrategy: string;
}

const makeAlert = (id: number, alertStrategy: string): TestAlert => ({
  name: `Monitor alert ${id}`,
  id,
  triggeredTime: 1700000000 + id,
  env: 'prod',
  priority: 1,
  alertStrategy,
});

const renderOverview = () =>
  render(
    <ChakraProvider>
      <DatadogAlertsOverview />
    </ChakraProvider>
  );

const mockFetchData = (items: TestAlert[]) => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => [...items],
  });
};

describe('DatadogAlertsOverview carousel', () => {
  afterEach(() => {
    jest.useRealTimers();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders only two alerts per severity group on each page', async () => {
    mockFetchData([
      makeAlert(1, 'high'),
      makeAlert(2, 'high'),
      makeAlert(3, 'high'),
      makeAlert(4, 'medium'),
      makeAlert(5, 'medium'),
      makeAlert(6, 'medium'),
      makeAlert(7, 'low'),
    ]);

    renderOverview();

    await screen.findByTestId('alert-card-high-1');
    expect(screen.getByTestId('alert-card-high-2')).toBeInTheDocument();
    expect(screen.queryByTestId('alert-card-high-3')).not.toBeInTheDocument();

    expect(screen.getByTestId('alert-card-medium-4')).toBeInTheDocument();
    expect(screen.getByTestId('alert-card-medium-5')).toBeInTheDocument();
    expect(screen.queryByTestId('alert-card-medium-6')).not.toBeInTheDocument();

    expect(screen.getByTestId('alert-card-low-7')).toBeInTheDocument();
  });

  it('auto-rotates each group every 10 seconds with independent page cycles', async () => {
    jest.useFakeTimers();

    mockFetchData([
      makeAlert(1, 'high'),
      makeAlert(2, 'high'),
      makeAlert(3, 'high'),
      makeAlert(4, 'medium'),
      makeAlert(5, 'medium'),
      makeAlert(6, 'medium'),
      makeAlert(7, 'medium'),
      makeAlert(8, 'medium'),
      makeAlert(9, 'low'),
      makeAlert(10, 'low'),
    ]);

    renderOverview();

    await screen.findByTestId('alert-card-high-1');
    expect(screen.getByTestId('alert-card-medium-4')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.getByTestId('alert-card-high-3')).toBeInTheDocument();
    expect(screen.getByTestId('alert-card-medium-6')).toBeInTheDocument();
    expect(screen.getByTestId('alert-card-medium-7')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.getByTestId('alert-card-high-1')).toBeInTheDocument();
    expect(screen.getByTestId('alert-card-medium-8')).toBeInTheDocument();
    expect(screen.getByTestId('alert-card-low-9')).toBeInTheDocument();
    expect(screen.getByTestId('alert-card-low-10')).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('manual next button updates only the targeted severity group', async () => {
    mockFetchData([
      makeAlert(1, 'high'),
      makeAlert(2, 'high'),
      makeAlert(3, 'high'),
      makeAlert(4, 'medium'),
      makeAlert(5, 'medium'),
      makeAlert(6, 'medium'),
      makeAlert(7, 'low'),
    ]);

    renderOverview();

    await screen.findByTestId('alert-card-high-1');
    const nextHighButton = screen.getByRole('button', { name: 'Next high alerts' });
    fireEvent.click(nextHighButton);

    expect(screen.getByTestId('alert-card-high-3')).toBeInTheDocument();
    expect(screen.getByTestId('alert-card-medium-4')).toBeInTheDocument();
    expect(screen.getByTestId('alert-card-medium-5')).toBeInTheDocument();
    expect(screen.queryByTestId('alert-card-medium-6')).not.toBeInTheDocument();
  });

  it('hides navigation buttons for groups with one page', async () => {
    mockFetchData([
      makeAlert(1, 'high'),
      makeAlert(2, 'high'),
      makeAlert(4, 'medium'),
      makeAlert(5, 'medium'),
      makeAlert(7, 'low'),
    ]);

    renderOverview();

    await screen.findByTestId('alert-card-high-1');
    expect(screen.queryByRole('button', { name: 'Next high alerts' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous high alerts' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next medium alerts' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next low alerts' })).not.toBeInTheDocument();
  });
});
