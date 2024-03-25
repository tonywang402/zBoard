import React, { useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  Button,
  Collapse,
  IconButton,
  Heading,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { siteConfig } from '@/../../config/site.config';
import ThemeToggle from '@/components/ThemeToggle';
import { ChatIcon, ChevronDownIcon, LockIcon, MinusIcon } from '@chakra-ui/icons';
import Link from 'next/link';
import AlarmToggle from './Alarm/AlarmToggle';
import WeComAlertToggle from './WeComAlert/WeComAlertToggle';

function InfoToast() {
  const toast = useToast();
  return (
    <IconButton
      onClick={() =>
        toast({
          icon: <LockIcon />,
          position: 'top',
          isClosable: true,
          duration: null,
          title: 'PIT Week #3 Announcement',
          description:
            'Freeze our deployments on the SC environment from March 18th to March 28th.',
        })
      }
      aria-label={''}
      icon={<ChatIcon />}
    >
      Info
    </IconButton>
  );
}

const CollapseNavbar = () => {
  const [isOpen, setIsOpen] = useState(true);

  const borderColor = useColorModeValue('gray.300', 'gray.400');

  return (
    <Box
      bgGradient={isOpen ? '' : 'linear(to-l, #7928CA, #FF0080)'}
      w="100vw"
      h={isOpen ? '64px' : '8px'}
      transition="height 0.3s ease-out"
      onClick={() => !isOpen && setIsOpen(true)}
      cursor={isOpen ? 'default' : 'pointer'}
      borderBottom={isOpen ? '1px solid' : ''}
      borderColor={borderColor}
    >
      <Collapse in={isOpen} animateOpacity>
        <Flex justify="space-between" align="center" p="3">
          <Flex justify="space-between" align="center" w="50vw">
            <Link href="/">
              <Heading
                bgGradient="linear(to-l, #7928CA, #FF0080)"
                bgClip="text"
                fontSize="3xl"
                fontWeight="extrabold"
              >
                {siteConfig.siteName}
              </Heading>
            </Link>
            <WeComAlertToggle />
            <AlarmToggle />
          </Flex>
          <HStack>
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />} width="150px">
                Pages
              </MenuButton>
              <MenuList>
                <Link href="/">
                  <MenuItem>Dashboard</MenuItem>
                </Link>
                <Link href="/example/build-status-overview">
                  <MenuItem>Build Status</MenuItem>
                </Link>
                <Link href="/example/ticket-status-overview">
                  <MenuItem>Ticket Status</MenuItem>
                </Link>
                <Link href="/example/project-timeline">
                  <MenuItem>Project Timeline</MenuItem>
                </Link>
                <Link href="/example/owner-rotation-overview">
                  <MenuItem>Owner Rotation</MenuItem>
                </Link>
              </MenuList>
            </Menu>
            <InfoToast />
            <ThemeToggle />
            <IconButton
              aria-label="Hide Navbar"
              icon={<MinusIcon />}
              onClick={() => setIsOpen(false)}
            />
          </HStack>
        </Flex>
      </Collapse>
    </Box>
  );
};

export default CollapseNavbar;
