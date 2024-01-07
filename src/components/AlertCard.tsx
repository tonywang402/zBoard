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

const getAlertStatus = (alertStrategy: string) => {
  switch (alertStrategy) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    default:
      return 'info';
  }
};

export const AlertCard = (alertInfo: AlertInfo) => {
  const triggerTime = moment.unix(alertInfo.triggeredTime).format('YYYY-MM-DD HH:mm:ss');
  const needAlarm = alertInfo.alertStrategy !== 'low';

  const alarmSrc =
    alertInfo.alertStrategy === 'high' ? ['/audio/prodWarning.mp3'] : ['/audio/christmas.mp3'];

  return (
    <Alert status={getAlertStatus(alertInfo.alertStrategy)}>
      <AlertIcon />
      <Box>
        <AlertTitle fontSize="25px" marginBottom="10px">
          {alertInfo.name.substring(14)}
        </AlertTitle>
        <Flex justifyContent="space-between" alignItems="center">
          <AlertDescription fontSize="20px">Created at: {triggerTime}</AlertDescription>
          <AcknowledgeBox intervalMin={30} alarmSrc={alarmSrc} needAlarm={needAlarm} />
        </Flex>
      </Box>
    </Alert>
  );
};
