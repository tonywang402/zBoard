import { canPlay } from '../Alarm/AlarmContainer';
import moment from 'moment';

const mockNow = (isoString: string) =>
  jest.spyOn(moment, 'now').mockReturnValue(new Date(isoString).getTime());

describe('canPlay', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns false on Saturday', () => {
    mockNow('2026-03-07T10:00:00');
    expect(canPlay()).toBe(false);
  });

  it('returns false on Sunday', () => {
    mockNow('2026-03-08T10:00:00');
    expect(canPlay()).toBe(false);
  });

  it('returns false on weekday before morning window', () => {
    mockNow('2026-03-06T09:00:00');
    expect(canPlay()).toBe(false);
  });

  it('returns true during morning window (09:30–11:30)', () => {
    mockNow('2026-03-06T10:00:00');
    expect(canPlay()).toBe(true);
  });

  it('returns false between 11:30 and 13:30', () => {
    mockNow('2026-03-06T12:00:00');
    expect(canPlay()).toBe(false);
  });

  it('returns true during afternoon window (13:30–18:00)', () => {
    mockNow('2026-03-06T15:00:00');
    expect(canPlay()).toBe(true);
  });

  it('returns false after 18:00', () => {
    mockNow('2026-03-06T18:30:00');
    expect(canPlay()).toBe(false);
  });
});
