import React, { useEffect, useState } from 'react';
import RefreshWrapper from './RefreshWrapper';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Box,
  Flex,
  HStack,
  Icon,
  IconButton,
  Stat,
  StatLabel,
  StatNumber,
  SystemProps,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { FcAddressBook, FcAssistant, FcCustomerSupport, FcHeadset } from 'react-icons/fc';
import { monitorConfig } from '../../config/datadog_monitor.config';
import { AlertCard } from './AlertCard';

interface DatadogAlert {
  name: string;
  id: number;
  triggeredTime: number;
  env: string;
  priority: number;
  alertStrategy: string;
}

interface DatadogStatusCount {
  name: string;
  count: number;
}

interface DatadogMonitorInfo {
  env: string;
  priority: number;
  alertStrategy: string;
  color: string;
  status?: DatadogStatusCount[];
}

interface DatadogMonitor {
  projectName: string;
  monitorInfo: DatadogMonitorInfo[];
}

interface DatadogAlertsOverviewPayload {
  alerts: DatadogAlert[];
  monitors: DatadogMonitor[];
}

interface EnvironmentAlertStat {
  env: string;
  priority: number;
  alertCount: number;
}

type AlertSeverity = 'high' | 'medium' | 'low';
type DisplayedAlertSeverity = 'high';

const DISPLAYED_ALERTS_PER_PAGE = 2;
const CAROUSEL_INTERVAL_MS = 10 * 1000;
const DISPLAYED_ALERT_SEVERITIES: DisplayedAlertSeverity[] = ['high'];
const ALERT_SLOT_WIDTH = 'calc(50% - 12px)';

const ENVIRONMENT_ICON_BY_ENV = {
  prod: FcAssistant,
  sc: FcCustomerSupport,
  int: FcAddressBook,
  ci: FcHeadset,
};

const getEnvironmentIcon = (env: string) => {
  return ENVIRONMENT_ICON_BY_ENV[env.toLowerCase() as keyof typeof ENVIRONMENT_ICON_BY_ENV] || FcAssistant;
};

const normalizeAlertSeverity = (alertStrategy?: string): AlertSeverity | undefined => {
  if (!alertStrategy) {
    return undefined;
  }

  const normalized = alertStrategy.toLowerCase();
  if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
    return normalized;
  }

  return undefined;
};

const groupAlertsBySeverity = (alerts: DatadogAlert[]) => {
  const groupedAlerts: Record<AlertSeverity, DatadogAlert[]> = {
    high: [],
    medium: [],
    low: [],
  };

  alerts.forEach((alert) => {
    const severity = normalizeAlertSeverity(alert.alertStrategy);
    if (!severity) {
      return;
    }
    groupedAlerts[severity].push(alert);
  });

  return groupedAlerts;
};

const getAlertCount = (statusCounts?: DatadogStatusCount[]) => {
  if (!statusCounts || statusCounts.length === 0) {
    return 0;
  }

  return statusCounts
    .filter((statusCount) => statusCount.name.toLowerCase() === 'alert')
    .reduce((total, statusCount) => total + Number(statusCount.count), 0);
};

const buildEnvironmentAlertStats = (monitors: DatadogMonitor[]) => {
  const mergedStatsByEnvironment = new Map<string, EnvironmentAlertStat>();

  monitors.forEach((project) => {
    project.monitorInfo.forEach((monitor) => {
      const envKey = monitor.env.toLowerCase();
      const alertCount = getAlertCount(monitor.status);
      const priority = Number(monitor.priority);
      const existingStat = mergedStatsByEnvironment.get(envKey);

      if (!existingStat) {
        mergedStatsByEnvironment.set(envKey, {
          env: monitor.env,
          priority,
          alertCount,
        });
        return;
      }

      mergedStatsByEnvironment.set(envKey, {
        env: existingStat.env,
        priority: Math.min(existingStat.priority, priority),
        alertCount: existingStat.alertCount + alertCount,
      });
    });
  });

  return [...mergedStatsByEnvironment.values()].sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }
    return left.env.localeCompare(right.env);
  });
};

interface SeverityAlertCarouselProps {
  severity: DisplayedAlertSeverity;
  alerts: DatadogAlert[];
}

const SeverityAlertCarousel = ({ severity, alerts }: SeverityAlertCarouselProps) => {
  const totalPages = Math.ceil(alerts.length / DISPLAYED_ALERTS_PER_PAGE);
  const hasMultiplePages = totalPages > 1;
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(0);
      return;
    }

    setCurrentPage((previousPage) => {
      if (previousPage < totalPages) {
        return previousPage;
      }
      return totalPages - 1;
    });
  }, [totalPages]);

  useEffect(() => {
    if (!hasMultiplePages) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCurrentPage((previousPage) => (previousPage + 1) % totalPages);
    }, CAROUSEL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [hasMultiplePages, totalPages]);

  const isAlertVisibleOnCurrentPage = (alertIndex: number) => {
    return Math.floor(alertIndex / DISPLAYED_ALERTS_PER_PAGE) === currentPage;
  };
  const pageStartIndex = currentPage * DISPLAYED_ALERTS_PER_PAGE;
  const pageEndIndex = pageStartIndex + DISPLAYED_ALERTS_PER_PAGE;
  const shouldRenderEmptySlot = alerts.length > pageStartIndex && alerts.length < pageEndIndex;

  const showPreviousPage = () => {
    if (!hasMultiplePages) {
      return;
    }
    setCurrentPage((previousPage) => (previousPage - 1 + totalPages) % totalPages);
  };

  const showNextPage = () => {
    if (!hasMultiplePages) {
      return;
    }
    setCurrentPage((previousPage) => (previousPage + 1) % totalPages);
  };

  return (
    <Flex alignItems="center" gap={2} w="100%">
      {hasMultiplePages && (
        <IconButton
          size="sm"
          aria-label={`Previous ${severity} alerts`}
          icon={<ChevronLeftIcon />}
          onClick={showPreviousPage}
        />
      )}
      <Flex flex="1" gap={6} flexDirection="row" alignItems="stretch" minH="120px">
        {alerts.map((alert, alertIndex) => (
          <Box
            key={`${severity}-${alert.id}-${alert.env}-${alertIndex}`}
            display={isAlertVisibleOnCurrentPage(alertIndex) ? 'block' : 'none'}
            flex={`0 0 ${ALERT_SLOT_WIDTH}`}
            maxW={ALERT_SLOT_WIDTH}
            sx={{ '& > *': { width: '100%' } }}
          >
            <AlertCard {...alert} alertStrategy={severity} />
          </Box>
        ))}
        {shouldRenderEmptySlot && (
          <Box
            aria-hidden="true"
            data-testid={`empty-alert-slot-${severity}`}
            flex={`0 0 ${ALERT_SLOT_WIDTH}`}
            maxW={ALERT_SLOT_WIDTH}
          />
        )}
      </Flex>
      {hasMultiplePages && (
        <IconButton
          size="sm"
          aria-label={`Next ${severity} alerts`}
          icon={<ChevronRightIcon />}
          onClick={showNextPage}
        />
      )}
    </Flex>
  );
};

