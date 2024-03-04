const url =
  'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=c275c9c6-175e-45f6-955d-eadcd20d9bbf';

import { useEffect, useState } from 'react';
import { useToast as useChakraToast } from '@chakra-ui/toast';
import { useAlarmToggle } from '@/pages/AlarmToggleContext';

//   const imageNotification = {
//     msgtype: 'news',
//     news: {
//       articles: [
//         {
//           title: 'Prod Alert',
//           description: `${alertInfo.alertName}`,
//           url: 'https://app.datadoghq.eu/monitors/manage?q=changan%20status%3Aalert%20env%3Aprod&order=desc',
//           picurl:
//             'https://media.licdn.com/dms/image/C560BAQFLwWfI6v1OPA/company-logo_200_200/0/1657564322231/datadog_logo?e=2147483647&v=beta&t=CYhp1DI8UYvbdgEMj8lGkKqtWvO_4Kel_NJlKRzoz8E',
//         },
//       ],
//     },
//   };

// const cardNotification = {
//   msgtype: 'template_card',
//   template_card: {
//     card_type: 'text_notice',
//     source: {
//       desc: 'DataDog',
//       desc_color: 0,
//     },
//     main_title: {
//       title: 'PROD has a alert!',
//     },
//     emphasis_content: {
//       title: `${alertInfo.alertName}`,
//       desc: `Triggered at ${alertInfo.triggerTime} `,
//     },
//     horizontal_content_list: [
//       {
//         keyname: 'Datadog',
//         value: 'More Info',
//         type: 1,
//         url: 'https://work.weixin.qq.com/?from=openApi',
//       },
//       {
//         keyname: 'Handling Alerts Guidance',
//         value: '点击访问',
//         type: 1,
//         url: 'https://work.weixin.qq.com/?from=openApi',
//       },
//     ],
//     jump_list: [
//       {
//         type: 1,
//         url: 'https://work.weixin.qq.com/?from=openApi',
//         title: '企业微信官网',
//       },
//     ],
//     card_action: {
//       type: 1,
//       url: 'https://work.weixin.qq.com/?from=openApi',
//     },
//   },
// };
interface PostAlertToWecomProps {
  alertName: string;
  triggerTime: string;
  notificationId: number;
}

const fetchAlertStatus = async (notificationId: number) => {
  const result = await fetch(`/api/datadog_alert_status?notificationId=${notificationId}`);
  if (result.ok) {
    return await result.json();
  } else {
    toastError(await result.text());
    return '';
  }
};

const PostAlertToWecom = (alertInfo: PostAlertToWecomProps) => {
  const toast = useChakraToast();
  const { sendAlertToWeComToggle } = useAlarmToggle();
  const [isSendAlertToWeCom, setIsSendAlertToWeCom] = useState(false);

  const textNotification = {
    msgtype: 'text',
    text: {
      content: `PROD has a alert! 

${alertInfo.alertName}

Triggered at ${alertInfo.triggerTime} 

Find more info: 
https://app.datadoghq.eu/monitors/manage?q=changan%20status%3Aalert%20env%3Aprod&order=desc
      
Handling Alerts Guidance: 
https://shared-confluence.mercedes-benz.polygran.de/display/OTR/%5BGuidance%5D+Handling+Alerts

`,
      mentioned_list: ['@all'],
    },
  };

  useEffect(() => {
    if (!sendAlertToWeComToggle || isSendAlertToWeCom) {
      return;
    }

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(textNotification),
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
    return () => {
      closeAlert(alertInfo);
    };
  }, [sendAlertToWeComToggle]);
  return <></>;
};

export default PostAlertToWecom;

const closeAlert = async (alertInfo: PostAlertToWecomProps) => {
  const status = await fetchAlertStatus(alertInfo.notificationId);
  if (status === 'OK') {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        msgtype: 'markdown',
        markdown: {
          content: `
    ${alertInfo.alertName} <font color="warning">is Closed</font> \n
    <font color="comment">It's triggered at ${alertInfo.triggerTime}</font>
     `,
        },
      }),
      mode: 'no-cors',
    });
  }
};

function toastError(arg0: string) {
  throw new Error('Function not implemented.');
}
