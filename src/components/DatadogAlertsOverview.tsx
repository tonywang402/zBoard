import React from 'react';
import RefreshWrapper from './RefreshWrapper';
import { Flex, SystemProps } from '@chakra-ui/react';
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
        const highAlerts = data.filter(
          (DatadogAlert) => DatadogAlert.alertStrategy.toLowerCase() === 'high'
        );
        const mediumAlerts = data.filter(
          (DatadogAlert) => DatadogAlert.alertStrategy.toLowerCase() === 'medium'
        );
        const lowAlerts = data.filter(
          (DatadogAlert) => DatadogAlert.alertStrategy.toLowerCase() === 'low'
        );

        return (
          <Flex
            flexDirection="column"
            flexWrap="wrap"
            justifyContent="space-between"
            alignItems="flex-start"
            gap={1}
            overflowY="scroll"
            h="100%"
            w="100%"
            maxW="100%"
          >
            <Flex flex-direction="row" gap={10}>
              {highAlerts.map((alert) => (
                <AlertCard key={alert.id} {...alert} alertStrategy="high" />
              ))}
            </Flex>
            <Flex flex-direction="row" gap={10}>
              {mediumAlerts.map((alert) => (
                <AlertCard key={alert.id} {...alert} alertStrategy="medium" />
              ))}
            </Flex>
            <Flex flex-direction="row" gap={10}>
              {lowAlerts.map((alert) => (
                <AlertCard key={alert.id} {...alert} alertStrategy="low" />
              ))}
            </Flex>
          </Flex>
        );
      }}
    ></RefreshWrapper>
  );
};

export default DatadogAlertsOverview;
