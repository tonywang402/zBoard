import { NextApiHandler } from 'next';
import { client, v1 } from '@datadog/datadog-api-client';
import { monitorConfig as datadogMonitorConfigs } from '../../../config/datadog_monitor.config';

interface alertConfig {
  env: string;
  priority: Number;
  alertStrategy: string;
}

interface monitorData {
  projectName: String;
  monitorData: Array<any>;
}

const handler: NextApiHandler = async (req, res) => {
  try {
    const data = await fetchMonitorData();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).send((error as Error).message);
  }
};

const fetchMonitorData = async () => {
  const monitorConfig = datadogMonitorConfigs.datasource.datadog;
  if (monitorConfig.enabled) {
    const allData = await Promise.all(
      monitorConfig.projects.map((project) =>
        searchMonitors(project.monitorConfigs, project.projectName)
      )
    );
    return allData;
  }
  return [];
};

async function searchMonitors(
  monitorConfigs: alertConfig[],
  projectName: String
): Promise<monitorData> {
  const allData = await Promise.all(
    monitorConfigs.map((config) => searchMonitor(config, projectName))
  );
  return { projectName, monitorData: allData };
}

const searchMonitor = async (
  {
    env,
    priority,
    alertStrategy,
  }: {
    env: string;
    priority: Number;
    alertStrategy: string;
  },
  projectName: String
) => {
  const configuration = client.createConfiguration();
  const apiInstance = new v1.MonitorsApi(configuration);
  const params: v1.MonitorsApiSearchMonitorsRequest = {
    query: `service: ${projectName.toLowerCase()} env: ${env.toLowerCase()}`,
  };

  try {
    const data: v1.MonitorSearchResponse = await apiInstance.searchMonitors(params);
    const color = getMonitorColor(data.counts);
    return {
      env,
      priority,
      alertStrategy,
      color: color,
      status: data.counts?.status,
    };
  } catch (error) {
    throw new Error('Request to Datadog API failed');
  }
};

const getMonitorColor = (counts?: v1.MonitorSearchResponseCounts) => {
  if (!counts || !counts.status || counts.status.length === 0) {
    return 'grey';
  }
  if (counts.status.some((item) => item.name === 'Alert')) {
    return 'red';
  }
  return 'green';
};

export default handler;
