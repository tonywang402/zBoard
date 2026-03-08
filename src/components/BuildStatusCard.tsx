import React from 'react';
import moment from 'moment';
import {
  Avatar,
  Badge,
  Box,
  Card,
  Divider,
  Flex,
  Heading,
  HStack,
  List,
  ListItem,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
  VStack,
  CardHeader,
  CardBody,
} from '@chakra-ui/react';
import { TimeIcon } from '@chakra-ui/icons';
interface BuildStatusCardProps {
  buildStatus: BuildStatus;
}

export interface BuildStatus {
  // TODO render style & color by platform: CircleCI or Github
  projectName: string;
  branch: string;
  status: string;
  level?: 'high' | 'medium' | 'low';
  stopTime: string;
  username: string;
  avatarUrl: string;
  commitSubject: string;
  failedJobInfo?: { jobName: string; failedSteps: string[] }[];
}

interface StatusColorScheme {
  [key: string]: string;
  success: string;
  failed: string;
  on_hold: string;
  running: string;
  canceled: string;
  unauthorized: string;
}

export const statusColorScheme: StatusColorScheme = {
  success: 'green',
  failed: 'red',
  on_hold: 'purple',
  running: 'blue',
  canceled: 'gray',
  unauthorized: 'orange',
  completed: 'green',
  action_required: 'purple',
  cancelled: 'gray',
  failure: 'red',
  neutral: 'pink',
  skipped: 'gray',
  stale: 'gray',
  timed_out: 'red',
  in_progress: 'blue',
  queued: 'gray',
  requested: 'gray',
  waiting: 'yellow',
  pending: 'gray',
  startup_failure: 'red',
};

const BuildStatusCard = ({ buildStatus }: BuildStatusCardProps) => {
  const colorScheme = statusColorScheme[buildStatus.status] || 'red';
  const startTime = moment(buildStatus.stopTime).format('YYYY-MM-DD HH:mm:ss');
  const showPopover = colorScheme === 'red' && !!buildStatus.failedJobInfo?.length;

  const card = (
    <Card
      color="white"
      bgColor={`${colorScheme}.500`}
      p="8px"
      borderWidth="1px"
      borderRadius="lg"
      maxH="400px"
    >
      <CardHeader>
        <Flex>
          <Heading size="xl">{buildStatus.projectName}</Heading>
        </Flex>
      </CardHeader>
      <CardBody>
        <HStack>
          <Badge variant="subtle" colorScheme={colorScheme}>
            {buildStatus.status}
          </Badge>
          <Flex align="center">
            <TimeIcon w="12px" h="12px" />
            <Text ml="10px">{startTime}</Text>
          </Flex>
        </HStack>
        <Divider mt="2px" mb="2px" />
        <Flex align="center">
          <Avatar w="32px" h="32px" name={buildStatus.username} src={buildStatus.avatarUrl} />
          <VStack align="stretch">
            <Box ml="4px">
              <Text fontSize="md">
                {buildStatus.username} on <b>{buildStatus.branch}</b>
              </Text>
              <Text fontSize="md" noOfLines={1}>
                {buildStatus.commitSubject}
              </Text>
            </Box>
          </VStack>
        </Flex>
      </CardBody>
    </Card>
  );

  if (!showPopover) return card;

  return (
    <Popover trigger="hover" placement="top">
      <PopoverTrigger>{card}</PopoverTrigger>
      <PopoverContent color="gray.800" bg="white">
        <PopoverArrow />
        <PopoverHeader fontWeight="bold" fontSize="sm">Failed Jobs</PopoverHeader>
        <PopoverBody>
          {buildStatus.failedJobInfo!.map((job) => (
            <Box key={job.jobName} mb="6px">
              <Text fontWeight="bold" fontSize="sm">{job.jobName}</Text>
              <List spacing={1} pl="8px">
                {job.failedSteps.map((step) => (
                  <ListItem key={step} fontSize="xs">{step}</ListItem>
                ))}
              </List>
            </Box>
          ))}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default BuildStatusCard;
