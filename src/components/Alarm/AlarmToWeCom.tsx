import { useEffect, useState } from 'react';
import { useAlarmToggle } from '@/pages/AlarmToggleContext';
import { canPlay as isWorkingTime } from './AlarmContainer';

interface PostAlertToWecomProps {
  alertName: string;
  triggerTime: string;
  notificationId: number;
}

const url =
  process.env.WECOM_CHANNEL_URL ||
  'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=c275c9c6-175e-45f6-955d-eadcd20d9bbf';

const fetchAlertStatus = async (notificationId: number) => {
  const result = await fetch(`/api/datadog_alert_status?notificationId=${notificationId}`);
  if (result.ok) {
    return await result.json();
  } else {
    return '';
  }
};

const PostAlertToWecom = (alertInfo: PostAlertToWecomProps) => {
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

    if (!isWorkingTime()) {
      if (!alertInfo.alertName.includes('Health Check')) {
        return;
      }
    }

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(textNotification),
      mode: 'no-cors',
    })
      .then(() => {
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
