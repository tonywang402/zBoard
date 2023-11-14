import React from 'react';
import { Box, Card, CardBody, Heading, Text } from '@chakra-ui/react';
import { Stat, StatLabel, StatNumber, StatGroup } from '@chakra-ui/react';
import { MonitorInfo } from './DatadogMonitorOverview';

interface MonitorProps {
  projectName: string;
  monitorInfo: Array<MonitorInfo>;
}

const DatadogMonitorCard = ({ projectName, monitorInfo }: MonitorProps) => {
  return (
    <>
      <Heading size="md" lineHeight="32px">
        {projectName}
      </Heading>
      {monitorInfo.map((monitor, index) => {
        return (
          <Card
            key={index}
            direction="row"
            w="100%"
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            variant="outline"
          >
            <Box w="15px" bg={monitor.color}></Box>
            <CardBody display="flex" flexDirection="column" p="16px" pl="12px">
              <Heading size="lg" fontWeight="light">
                <Text whiteSpace="nowrap">{monitor.env.toUpperCase()}</Text>
                <StatGroup>
                  {monitor.status.map((status) => {
                    return (
                      <Stat>
                        <StatLabel>{status.name}</StatLabel>
                        <StatNumber>{status.count.toString()}</StatNumber>
                      </Stat>
                    );
                  })}
                </StatGroup>
              </Heading>
            </CardBody>
          </Card>
        );
      })}
    </>
  );
};

export default DatadogMonitorCard;
