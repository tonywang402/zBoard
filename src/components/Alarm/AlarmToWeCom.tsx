const data = {
  msgtype: 'text',
  text: {
    content: `Prod Alert`,
    mentioned_mobile_list: ['@all'],
  },
};

const url =
  'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=c275c9c6-175e-45f6-955d-eadcd20d9bbf';

import { useEffect } from 'react';
import { useToast as useChakraToast } from '@chakra-ui/toast';

const PostAlertToWecom = () => {
  const toast = useChakraToast();

  useEffect(() => {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      mode: 'no-cors',
    })
      .then((response) => {
        toast({
          title: 'New version available',
          description: <>test</>,
          status: 'info',
          duration: 10000,
          isClosable: true,
          position: 'top-right',
        });
      })
      .catch((error) => {
        () => console.warn(error);
      });
  }, []);
  return <></>;
};

export default PostAlertToWecom;
