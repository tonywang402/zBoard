import { VStack, HStack } from '@chakra-ui/react';
import BuildStatusOverview from '@/components/BuildStatusOverview';
import CollapseNavbar from '@/components/CollapseNavbar';
import UpdateChecker from '@/components/UpdateChecker';
import AlarmToggleProvider from './AlarmToggleContext';
import DatadogMonitorOverview from '@/components/DatadogMonitorOverview';
import DatadogAlertsOverview from '@/components/DatadogAlertsOverview';

export default function Home() {
  return (
    <AlarmToggleProvider>
      <VStack w="100vw" h="100vh" p="8px" pt="0">
        <UpdateChecker />
        <CollapseNavbar />
        <VStack px="8px" flex="1" width="100vw" overflow="hidden">
          <HStack w="100%" h="100%">
            <DatadogMonitorOverview width="240px" />
            <VStack flex="1" h="100%" overflow="hidden">
              <DatadogAlertsOverview />
              <HStack h="950px" w="100%">
                <BuildStatusOverview flex="75%" h="100%" />
                {/* <TicketStatusOverview flex="25%" h="100%" /> */}
              </HStack>
            </VStack>
          </HStack>
        </VStack>
      </VStack>
    </AlarmToggleProvider>
  );
}
