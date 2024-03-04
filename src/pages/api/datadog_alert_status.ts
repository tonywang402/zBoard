import { NextApiHandler } from 'next';
import { client, v1 } from '@datadog/datadog-api-client';

const handler: NextApiHandler = async (req, res) => {
  try {
    const notificationId = Number(req.query.notificationId); // Convert to number
    const data = await searchMonitor({ notificationId });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).send((error as Error).message);
  }
};

const searchMonitor = async ({ notificationId }: { notificationId: number }) => {
  const configuration = client.createConfiguration();
  const apiInstance = new v1.MonitorsApi(configuration);
  const params: v1.MonitorsApiSearchMonitorsRequest = {
    query: `id: ${notificationId}`,
  };

  try {
    const data: v1.MonitorSearchResponse = await apiInstance.searchMonitors(params);
    const monitorData = data.monitors?.[0];
    return monitorData?.status;
  } catch (error) {
    throw new Error('Request to Datadog API failed');
  }
};

export default handler;
