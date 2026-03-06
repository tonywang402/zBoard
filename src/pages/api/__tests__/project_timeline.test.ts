import moment from 'moment';
import { calculateStartEndDate, buildCardInfo } from '../project_timeline';

jest.mock('../../../../config/project_timeline.config', () => ({
  projectTimelineConfig: {
    datasource: {
      kanbanize: {
        enabled: true,
        baseUrl: 'https://acme.kanbanize.com',
        apikey: 'kb-fake-key',
        boardId: 193,
        monitorColumns: [
          { id: 3942, name: 'To Do' },
          { id: 3943, name: 'In Progress' },
          { id: 3944, name: 'Done' },
        ],
        monitorCardTypes: [{ id: 3955, name: 'Business' }],
        startColumns: [{ id: 3942 }],
        endColumns: [{ id: 3944 }],
        defaultIterationWeeks: 2,
      },
    },
  },
}));

const baseCard = {
  card_id: 'CARD-42',
  title: 'Implement payment gateway',
  color: 'blue',
  column_id: 3943,
  owner_user_id: 101,
  co_owner_ids: [102, 103],
  deadline: '',
  transitions: [
    { column_id: 3942, start: '2026-02-01T09:00:00Z' },
    { column_id: 3944, start: '2026-02-14T17:00:00Z' },
  ],
};

describe('calculateStartEndDate', () => {
  it('uses transition start when both startColumn and endColumn transitions exist', () => {
    const [start, end] = calculateStartEndDate(baseCard as any);
    expect(start).toBe(moment('2026-02-01T09:00:00Z').format('YYYY-MM-DD'));
    expect(end).toBe(moment('2026-02-14T17:00:00Z').format('YYYY-MM-DD'));
  });

  it('falls back to card.deadline when no endColumn transition is found', () => {
    const card = {
      ...baseCard,
      deadline: '2026-03-01',
      transitions: [{ column_id: 3942, start: '2026-02-01T09:00:00Z' }],
    };
    const [start, end] = calculateStartEndDate(card as any);
    expect(start).toBe('2026-02-01');
    expect(end).toBe('2026-03-01');
  });

  it('falls back to startDate + defaultIterationWeeks when no endColumn and no deadline', () => {
    const card = {
      ...baseCard,
      deadline: '',
      transitions: [{ column_id: 3942, start: '2026-02-01T09:00:00Z' }],
    };
    const [start, end] = calculateStartEndDate(card as any);
    const expectedStart = moment('2026-02-01T09:00:00Z').format('YYYY-MM-DD');
    const expectedEnd = moment('2026-02-01T09:00:00Z').add(2, 'weeks').format('YYYY-MM-DD');
    expect(start).toBe(expectedStart);
    expect(end).toBe(expectedEnd);
  });

  it('uses moment() when transitions is empty — startDate equals today (documented edge case)', () => {
    const card = { ...baseCard, transitions: [] };
    const [start] = calculateStartEndDate(card as any);
    // moment(undefined) returns current date, so startDate = today
    expect(start).toBe(moment().format('YYYY-MM-DD'));
  });
});

describe('buildCardInfo', () => {
  const mockBuildUserInfo = (userId: number) =>
    userId === 101 ? { name: 'Alice', avatar: 'alice.png' } : null;

  it('resolves column name from monitorColumns by column_id', () => {
    const card = buildCardInfo(baseCard as any, mockBuildUserInfo);
    expect(card.status).toBe('In Progress');
  });

  it('returns undefined status when column_id is not in monitorColumns', () => {
    const card = buildCardInfo({ ...baseCard, column_id: 9999 } as any, mockBuildUserInfo);
    expect(card.status).toBeUndefined();
  });

  it('resolves owner via buildUserInfo with owner_user_id', () => {
    const card = buildCardInfo(baseCard as any, mockBuildUserInfo);
    expect(card.owner).toEqual({ name: 'Alice', avatar: 'alice.png' });
  });

  it('returns null for co-owners whose IDs are not found by buildUserInfo', () => {
    const card = buildCardInfo(baseCard as any, mockBuildUserInfo);
    // co_owner_ids [102, 103] — both return null from mockBuildUserInfo
    expect(card.coOwners).toEqual([null, null]);
  });

  it('returns undefined coOwners when co_owner_ids is undefined', () => {
    const card = buildCardInfo({ ...baseCard, co_owner_ids: undefined } as any, mockBuildUserInfo);
    expect(card.coOwners).toBeUndefined();
  });

  it('maps card fields to the expected output shape', () => {
    const card = buildCardInfo(baseCard as any, mockBuildUserInfo);
    expect(card.cardNo).toBe('CARD-42');
    expect(card.cardName).toBe('Implement payment gateway');
    expect(card.color).toBe('blue');
  });
});
