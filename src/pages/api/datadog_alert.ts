import { NextApiHandler } from 'next';
import { client, v1 } from '@datadog/datadog-api-client';
import { monitorConfig as datadogMonitorConfigs } from '../../../config/datadog_monitor.config';

interface alertConfig {
  env: string;
  priority: number;
  alertStrategy: string;
}

interface alertDatas {
  name: string;
  id: number;
  triggeredTime: number;
  env: string;
  priority: number;
  alertStrategy: string;
}

const handler: NextApiHandler = async (req, res) => {
  try {
    const data = await fetchMonitorAlertData();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).send((error as Error).message);
  }
};

const fetchMonitorAlertData = async () => {
  const monitorConfig = datadogMonitorConfigs.datasource.datadog;
  if (monitorConfig.enabled) {
    const alertTag = monitorConfig.alertTags?.[0];
    if (!alertTag) {
      throw new Error('datadog datasource alertTags[0] is required');
    }

    const allData = await Promise.all(
      monitorConfig.projects.map((project) => searchAlerts(project.monitorConfigs, alertTag))
    );
    return allData.flat();
  }
  return [];
};

async function searchAlerts(
  monitorConfigs: alertConfig[],
  alertTag: string
): Promise<alertDatas[]> {
  const alertData = await Promise.all(
    monitorConfigs.map((config) => searchMonitor(config, alertTag))
  );

  return alertData.flat().filter((alert): alert is alertDatas => alert !== undefined);
}

const searchMonitor = async (
  {
    env,
    priority,
    alertStrategy,
  }: alertConfig,
  alertTag: string
) => {
  const configuration = client.createConfiguration();
  const apiInstance = new v1.MonitorsApi(configuration);
  const params: v1.MonitorsApiSearchMonitorsRequest = {
    query: `env: ${env.toLowerCase()} status: alert tag:${alertTag}`,
  };

  try {
    const data: v1.MonitorSearchResponse = await apiInstance.searchMonitors(params);
    const alertInfo = data.monitors?.map((monitor) => {
      return {
        name: monitor.name,
        id: monitor.id,
        triggeredTime: monitor.lastTriggeredTs,
        env,
        priority,
        alertStrategy,
      };
    });
    return alertInfo;
  } catch (error) {
    throw new Error('Request to Datadog API failed');
  }
};

export default handler;
