import { NextApiHandler } from 'next';
import { buildStatusConfig } from '../../../config/build_status.config';

interface RerunRequestBody {
  owner?: string;
  repo?: string;
  runId?: number | string;
}

const githubActionsConfig = buildStatusConfig.datasource.github;

const isAllowedGitHubProject = (owner: string, repo: string) => {
  const projects = Array.isArray(githubActionsConfig.projects)
    ? githubActionsConfig.projects
    : [];
  return projects.some(
    (project: { owner?: string; repo?: string }) =>
      project.owner?.toLowerCase() === owner.toLowerCase() &&
      project.repo?.toLowerCase() === repo.toLowerCase()
  );
};

export const rerunFailedJobs = async ({
  owner,
  repo,
  runId,
}: {
  owner: string;
  repo: string;
  runId: number;
}) => {
  if (!githubActionsConfig.enabled || !githubActionsConfig.apiToken) {
    throw new Error('GitHub build status datasource is not configured');
  }

  const url = `${githubActionsConfig.baseUrl}/repos/${owner}/${repo}/actions/runs/${runId}/rerun-failed-jobs`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${githubActionsConfig.apiToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }
    throw new Error(JSON.stringify(errorBody));
  }

  return {
    success: true,
    message: 'Rerun request accepted',
  };
};

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const { owner, repo, runId } = (req.body || {}) as RerunRequestBody;
  if (!owner || !repo || runId === undefined || runId === null) {
    return res.status(400).json({
      success: false,
      message: 'owner, repo, and runId are required',
    });
  }

  if (typeof owner !== 'string' || typeof repo !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'owner and repo must be strings',
    });
  }

  const normalizedOwner = owner.trim();
  const normalizedRepo = repo.trim();
  if (!normalizedOwner || !normalizedRepo) {
    return res.status(400).json({
      success: false,
      message: 'owner, repo, and runId are required',
    });
  }

  const normalizedRunId = Number(runId);
  if (!Number.isFinite(normalizedRunId)) {
    return res.status(400).json({
      success: false,
      message: 'runId must be a valid number',
    });
  }

  if (!isAllowedGitHubProject(normalizedOwner, normalizedRepo)) {
    return res.status(403).json({
      success: false,
      message: 'owner/repo is not configured for rerun',
    });
  }

  try {
    const result = await rerunFailedJobs({
      owner: normalizedOwner,
      repo: normalizedRepo,
      runId: normalizedRunId,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).send((error as Error).message);
  }
};

export default handler;
