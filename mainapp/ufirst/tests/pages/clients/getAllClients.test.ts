// TypeScript
/**
 * Unit tests for GET /api/clients/getAll
 */

jest.useRealTimers();

describe('GET /api/clients/getAll API Route', () => {
  let handler: any;
  let originalFetch: any;
  const defaultConfig = {
    GADGET_API_URL: 'https://api.gadget.test/graphql',
    GADGET_API_KEY: 'test-api-key-123',
  };

  // console spies
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    // reset modules and mocks before each test so config can be re-mocked if needed
    jest.resetModules();

    // mock config with defaults
    jest.mock('@/config/api', () => defaultConfig);

    // setup global fetch mock
    originalFetch = (global as any).fetch;
    (global as any).fetch = jest.fn();

    // import handler after mocks are set up
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    handler = require('@/pages/api/clients/getAll').default;
  });

  afterEach(() => {
    // restore fetch between tests
    (global as any).fetch = originalFetch;
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  // helper to create mocked req/res
  function createReqRes(method: string = 'GET') {
    const req: Partial<import('next').NextApiRequest> = {
      method,
    };

    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    const res: Partial<import('next').NextApiResponse> = {
      status: statusMock,
      json: jsonMock,
    };

    return { req, res, statusMock, jsonMock };
  }

  it('returns 405 for non-GET methods', async () => {
    const { req, res, statusMock, jsonMock } = createReqRes('POST');

    await handler(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(405);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('returns 500 when GADGET_API_KEY is missing', async () => {
    // re-mock config with missing key
    jest.resetModules();
    jest.mock('@/config/api', () => ({
      GADGET_API_URL: 'https://api.gadget.test/graphql',
      GADGET_API_KEY: '',
    }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const handlerMissingKey = require('@/pages/api/clients/getAll').default;

    const { req, res, statusMock, jsonMock } = createReqRes('GET');

    await handlerMissingKey(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Server configuration error: Missing API key' });
  });

  it('handles GraphQL errors returned from Gadget', async () => {
    const errors = [{ message: 'Something went wrong' }];

    (global as any).fetch.mockResolvedValueOnce({
      json: async () => ({ errors }),
    });

    const { req, res, statusMock, jsonMock } = createReqRes('GET');

    await handler(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'GraphQL errors', details: errors });
  });

  it('returns 400 when result has no clients data', async () => {
    (global as any).fetch.mockResolvedValueOnce({
      json: async () => ({ data: {} }),
    });

    const { req, res, statusMock, jsonMock } = createReqRes('GET');

    await handler(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Failed to fetch clients" });
  });

  it('maps client nodes to expected shape on success (trainer present)', async () => {
    const apiResult = {
      data: {
        clients: {
          edges: [
            {
              node: {
                id: 'client1',
                userId: 'user1',
                trainerId: 'trainer1',
                user: {
                  id: 'user1',
                  firstName: 'Alice',
                  lastName: 'Wonder',
                  email: 'alice@example.com',
                },
                trainer: {
                  id: 'trainer1',
                  user: {
                    firstName: 'Tom',
                    lastName: 'Coach',
                  },
                },
                workouts: { edges: [{ node: { id: 'w1' } }, { node: { id: 'w2' } }] },
                mealPlan: { id: 'mp1', name: 'Plan A', description: 'desc' },
                weightTrend: { edges: [{ node: { id: 'wt1' } }] },
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-02T00:00:00Z',
              },
            },
          ],
        },
      },
    };

    (global as any).fetch.mockResolvedValueOnce({
      json: async () => apiResult,
    });

    const { req, res, statusMock, jsonMock } = createReqRes('GET');

    await handler(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledTimes(1);

    const response = jsonMock.mock.calls[0][0];
    expect(response.success).toBe(true);
    expect(Array.isArray(response.clients)).toBe(true);
    expect(response.clients.length).toBe(1);

    const client = response.clients[0];
    expect(client.id).toBe('client1');
    expect(client.userId).toBe('user1');
    expect(client.trainerId).toBe('trainer1');
    expect(client.name).toBe('Alice Wonder');
    expect(client.firstName).toBe('Alice');
    expect(client.lastName).toBe('Wonder');
    expect(client.email).toBe('alice@example.com');
    expect(client.trainerName).toBe('Tom Coach');
    expect(client.workoutCount).toBe(2);
    expect(client.mealPlanCount).toBe(1);
    expect(client.weightTrendCount).toBe(1);
    expect(client.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(client.updatedAt).toBe('2024-01-02T00:00:00Z');

    // verify fetch was called with correct endpoint and headers
    const firstCall = (global as any).fetch.mock.calls[0];
    expect(firstCall[0]).toBe(defaultConfig.GADGET_API_URL);
    expect(firstCall[1].method).toBe('POST');
    expect(firstCall[1].headers).toEqual({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${defaultConfig.GADGET_API_KEY}`,
    });
  });

  it('maps trainerName to "Unassigned" when trainer is null and counts default to 0', async () => {
    const apiResult = {
      data: {
        clients: {
          edges: [
            {
              node: {
                id: 'client2',
                userId: 'user2',
                trainerId: null,
                user: {
                  id: 'user2',
                  firstName: 'Bob',
                  lastName: 'NoTrainer',
                  email: 'bob@example.com',
                },
                trainer: null,
                workouts: { edges: [] },
                mealPlan: null,
                weightTrend: { edges: [] },
                createdAt: '2024-02-01',
                updatedAt: '2024-02-02',
              },
            },
          ],
        },
      },
    };

    (global as any).fetch.mockResolvedValueOnce({
      json: async () => apiResult,
    });

    const { req, res, statusMock, jsonMock } = createReqRes('GET');

    await handler(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(200);
    const response = jsonMock.mock.calls[0][0];
    const client = response.clients[0];
    expect(client.trainerName).toBe('Unassigned');
    expect(client.workoutCount).toBe(0);
    expect(client.mealPlanCount).toBe(0);
    expect(client.weightTrendCount).toBe(0);
  });

  it('returns 500 when fetch.json throws (malformed JSON)', async () => {
    (global as any).fetch.mockResolvedValueOnce({
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const { req, res, statusMock, jsonMock } = createReqRes('GET');

    await handler(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Internal server error',
      details: 'Invalid JSON',
    });
  });

  it('returns 500 when fetch rejects (network error)', async () => {
    (global as any).fetch.mockRejectedValueOnce(new Error('Network failure'));

    const { req, res, statusMock, jsonMock } = createReqRes('GET');

    await handler(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Internal server error',
      details: 'Network failure',
    });
  });
});