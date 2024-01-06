import React from 'react';
import { useErrorToast } from '@/lib/customToast';
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
  const toastError = useErrorToast();

  const fetchData = async () => {
    const monitor = await fetch(`/api/datadog_alert`);
    if (monitor.ok) {
      return await monitor.json();
    } else {
      toastError(await monitor.text());
      return [];
    }
  };

  return (
    <RefreshWrapper
      {...props}
      maxH="450px"
      minW="150px"
      title={'Datadog Alerts'}
      showRefreshButton={true}
      onRefresh={() => fetchData()}
      refreshIntervalSeconds={monitorConfig.refreshIntervalSeconds || 30}
      showRefreshButtonPosition="right"
      render={(data: Array<DatadogAlert>) => {
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
              {data
                .filter((DatadogAlert) => DatadogAlert.alertStrategy !== 'low')
                .map((DatadogAlert) => (
                  <AlertCard key={DatadogAlert.id} {...DatadogAlert} />
                ))}
            </Flex>
            <Flex flex-direction="row" gap={10}>
              {data
                .filter((DatadogAlert) => DatadogAlert.alertStrategy == 'low')
                .map((DatadogAlert) => (
                  <AlertCard key={DatadogAlert.id} {...DatadogAlert} />
                ))}
            </Flex>
          </Flex>
        );
      }}
    ></RefreshWrapper>
  );
};

export default DatadogAlertsOverview;
