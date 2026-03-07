export const buildStatusConfig = {
  title: 'Build Status',
  refreshIntervalSeconds: 60,
  datasource: {
    circleCI: {
      enabled: false,
      // generate token here: https://app.circleci.com/settings/user/tokens
      apiToken: process.env.CIRCLE_CI_API_TOKEN,
      // projects you want to monitor
      projects: [
        {
          projectName: 'project_name',
          projectSlug: 'gh/org_name/repo_name',
          branch: 'master',
        },
        {
          projectName: 'project_name',
          projectSlug: 'gh/org_name/repo_name',
          branch: 'master',
        },
      ],
    },
    github: {
      enabled: true,
      // generate GitHub token with Read access to GitHub Actions, code, and metadata
      apiToken: process.env.GITHUB_API_TOKEN,
      // GitHub API url (for self-hosted GitHub, default URL is https://api.github.com)
      baseUrl: 'https://git.i.mercedes-benz.com/api/v3',
      // refresh interval for Build Status
      refreshIntervalSeconds: 60,
      // projects you want to monitor
      // workflow ID may check by https://api.github.com/repos/USER/REPO/actions/workflows
      projects: [
        {
          projectName: 'Handover Build & Deploy',
          owner: 'OTR-Germany',
          repo: 'handover',
          branch: 'main',
          workflowId: 31680,
        },
        {
          projectName: 'Invoices Build & Deploy',
          owner: 'OTR-Germany',
          repo: 'invoices-service',
          branch: 'main',
          workflowId: 70101,
        },
        {
          projectName: 'Handover PR Check',
          owner: 'OTR-Germany',
          repo: 'handover',
          branch: 'main',
          workflowId: 37808,
        },
        {
          projectName: 'Handover Deploy CI',
          owner: 'OTR-Germany',
          repo: 'handover',
          branch: 'main',
          workflowId: 37809,
        },
        {
          projectName: 'Invoices Deploy CI',
          owner: 'OTR-Germany',
          repo: 'invoices-service',
          branch: 'main',
          workflowId: 70104,
        },
        {
          projectName: 'Performance Test',
          owner: 'OTR-Germany',
          repo: 'handover',
          branch: 'main',
          workflowId: 39231,
        },
        {
          projectName: 'Handover Rotate App DB password',
          owner: 'OTR-Germany',
          repo: 'handover',
          branch: 'main',
          workflowId: 69492,
        },
        {
          projectName: 'Handover Reset App DB RD password',
          owner: 'OTR-Germany',
          repo: 'handover',
          branch: 'main',
          workflowId: 69491,
        },
        // {
        //   projectName: 'Invoices Rotate App DB password',
        //   owner: 'OTR-Germany',
        //   repo: 'invoices-service',
        //   branch: 'main',
        //   workflowId: 70107,
        // },
        // {
        //   projectName: 'Invoices Reset App DB RD password',
        //   owner: 'OTR-Germany',
        //   repo: 'invoices-service',
        //   branch: 'main',
        //   workflowId: 70106,
        // },
        {
          projectName: 'Handover BD Full Scan',
          owner: 'OTR-Germany',
          repo: 'handover',
          branch: 'main',
          workflowId: 31337,
        },
        {
          projectName: 'Invoices BD Full Scan',
          owner: 'OTR-Germany',
          repo: 'invoices-service',
          branch: 'main',
          workflowId: 70100,
        },
      ],
    },
  },
};