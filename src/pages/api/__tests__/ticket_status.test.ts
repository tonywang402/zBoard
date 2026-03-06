import { getAllBuildStatus } from '../ticket_status';

jest.mock('../../../../config/ticket_status.config', () => ({
  ticketStatusConfig: {
    datasource: {
      zendesk: {
        enabled: true,
        baseUrl: 'https://acme.zendesk.com',
        viewId: '360001234',
        userEmail: 'bot@acme.com',
        apiToken: 'zdtoken-fake',
      },
    },
  },
}));
jest.mock('@/lib/delay', () => ({ delay1s: (fn: () => any) => fn() }));
jest.mock('../../../../fake/ticket_status.fake');

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const okJson = (body: unknown) =>
  Promise.resolve({ ok: true, json: async () => body });
const errResponse = () =>
  Promise.resolve({ ok: false, status: 403, json: async () => null });

describe('getAllBuildStatus — Zendesk ticket fetching', () => {
  afterEach(() => {
    mockFetch.mockReset();
    jest.requireMock('../../../../config/ticket_status.config').ticketStatusConfig.datasource.zendesk.enabled = true;
  });

  it('returns fake data when zendesk is disabled', async () => {
    jest.requireMock('../../../../config/ticket_status.config').ticketStatusConfig.datasource.zendesk.enabled = false;
    const { getTicketStatusFakeData } = jest.requireMock('../../../../fake/ticket_status.fake');
    getTicketStatusFakeData.mockReturnValue([{ id: 1, subject: 'Fake ticket' }]);

    const result = await getAllBuildStatus();
    expect(result).toEqual([{ id: 1, subject: 'Fake ticket' }]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns tickets from a single page when next_page is null', async () => {
    mockFetch.mockReturnValueOnce(okJson({
      tickets: [{ id: 101, subject: 'Login broken' }],
      next_page: null,
    }));

    const result = await getAllBuildStatus();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(101);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('accumulates all tickets across paginated responses until next_page is null', async () => {
    mockFetch
      .mockReturnValueOnce(okJson({
        tickets: [{ id: 101, subject: 'Login broken' }],
        next_page: 'https://acme.zendesk.com/api/v2/views/360001234/tickets?page=2',
      }))
      .mockReturnValueOnce(okJson({
        tickets: [{ id: 102, subject: 'Checkout error' }],
        next_page: null,
      }));

    const result = await getAllBuildStatus();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(101);
    expect(result[1].id).toBe(102);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('accumulates tickets across three pages', async () => {
    mockFetch
      .mockReturnValueOnce(okJson({ tickets: [{ id: 1 }], next_page: 'https://acme.zendesk.com/tickets?page=2' }))
      .mockReturnValueOnce(okJson({ tickets: [{ id: 2 }], next_page: 'https://acme.zendesk.com/tickets?page=3' }))
      .mockReturnValueOnce(okJson({ tickets: [{ id: 3 }], next_page: null }));

    const result = await getAllBuildStatus();
    expect(result).toHaveLength(3);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('throws "failed to fetch zendesk tickets" on any non-ok response', async () => {
    mockFetch.mockReturnValueOnce(errResponse());
    await expect(getAllBuildStatus()).rejects.toThrow('failed to fetch zendesk tickets');
  });

  it('throws on non-ok response mid-pagination and stops fetching', async () => {
    mockFetch
      .mockReturnValueOnce(okJson({ tickets: [{ id: 101 }], next_page: 'https://acme.zendesk.com/tickets?page=2' }))
      .mockReturnValueOnce(errResponse());

    await expect(getAllBuildStatus()).rejects.toThrow('failed to fetch zendesk tickets');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

