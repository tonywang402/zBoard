const url =
  'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=c275c9c6-175e-45f6-955d-eadcd20d9bbf';

import { useEffect, useState } from 'react';
import { useToast as useChakraToast } from '@chakra-ui/toast';
import { useAlarmToggle } from '@/pages/AlarmToggleContext';

interface PostAlertToWecomProps {
  alertName: string;
}

const PostAlertToWecom = (alertInfo: PostAlertToWecomProps) => {
  const toast = useChakraToast();
  const { sendAlertToWeComToggle } = useAlarmToggle();
  const [isSendAlertToWeCom, setIsSendAlertToWeCom] = useState(false);

  useEffect(() => {
    if (!sendAlertToWeComToggle || isSendAlertToWeCom) {
      return;
    }
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        msgtype: 'news',
        news: {
          articles: [
            {
              title: 'Prod Alert',
              description: `${alertInfo.alertName}`,
              url: 'https://app.datadoghq.eu/monitors/manage?q=changan%20status%3Aalert%20env%3Aprod&order=desc',
              picurl:
                'https://media.licdn.com/dms/image/C560BAQFLwWfI6v1OPA/company-logo_200_200/0/1657564322231/datadog_logo?e=2147483647&v=beta&t=CYhp1DI8UYvbdgEMj8lGkKqtWvO_4Kel_NJlKRzoz8E',
            },
          ],
        },
      }),
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
        setIsSendAlertToWeCom(true);
      })
      .catch((error) => {
        () => console.warn(error);
        setIsSendAlertToWeCom(false);
      });
    // return () => {
    //   fetch(url, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       msgtype: 'text',
    //       text: {
    //         content: `${alertInfo.alertName} is closed`,
    //       },
    //     }),
    //     mode: 'no-cors',
    //   });
    // };
  }, [sendAlertToWeComToggle]);
  return <></>;
};

export default PostAlertToWecom;
