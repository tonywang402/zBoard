import { getCIStatus } from '../build_status';
import { getAllCircleBuildStatus } from '../circle_build_status';
import { getAllGitHubStatus } from '../github_build_status';

jest.mock('../../../../config/build_status.config', () => ({
  buildStatusConfig: {
    datasource: {
      circleCI: { enabled: false, projects: [], apiToken: 'test-circle-token' },
      github: { enabled: false, projects: [], apiToken: 'test-gh-token', baseUrl: 'https://api.github.com' },
    },
  },
}));
jest.mock('../circle_build_status');
jest.mock('../github_build_status');
jest.mock('../../../../fake/build_status.fake');
jest.mock('@/lib/delay', () => ({ delay1s: (fn: () => any) => fn() }));

const mockGetAllCircleBuildStatus = getAllCircleBuildStatus as jest.MockedFunction<typeof getAllCircleBuildStatus>;
const mockGetAllGitHubStatus = getAllGitHubStatus as jest.MockedFunction<typeof getAllGitHubStatus>;

describe('getCIStatus', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns fake data when both circleCI.enabled and github.enabled are false', async () => {
    const { getBuildStatusFakeData } = jest.requireMock('../../../../fake/build_status.fake');
    const fakeResult = [{ projectName: 'zboard-api', branch: 'master', status: 'success' }];
    getBuildStatusFakeData.mockReturnValue(fakeResult);

    const result = await getCIStatus();

    expect(result).toEqual(fakeResult);
    expect(mockGetAllCircleBuildStatus).not.toHaveBeenCalled();
    expect(mockGetAllGitHubStatus).not.toHaveBeenCalled();
  });

  it('merges CircleCI and GitHub results when any datasource is enabled', async () => {
    const circleResult = [{ platform: 'CircleCI', projectName: 'backend', status: 'success' }];
    const githubResult = [{ platform: 'Github', projectName: 'frontend', status: 'success' }];
    mockGetAllCircleBuildStatus.mockResolvedValue(circleResult as any);
    mockGetAllGitHubStatus.mockResolvedValue(githubResult as any);

    const config = jest.requireMock('../../../../config/build_status.config').buildStatusConfig;
    config.datasource.circleCI.enabled = true;

    const result = await getCIStatus();
    expect(result).toEqual([...circleResult, ...githubResult]);

    config.datasource.circleCI.enabled = false;
  });

  it('calls both fetchers even when only GitHub is enabled', async () => {
    mockGetAllCircleBuildStatus.mockResolvedValue([]);
    mockGetAllGitHubStatus.mockResolvedValue([{ platform: 'Github', projectName: 'frontend', status: 'success' }] as any);

    const config = jest.requireMock('../../../../config/build_status.config').buildStatusConfig;
    config.datasource.github.enabled = true;

    await getCIStatus();
    expect(mockGetAllCircleBuildStatus).toHaveBeenCalledTimes(1);
    expect(mockGetAllGitHubStatus).toHaveBeenCalledTimes(1);

    config.datasource.github.enabled = false;
  });
});
