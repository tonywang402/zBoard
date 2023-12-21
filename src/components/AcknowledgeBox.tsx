import React, { useState } from 'react';
import { Button, Tag, TagLabel, TagRightIcon } from '@chakra-ui/react';
import { LinkIcon } from '@chakra-ui/icons';
import { MdBuild } from 'react-icons/md';
import AlarmContainer, { AlarmContainerProps } from './Alarm/AlarmContainer';
import { useAlarmToggle } from '../pages/AlarmToggleContext';

const AcknowledgeBox: React.FC<AlarmContainerProps> = ({ intervalMin, alarmSrc }) => {
  const [isACKED, setIsACKED] = useState(false);
  const { alarmToggle } = useAlarmToggle();
  console.log('alarmToggle', alarmToggle);

  if (isACKED) {
    return (
      <Tag size={'lg'} key={'lg'} variant="solid" colorScheme="green">
        <TagLabel>ACKED</TagLabel>
        <TagRightIcon as={MdBuild} />
      </Tag>
    );
  }

  return (
    <>
      <Button
        leftIcon={<LinkIcon />}
        colorScheme="teal"
        variant="solid"
        onClick={() => {
          setIsACKED(true);
        }}
      >
        Need ACK
      </Button>
      {alarmToggle && <AlarmContainer intervalMin={intervalMin} alarmSrc={alarmSrc} />}
    </>
  );
};

export default AcknowledgeBox;
