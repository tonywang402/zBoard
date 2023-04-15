import { siteConfig } from '@/../config/site.config';
import { Center, Heading, VStack, HStack, Box } from '@chakra-ui/react';
import BuildStatusOverview from '@/components/BuildStatusOverview';
import TicketStatusOverview from '@/components/TicketStatusOverview';

export default function Home() {
  return (
    <Box w="100vw" h="100vh" p="8px">
      <VStack>
        <Heading
          bgGradient="linear(to-l, #7928CA, #FF0080)"
          bgClip="text"
          fontSize="3xl"
          fontWeight="extrabold"
        >
          {siteConfig.siteName}
        </Heading>
        <HStack>
          <BuildStatusOverview></BuildStatusOverview>
          <TicketStatusOverview></TicketStatusOverview>
        </HStack>
      </VStack>
    </Box>
  );
}
