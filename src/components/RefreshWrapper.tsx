import { useEffect, useState } from 'react';
import {
  Box,
  Center,
  Heading,
  IconButton,
  Text,
  VStack,
  Skeleton,
  useColorModeValue,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import moment from 'moment';
import { isEmpty } from 'lodash';
import DefaultImage from './DefaultImage';

interface RefreshWrapperProps<T> {
  title: string;
  onRefresh: () => Promise<T[]>;
  refreshIntervalSeconds?: number;
  render: (data: T[]) => JSX.Element;
  showRefreshButton?: boolean;
  remainOldDataOnError?: boolean;
  showRefreshButtonPosition?: 'buttom' | 'right';
  [key: string]: any;
}

const RefreshWrapper = <T,>({
  title,
  onRefresh,
  refreshIntervalSeconds = 0,
  render,
  showRefreshButton = true,
  remainOldDataOnError = false,
  showRefreshButtonPosition = 'right',
  ...props
}: RefreshWrapperProps<T>) => {
  const flexDirection = showRefreshButtonPosition === 'buttom' ? 'column' : 'row';
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<T[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();

  const borderColor = useColorModeValue('gray.300', 'gray.400');
  const fontColor = useColorModeValue('gray.600', 'gray.300');

  const triggerRefresh = async () => {
    setIsRefreshing(true);
    try {
      const newData = await onRefresh();
      if (!remainOldDataOnError || newData !== undefined) {
        setData(newData);
      }
      setLastUpdatedAt(moment().format('HH:mm:ss'));
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    triggerRefresh();
    if (refreshIntervalSeconds > 0) {
      const interval = setInterval(() => {
        triggerRefresh();
      }, refreshIntervalSeconds * 1000);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <>
      <VStack
        padding="12px"
        border="1px"
        borderColor={borderColor}
        borderRadius="16px"
        spacing="8px"
        w="100%"
        {...props}
      >
        <Center w="100%" justifyContent="space-between" flexDirection={flexDirection}>
          <Heading size="md" color={fontColor} lineHeight="32px">
            {title}
          </Heading>
          <Box hidden={!showRefreshButton}>
            <Text fontSize="sm" color={fontColor} display="inline-block" mr="4px">
              Updated at {lastUpdatedAt}
            </Text>
            <IconButton
              size="sm"
              isDisabled={isRefreshing}
              cursor={isRefreshing ? 'wait !important' : 'pointer'}
              onClick={() => triggerRefresh()}
              aria-label="Refresh"
              icon={<RepeatIcon animation={isRefreshing ? 'rotate 2s infinite linear;' : 'none'} />}
            />
          </Box>
        </Center>
        {data.length > 0 ? render(data) : <DefaultImage />}
      </VStack>
    </>
  );
};

export default RefreshWrapper;
