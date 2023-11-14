import React from 'react';
import { useErrorToast } from '@/lib/customToast';
import RefreshWrapper from './RefreshWrapper';
import { Flex, SystemProps } from '@chakra-ui/react';
import { monitorConfig } from '../../config/datadog_monitor.config';
import DatadogMonitorCard from './DatadogMonitorCard';

interface StatusCount {
  name: string;
  count: Number;
}

export interface MonitorInfo {
  env: string;
  priority: Number;
  alertStrategy: string;
  color: string;
  status: Array<StatusCount>;
}

interface DatadogMonitor {
  projectName: string;
  monitorInfo: Array<MonitorInfo>;
}

const DatadogMonitorOverview = (props: SystemProps) => {
  const toastError = useErrorToast();

  const fetchData = async () => {
    const res = await fetch(`/api/datadog`);
    if (res.ok) {
      return await res.json();
    } else {
      toastError(await res.text());
      return [];
    }
  };

  return (
    <RefreshWrapper
      {...props}
      h="100%"
      minW="230px"
      title={monitorConfig.title || 'Datadog Monitor'}
      showRefreshButton={true}
      onRefresh={() => fetchData()}
      refreshIntervalSeconds={monitorConfig.refreshIntervalSeconds || 30}
      showRefreshButtonPosition="buttom"
      render={(data: DatadogMonitor[]) => (
        <Flex
          flexWrap="wrap"
          justifyContent="space-between"
          alignItems="center"
          gap={1}
          overflowY="scroll"
          h="100%"
          w="100%"
          maxW="320px"
        >
          <>
            {data.map((datadogMonitor) => (
              <DatadogMonitorCard
                key={datadogMonitor.projectName}
                projectName={datadogMonitor.projectName}
                monitorInfo={datadogMonitor.monitorInfo}
              />
            ))}
          </>
        </Flex>
      )}
    ></RefreshWrapper>
  );
};

export default DatadogMonitorOverview;
