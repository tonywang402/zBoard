import React, { useEffect, useState } from 'react';
import RefreshWrapper from './RefreshWrapper';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Box, Flex, IconButton, SystemProps, Text, useColorModeValue } from '@chakra-ui/react';
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

type AlertSeverity = 'high' | 'medium' | 'low';

const DISPLAYED_ALERTS_PER_PAGE = 2;
const CAROUSEL_INTERVAL_MS = 10 * 1000;
const ALERT_SEVERITIES: AlertSeverity[] = ['high', 'medium', 'low'];

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

interface SeverityAlertCarouselProps {
  severity: AlertSeverity;
  alerts: DatadogAlert[];
}

const SeverityAlertCarousel = ({ severity, alerts }: SeverityAlertCarouselProps) => {
  const labelColor = useColorModeValue('gray.700', 'gray.300');
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
      <Text fontSize="sm" fontWeight="bold" minW="56px" textTransform="uppercase" color={labelColor}>
        {severity}
      </Text>
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
            flex="1"
            minW={0}
          >
            <AlertCard {...alert} alertStrategy={severity} />
          </Box>
        ))}
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
  const fetchData = async () => {
    const monitor = await fetch(`/api/datadog_alert`);
    if (monitor.ok) {
      return await monitor.json();
    } else {
      return undefined;
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
      render={(data: Array<DatadogAlert>) => {
        const groupedAlerts = groupAlertsBySeverity(data);

        return (
          <Flex
            flexDirection="column"
            flexWrap="wrap"
            justifyContent="flex-start"
            alignItems="flex-start"
            gap={2}
            overflowY="auto"
            h="100%"
            w="100%"
            maxW="100%"
          >
            {ALERT_SEVERITIES.map((severity) => (
              <SeverityAlertCarousel
                key={severity}
                severity={severity}
                alerts={groupedAlerts[severity]}
              />
            ))}
          </Flex>
        );
      }}
    ></RefreshWrapper>
  );
};

export default DatadogAlertsOverview;
