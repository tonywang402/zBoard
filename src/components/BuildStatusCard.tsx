import React, { useState } from 'react';
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
  IconButton,
} from '@chakra-ui/react';
import { RepeatIcon, TimeIcon } from '@chakra-ui/icons';
import { useErrorToast, useInfoToast } from '@/lib/customToast';

interface BuildStatusCardProps {
  buildStatus: BuildStatus;
  onRerunSuccess?: () => Promise<void> | void;
}

export interface BuildStatus {
  // TODO render style & color by platform: CircleCI or Github
  platform?: string;
  projectName: string;
  branch: string;
  status: string;
  level?: 'high' | 'medium' | 'low';
  stopTime: string;
  username?: string;
  avatarUrl?: string;
  commitSubject?: string;
  owner?: string;
  repo?: string;
  runId?: number;
  failedJobInfo?: { jobName: string; failedSteps: string[] }[];
}

type RerunMode = 'failed_jobs' | 'workflow';

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

const getErrorMessageFromResponse = async (response: Response) => {
  const raw = await response.text();
  if (!raw) {
    return 'Failed to rerun jobs';
  }

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') {
      return parsed;
    }
    if (parsed?.message) {
      return parsed.message;
    }
  } catch {
    // Keep the original message when response is plain text.
  }

  return raw;
};

const BuildStatusCard = ({ buildStatus, onRerunSuccess }: BuildStatusCardProps) => {
  const [isRerunning, setIsRerunning] = useState(false);
  const toastError = useErrorToast();
  const toastInfo = useInfoToast();

  const colorScheme = statusColorScheme[buildStatus.status] || 'red';
  const startTime = moment(buildStatus.stopTime).format('YYYY-MM-DD HH:mm:ss');
  const showPopover = colorScheme === 'red';
  const rerunMode: RerunMode =
    buildStatus.status === 'startup_failure' ? 'workflow' : 'failed_jobs';
  const canRerunFailedJobs =
    showPopover &&
    buildStatus.platform === 'Github' &&
    !!buildStatus.owner &&
    !!buildStatus.repo &&
    buildStatus.runId !== undefined;

  const handleRerunFailedJobs = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!canRerunFailedJobs || isRerunning) {
      return;
    }

    setIsRerunning(true);
    try {
      const response = await fetch('/api/github_rerun_failed_jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: buildStatus.owner,
          repo: buildStatus.repo,
          runId: buildStatus.runId,
          rerunMode,
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessageFromResponse(response));
      }

      toastInfo('Rerun triggered', `Rerun request submitted for ${buildStatus.projectName}`);
      if (onRerunSuccess) {
        await onRerunSuccess();
      }
    } catch (error) {
      toastError((error as Error).message || 'Failed to rerun jobs');
    } finally {
      setIsRerunning(false);
    }
  };

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
        <PopoverHeader>
          <Flex align="center" justify="space-between" gap="8px">
            <Text fontWeight="bold" fontSize="sm">
              Failed Jobs
            </Text>
            {canRerunFailedJobs && (
              <IconButton
                aria-label="Rerun failed jobs"
                icon={<RepeatIcon />}
                size="xs"
                variant="ghost"
                colorScheme="blue"
                isLoading={isRerunning}
                isDisabled={isRerunning}
                onClick={handleRerunFailedJobs}
              />
            )}
          </Flex>
        </PopoverHeader>
        <PopoverBody>
          {(buildStatus.failedJobInfo ?? []).map((job) => (
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
