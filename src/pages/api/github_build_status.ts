import { NextApiHandler } from 'next';
import { buildStatusConfig } from '@/../config/build_status.config';

interface workflowRunResponse {
  total_count: number;
  workflow_runs: WorkflowRun[];
}

/**
 * An invocation of a workflow
 */
interface WorkflowRun {
  id: number;
  name?: string | null;
  head_branch: string | null;
  head_sha: string;
  path: string;
  run_number: number;
  status: string | null;
  conclusion: string | null;
  workflow_id: number;
  created_at: string;
  updated_at: string;
  actor?: SimpleUser;
  triggering_actor?: SimpleUser;
  run_started_at?: string;
  jobs_url: string;
  head_commit: null | SimpleCommit;
  display_title: string;
}

interface SimpleUser {
  login: string;
  avatar_url: string;
  gravatar_id: string | null;
}
/**
 * A commit.
 */
interface SimpleCommit {
  id: string;
  tree_id: string;
  message: string;
  timestamp: string;
  author: {
    name: string;
    email: string;
  } | null;
  committer: {
    name: string;
    email: string;
  } | null;
}

interface Step {
  name: string;
  conclusion: string | null;
  number: number;
}

interface Job {
  name: string;
  conclusion: string | null;
  steps?: Step[];
}

interface JobsResponse {
  total_count: number;
  jobs: Job[];
}

export interface FailedJobInfo {
  jobName: string;
  failedSteps: string[];
}

const githubActionsConfig = buildStatusConfig.datasource.github;

const getFailedJobInfo = async (jobsUrl: string): Promise<FailedJobInfo[]> => {
  const response = await fetch(jobsUrl, {
    headers: { Authorization: `Bearer ${githubActionsConfig.apiToken}` },
  });
  if (!response.ok) return [];
  const json: JobsResponse = await response.json();
  return json.jobs
    .filter((job) => job.conclusion === 'failure')
    .map((job) => ({
      jobName: job.name.includes('/') ? job.name.split('/').pop()!.trim() : job.name,
      failedSteps: (job.steps ?? [])
        .filter((step) => step.conclusion === 'failure' || step.conclusion === 'timed_out')
        .map((step) => step.name),
    }));
};

const handler: NextApiHandler = async (req, res) => {
  getAllGitHubStatus()
    .then((response) => res.status(200).json(response))
    .catch((err) => res.status(500).send(err.message));
};

export const getAllGitHubStatus = async () => {
  if (githubActionsConfig.enabled) {
    return await Promise.all(githubActionsConfig.projects.map((project) => getStatus(project)));
  }
  return [];
};

const getStatus = async ({
  projectName,
  owner,
  repo,
  branch,
  workflowId,
}: {
  projectName: string;
  owner: string;
  repo: string;
  branch: string;
  workflowId: number;
}) => {
  const url = `${githubActionsConfig.baseUrl}/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs?per_page=1`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${githubActionsConfig.apiToken}`,
    },
  });
  let json: workflowRunResponse = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(json));
  }
  const workflowRun = json.workflow_runs[0];
  const effectiveStatus = workflowRun.status === 'completed' ? workflowRun.conclusion : workflowRun.status;
  const failedJobInfo =
    effectiveStatus === 'failure'
      ? await getFailedJobInfo(workflowRun.jobs_url)
      : undefined;
  return {
    platform: 'Github',
    projectName: projectName,
    branch: branch,
    status: effectiveStatus,
    stopTime: workflowRun.updated_at,
    username: workflowRun.triggering_actor?.login,
    avatarUrl: workflowRun.triggering_actor?.avatar_url,
    commitSubject: workflowRun.head_commit?.message,
    failedJobInfo,
  };
};

export default handler;
