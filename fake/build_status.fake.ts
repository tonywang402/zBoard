import { faker } from '@faker-js/faker';

const repos = Array.from({ length: 9 }).map(() => {
  return {
    projectName: faker.word.noun(),
    branch: faker.helpers.arrayElement(['master', 'release']),
  };
});

export const getBuildStatusFakeData = () => {
  const levels = ['high', 'medium', 'low'] as const;
  return repos.map((repo) => {
    const status = faker.helpers.arrayElement([
      'success',
      'failed',
      'failure',
      'on_hold',
      'running',
      'canceled',
      'unauthorized',
    ]);
    return {
      projectName: repo.projectName,
      branch: repo.branch,
      level: faker.helpers.arrayElement(levels),
      status,
      stopTime: faker.date.recent(1).toISOString(),
      username: faker.name.fullName(),
      avatarUrl: faker.image.avatar(),
      commitSubject: faker.git.commitMessage(),
      failedJobInfo:
        status === 'failure'
          ? [{ jobName: 'build', failedSteps: ['Run unit tests'] }]
          : undefined,
    };
  });
};
