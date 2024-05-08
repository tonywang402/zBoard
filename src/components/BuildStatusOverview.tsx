import { SystemProps, Grid } from '@chakra-ui/react';
import BuildStatusCard, { BuildStatus } from '@/components/BuildStatusCard';
import RefreshWrapper from '@/components/RefreshWrapper';
import { buildStatusConfig } from '../../config/build_status.config';
import { useErrorToast } from '@/lib/customToast';

const BuildStatusOverview = (props: SystemProps) => {
  const toastError = useErrorToast();
  const statusPriority: { [key: string]: number } = {
    failed: 1,
    failure: 2,
    startup_failure: 3,
    running: 4,
    in_progress: 5,
    on_hold: 6,
    queued: 7,
    pending: 8,
    requested: 9,
    canceled: 10,
    cancelled: 11,
    unauthorized: 12,
    action_required: 13,
    neutral: 14,
    skipped: 15,
    stale: 16,
    timed_out: 17,
    waiting: 18,
    success: 19,
    completed: 20,
  };

  const fetchData = async () => {
    const res = await fetch('/api/build_status');
    if (res.ok) {
      const data = await res.json();
      data.sort((a: BuildStatus, b: BuildStatus) => {
        return statusPriority[a.status] - statusPriority[b.status];
      });
      return data;
    } else {
      toastError(await res.text());
      return [];
    }
  };

  return (
    <RefreshWrapper
      {...props}
      title={buildStatusConfig.title || 'Build Status'}
      onRefresh={fetchData}
      refreshIntervalSeconds={buildStatusConfig.refreshIntervalSeconds || 0}
      render={(data: BuildStatus[]) => (
        <>
          <Grid
            overflowY="scroll"
            height="100%"
            width="100%"
            rowGap="18px"
            columnGap="24px"
            gridTemplateColumns="repeat(auto-fit, minmax(320px, 1fr))"
          >
            {data.map((item) => (
              <BuildStatusCard
                key={`${item.commitSubject} ${item.status} ${item.stopTime}`}
                buildStatus={item}
              />
            ))}
          </Grid>
        </>
      )}
    />
  );
};

export default BuildStatusOverview;
