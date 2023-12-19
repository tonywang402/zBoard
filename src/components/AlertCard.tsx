import React from 'react';
import { AlertIcon, AlertTitle, AlertDescription, Box, Alert } from '@chakra-ui/react';
import moment from 'moment';

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
        <AlertTitle fontSize="25px">{alertInfo.name.substring(14)}</AlertTitle>
        <AlertDescription fontSize="20px">Created at: {triggerTime}</AlertDescription>
      </Box>
    </Alert>
  );
};
