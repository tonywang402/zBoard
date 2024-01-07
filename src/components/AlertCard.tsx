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

type AlertStrategy = {
  status: 'error' | 'warning' | 'info';
  needAlarm: boolean;
  alarmSrc: string;
};

const getAlertStrategy = (alertStrategy: string): AlertStrategy => {
  switch (alertStrategy) {
    case 'high':
      return { status: 'error', needAlarm: true, alarmSrc: '/audio/prodWarning.mp3' };
    case 'medium':
      return { status: 'warning', needAlarm: true, alarmSrc: '/audio/christmas.mp3' };
    default:
      return { status: 'info', needAlarm: false, alarmSrc: '/audio/christmas.mp3' };
  }
};

const formatTriggerTime = (triggeredTime: number): string => {
  return moment.unix(triggeredTime).format('YYYY-MM-DD HH:mm:ss');
};

const formatAlertName = (alertName: string): string => {
  return alertName.substring(14);
};

export const AlertCard = (alertInfo: AlertInfo) => {
  const { status, needAlarm, alarmSrc } = getAlertStrategy(alertInfo.alertStrategy);
  const triggerTime = formatTriggerTime(alertInfo.triggeredTime);
  const alertName = formatAlertName(alertInfo.name);

  return (
    <Alert status={status}>
      <AlertIcon />
      <Box>
        <AlertTitle fontSize="25px" marginBottom="10px">
          {alertName}
        </AlertTitle>
        <Flex justifyContent="space-between" alignItems="center">
          <AlertDescription fontSize="20px">Created at: {triggerTime}</AlertDescription>
          <AcknowledgeBox intervalMin={30} alarmSrc={[alarmSrc]} needAlarm={needAlarm} />
        </Flex>
      </Box>
    </Alert>
  );
};