const DatadogAlertsOverview = (props: SystemProps) => {
  const emptyStateColor = useColorModeValue('gray.500', 'gray.400');
  const statBorderColor = useColorModeValue('gray.200', 'gray.600');

  const fetchData = async (): Promise<DatadogAlertsOverviewPayload[]> => {
    try {
      const [monitorResponse, alertResponse] = await Promise.all([
        fetch(`/api/datadog`),
        fetch(`/api/datadog_alert`),
      ]);

      if (!monitorResponse.ok || !alertResponse.ok) {
        throw new Error('Failed to fetch Datadog monitor or alert data');
      }

      const [monitors, alerts] = await Promise.all([
        monitorResponse.json() as Promise<DatadogMonitor[]>,
        alertResponse.json() as Promise<DatadogAlert[]>,
      ]);

      return [{ alerts, monitors }];
    } catch (error) {
      throw error;
    }
  };

  return (
    <RefreshWrapper
      {...props}
      maxH="350px"
      minW="150px"
      title={'Datadog Alerts'}
      showRefreshButton={true}
      onRefresh={() => fetchData()}
      refreshIntervalSeconds={monitorConfig.refreshIntervalSeconds || 30}
      showRefreshButtonPosition="right"
      remainOldDataOnError={true}
      render={(data: DatadogAlertsOverviewPayload[]) => {
        const payload = data[0] || { alerts: [], monitors: [] };
        const groupedAlerts = groupAlertsBySeverity(payload.alerts);
        const environmentAlertStats = buildEnvironmentAlertStats(payload.monitors);
        const displayedSeverities = DISPLAYED_ALERT_SEVERITIES.filter(
          (severity) => groupedAlerts[severity].length > 0
        );

        return (
          <Flex
            flexDirection="column"
            justifyContent="flex-start"
            alignItems="stretch"
            gap={3}
            overflowY="auto"
            h="100%"
            w="100%"
            maxW="100%"
          >
            <Box w="100%">
              {environmentAlertStats.length > 0 ? (
                <Flex
                  w="100%"
                  flexWrap="wrap"
                  gap={2}
                  alignItems="stretch"
                  justifyContent="center"
                >
                  {environmentAlertStats.map((environmentAlertStat) => {
                    const EnvironmentIcon = getEnvironmentIcon(environmentAlertStat.env);

                    return (
                      <Stat
                        key={environmentAlertStat.env.toLowerCase()}
                        borderWidth="1px"
                        borderColor={statBorderColor}
                        borderRadius="md"
                        px={3}
                        py={2}
                        minW="108px"
                        flex="0 0 calc(12.5% - 8px)"
                      >
                        <HStack justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <StatLabel fontSize="xs" letterSpacing="0.04em" mb={0}>
                            {environmentAlertStat.env.toUpperCase()}
                          </StatLabel>
                          <Icon
                            as={EnvironmentIcon}
                            boxSize={3.5}
                            aria-label={`${environmentAlertStat.env} alert indicator`}
                          />
                        </HStack>
                        <StatNumber
                          fontSize="2xl"
                          lineHeight="1.2"
                          data-testid={`monitor-alert-count-${environmentAlertStat.env.toLowerCase()}`}
                        >
                          {environmentAlertStat.alertCount}
                        </StatNumber>
                      </Stat>
                    );
                  })}
                </Flex>
              ) : (
                <Text fontSize="sm" color={emptyStateColor}>
                  No monitor environments to display
                </Text>
              )}
            </Box>

            <Box w="100%" minH="120px">
              {displayedSeverities.length === 0 ? (
                <Flex
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  h="100%"
                  w="100%"
                  minH="120px"
                >
                  <Text fontSize="sm" color={emptyStateColor}>
                    No high alerts to display
                  </Text>
                </Flex>
              ) : (
                <Flex
                  flexDirection="column"
                  justifyContent="flex-start"
                  alignItems="stretch"
                  gap={2}
                  w="100%"
                >
                  {displayedSeverities.map((severity) => (
                    <SeverityAlertCarousel
                      key={severity}
                      severity={severity}
                      alerts={groupedAlerts[severity]}
                    />
                  ))}
                </Flex>
              )}
            </Box>
          </Flex>
        );
      }}
    ></RefreshWrapper>
  );
};

export default DatadogAlertsOverview;
