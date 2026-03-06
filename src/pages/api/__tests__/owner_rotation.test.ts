import { getAllOwners, sortMembers } from '../owner_rotation';

jest.mock('@/components/OwnerRotationOverview', () => ({}));
jest.mock('../../../../config/owner_rotation.config', () => ({
  ownerRotationConfig: {
    datasource: {
      localData: { enabled: false, rotations: [] },
      apiTable: { enabled: false, baseUrl: 'https://apitable.com/fusion/v1/datasheets/', apiKey: 'at-key', rotations: [] },
      googleSheet: { enabled: false, baseUrl: 'https://docs.google.com/spreadsheets/d/', docId: 'doc123', rotations: [] },
    },
  },
}));
jest.mock('@/lib/apiTableFetcher');
jest.mock('@/lib/googleSheetFetcher');
jest.mock('../../../../fake/owner_rotation.fake');
jest.mock('@/lib/delay', () => ({ delay1s: (fn: () => any) => fn() }));

import { fetchFieldsFromApiTable } from '@/lib/apiTableFetcher';
import { fetchFieldsFromGoogleSheet } from '@/lib/googleSheetFetcher';
import { getOwnerRotationFakeData } from '../../../../fake/owner_rotation.fake';

const getConfig = () =>
  jest.requireMock('../../../../config/owner_rotation.config').ownerRotationConfig;

describe('getAllOwners — datasource routing', () => {
  beforeEach(() => {
    const config = getConfig();
    config.datasource.localData.enabled = false;
    config.datasource.localData.rotations = [];
    config.datasource.apiTable.enabled = false;
    config.datasource.apiTable.rotations = [];
    config.datasource.googleSheet.enabled = false;
    config.datasource.googleSheet.rotations = [];
    jest.clearAllMocks();
  });

  it('returns localData.rotations directly when localData.enabled is true', async () => {
    const localRotations = [{ subject: 'Stand Up', color: 'green', icon: 'email', members: [] }];
    const config = getConfig();
    config.datasource.localData.enabled = true;
    config.datasource.localData.rotations = localRotations;

    const result = await getAllOwners();
    expect(result).toBe(localRotations);
    expect(fetchFieldsFromApiTable).not.toHaveBeenCalled();
    expect(fetchFieldsFromGoogleSheet).not.toHaveBeenCalled();
  });

  it('loads from ApiTable when apiTable.enabled is true', async () => {
    const config = getConfig();
    config.datasource.apiTable.enabled = true;
    config.datasource.apiTable.rotations = [
      { subject: 'Showcase', color: 'blue', icon: 'repeat', datasheetId: 'ds-abc' },
    ];
    (fetchFieldsFromApiTable as jest.Mock).mockResolvedValue([
      { name: 'Alice', startDate: '2026-01-01', endDate: '2026-07-01' },
    ]);

    const result = await getAllOwners();
    expect(result[0].subject).toBe('Showcase');
    expect(result[0].members[0].name).toBe('Alice');
    expect(fetchFieldsFromGoogleSheet).not.toHaveBeenCalled();
  });

  it('loads from GoogleSheet when googleSheet.enabled is true', async () => {
    const config = getConfig();
    config.datasource.googleSheet.enabled = true;
    config.datasource.googleSheet.rotations = [
      { subject: 'Stand Up', color: 'green', icon: 'calendar', sheetName: 'Q1' },
    ];
    (fetchFieldsFromGoogleSheet as jest.Mock).mockResolvedValue([
      { name: 'Bob', startDate: '2026-02-01', endDate: '2026-08-01' },
    ]);

    const result = await getAllOwners();
    expect(result[0].subject).toBe('Stand Up');
    expect(result[0].members[0].name).toBe('Bob');
    expect(fetchFieldsFromApiTable).not.toHaveBeenCalled();
  });

  it('falls back to fake data when all datasources are disabled', async () => {
    const fakeRotations = [{ subject: 'Fake Rotation', color: 'cyan', icon: 'email', members: [] }];
    (getOwnerRotationFakeData as jest.Mock).mockReturnValue(fakeRotations);

    const result = await getAllOwners();
    expect(result).toEqual(fakeRotations);
  });

  it('localData takes priority over apiTable when both enabled', async () => {
    const config = getConfig();
    const localRotations = [{ subject: 'Local', color: 'green', icon: 'email', members: [] }];
    config.datasource.localData.enabled = true;
    config.datasource.localData.rotations = localRotations;
    config.datasource.apiTable.enabled = true;

    const result = await getAllOwners();
    expect(result).toBe(localRotations);
    expect(fetchFieldsFromApiTable).not.toHaveBeenCalled();
  });
});

describe('sortMembers', () => {
  it('sorts by startDate ascending and maps to Member shape', () => {
    const rows = [
      { name: 'Charlie', startDate: '2026-03-01', endDate: '2026-09-01' },
      { name: 'Alice', startDate: '2026-01-01', endDate: '2026-07-01' },
    ];
    const result = sortMembers(rows);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Alice');
    expect(result[1].name).toBe('Charlie');
  });

  it('returns empty array when any row has non-YYYY-MM-DD startDate', () => {
    const rows = [
      { name: 'Alice', startDate: '01/01/2026', endDate: '06/01/2026' },
    ];
    expect(sortMembers(rows)).toEqual([]);
  });

  it('returns empty array when rows is an empty array', () => {
    expect(sortMembers([])).toEqual([]);
  });

  it('returns empty array when rows is undefined', () => {
    expect(sortMembers(undefined as any)).toEqual([]);
  });

  it('maps each row to { name, startDate, endDate } shape', () => {
    const rows = [{ name: 'Alice', startDate: '2026-01-01', endDate: '2026-07-01', extraField: 'ignored' }];
    const [member] = sortMembers(rows);
    expect(member).toEqual({ name: 'Alice', startDate: '2026-01-01', endDate: '2026-07-01' });
  });

  it('handles mixed valid and invalid dates by returning empty array', () => {
    const rows = [
      { name: 'Alice', startDate: '2026-01-01', endDate: '2026-07-01' },
      { name: 'Bob', startDate: 'invalid', endDate: '2026-08-01' },
    ];
    expect(sortMembers(rows)).toEqual([]);
  });
});
