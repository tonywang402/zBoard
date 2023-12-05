import React from 'react';
import { useToast as useChakraToast } from '@chakra-ui/toast';
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

const AlertCard = (alertInfo: AlertInfo) => {
  const triggerTime = moment.unix(alertInfo.triggeredTime).format('YYYY-MM-DD HH:mm:ss');

  return (
    <Alert status="error">
      <AlertIcon />
      <Box>
        <AlertTitle>{alertInfo.name}</AlertTitle>
        <AlertDescription>Created at: {triggerTime}</AlertDescription>
      </Box>
    </Alert>
  );
};

export const AltertToast = (alertInfos: AlertInfo) => {
  const toast = useChakraToast();

  toast({
    position: 'top',
    duration: null,
    isClosable: true,
    render: () => <AlertCard {...alertInfos} />,
  });
  return null;
};
