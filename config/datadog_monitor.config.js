export const monitorConfig = {
  title: 'Monitoring',
  refreshIntervalSeconds: 30,
  datasource: {
    datadog: {
      enabled: true,
      refreshIntervalSeconds: 30,
      projects: [
        {
          projectName: 'handover',
          monitorConfigs: [
            {
              env: 'ci',
              priority: 4,
              alertStrategy: 'low',
            },
            {
              env: 'int',
              priority: 3,
              alertStrategy: 'medium',
            },
            {
              env: 'sc',
              priority: 2,
              alertStrategy: 'medium',
            },
            {
              env: 'prod',
              priority: 1,
              alertStrategy: 'high',
            },
          ],
        },
        {
          projectName: 'api-aggregator',
          monitorConfigs: [
            {
              env: 'ci',
              priority: 4,
              alertStrategy: 'low',
            },
            {
              env: 'int',
              priority: 3,
              alertStrategy: 'medium',
            },
            {
              env: 'sc',
              priority: 2,
              alertStrategy: 'medium',
            },
            {
              env: 'prod',
              priority: 1,
              alertStrategy: 'high',
            },
          ],
        },
      ],
    },
  },
};
