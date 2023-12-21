import React from 'react';
import { AlertIcon, AlertTitle, AlertDescription, Box, Alert, Flex } from '@chakra-ui/react';
import moment from 'moment';
import AcknowledgeBox from './AcknowledgeBox';

export interface AlertInfo {
  env: string;
  priority: Number;
  alertStrategy: string;
  name: string;
  id: number;
  triggeredTime: number;
}

export const AlertCard = (alertInfo: AlertInfo) => {
  const triggerTime = moment.unix(alertInfo.triggeredTime).format('YYYY-MM-DD HH:mm:ss');

  return (
    <Alert status="error">
      <AlertIcon />
      <Box>
        <AlertTitle fontSize="25px" marginBottom="10px">
          {alertInfo.name.substring(14)}
        </AlertTitle>
        <Flex justifyContent="space-between" alignItems="center">
          <AlertDescription fontSize="20px">Created at: {triggerTime}</AlertDescription>
          <AcknowledgeBox intervalMin={30} alarmSrc={['/audio/christmas.mp3']} />
        </Flex>
      </Box>
    </Alert>
  );
};
