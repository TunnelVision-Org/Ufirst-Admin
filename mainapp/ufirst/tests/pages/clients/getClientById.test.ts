// Unit tests for src/pages/api/clients/getById.ts

import { NextApiRequest, NextApiResponse } from 'next';

describe('GET /api/clients/getById', () => {
  const defaultConfig = {
    GADGET_API_URL: 'https://api.gadget.test/graphql',
    GADGET_API_KEY: 'test-key-123',
  };

  let handler: any;
  let originalFetch: any;
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    jest.resetModules();
    // mock config alias
    jest.mock('@/config/api', () => defaultConfig);
    originalFetch = (global as any).fetch;
    (global as any).fetch = jest.fn();
    // import after mocks
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    handler = require('@/pages/api/clients/getById').default;
  });

  afterEach(() => {
    (global as any).fetch = originalFetch;
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  function createReqRes(method = 'GET', id?: string) {
    const req: Partial<NextApiRequest> = {
      method,
      query: id !== undefined ? { id } : {},
    };

    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    const res: Partial<NextApiResponse> = {
      status: statusMock,
      json: jsonMock,
    };

    return { req, res, statusMock, jsonMock };
  }

  it('returns 405 for non-GET methods', async () => {
    const { req, res, statusMock, jsonMock } = createReqRes('POST', 'any-id');
    await handler(req as any, res as any);
    expect(statusMock).toHaveBeenCalledWith(405);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('returns 400 when id is missing or invalid', async () => {
    const { req, res, statusMock, jsonMock } = createReqRes('GET'); // no id
    await handler(req as any, res as any);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Client ID is required' });
  });

  it('returns 500 when GADGET_API_KEY is missing', async () => {
    jest.resetModules();
    jest.mock('@/config/api', () => ({
      GADGET_API_URL: defaultConfig.GADGET_API_URL,
      GADGET_API_KEY: '',
    }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const handlerMissingKey = require('@/pages/api/clients/getById').default;

    const { req, res, statusMock, jsonMock } = createReqRes('GET', 'client-1');
    await handlerMissingKey(req as any, res as any);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Server configuration error: Missing API key' });
  });

  it('handles GraphQL errors returned from Gadget', async () => {
    const errors = [{ message: 'Bad request' }];
    (global as any).fetch.mockResolvedValueOnce({
      json: async () => ({ errors }),
    });

    const { req, res, statusMock, jsonMock } = createReqRes('GET', 'client-1');
    await handler(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'GraphQL errors', details: errors });
  });

  it('returns 404 when client not found', async () => {
    (global as any).fetch.mockResolvedValueOnce({
      json: async () => ({ data: { client: null } }),
    });

    const { req, res, statusMock, jsonMock } = createReqRes('GET', 'missing-id');
    await handler(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Client not found' });
  });

  it('maps client node to expected shape on success (trainer present)', async () => {
    const apiResult = {
      data: {
        client: {
          id: 'client1',
          userId: 'user1',
          trainerId: 'trainer1',
          user: { id: 'user1', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
          trainer: { id: 'trainer1', user: { firstName: 'Coach', lastName: 'C' } },
          workouts: { edges: [{ node: { id: 'w1' } }] },
          mealPlan: { edges: [{ node: { id: 'mp1' } }, { node: { id: 'mp2' } }] },
          weightTrend: { edges: [{ node: { id: 'wt1' } }, { node: { id: 'wt2' } }] },
          createdAt: '2024-03-01T00:00:00Z',
          updatedAt: '2024-03-02T00:00:00Z',
        },
      },
    };

    (global as any).fetch.mockResolvedValueOnce({
      json: async () => apiResult,
    });

    const { req, res, statusMock, jsonMock } = createReqRes('GET', 'client1');
    await handler(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(200);
    const response = jsonMock.mock.calls[0][0];
    expect(response.success).toBe(true);
    const client = response.client;
    expect(client.id).toBe('client1');
    expect(client.userId).toBe('user1');
    expect(client.trainerId).toBe('trainer1');
    expect(client.name).toBe('Jane Doe');
    expect(client.firstName).toBe('Jane');
    expect(client.lastName).toBe('Doe');
    expect(client.email).toBe('jane@example.com');
    expect(client.trainerName).toBe('Coach C');
    expect(client.workoutCount).toBe(1);
    expect(client.mealPlanCount).toBe(2);
    expect(client.weightTrendCount).toBe(2);
    expect(client.createdAt).toBe('2024-03-01T00:00:00Z');
    expect(client.updatedAt).toBe('2024-03-02T00:00:00Z');

    // verify fetch call shape
    const firstCall = (global as any).fetch.mock.calls[0];
    expect(firstCall[0]).toBe(defaultConfig.GADGET_API_URL);
    expect(firstCall[1].method).toBe('POST');
    expect(firstCall[1].headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${defaultConfig.GADGET_API_KEY}`,
    });
    const body = JSON.parse(firstCall[1].body);
    expect(body.variables).toEqual({ id: 'client1' });
  });

  it('maps trainerName to "Unassigned" and zero counts when fields absent', async () => {
    const apiResult = {
      data: {
        client: {
          id: 'client2',
          userId: 'user2',
          trainerId: null,
          user: { id: 'user2', firstName: 'Sam', lastName: 'No', email: 'sam@example.com' },
          trainer: null,
          workouts: { edges: [] },
          mealPlan: null,
          weightTrend: { edges: [] },
          createdAt: '2024-04-01',
          updatedAt: '2024-04-02',
        },
      },
    };

    (global as any).fetch.mockResolvedValueOnce({
      json: async () => apiResult,
    });

    const { req, res, statusMock, jsonMock } = createReqRes('GET', 'client2');
    await handler(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(200);
    const response = jsonMock.mock.calls[0][0];
    const client = response.client;
    expect(client.trainerName).toBe('Unassigned');
    expect(client.workoutCount).toBe(0);
    expect(client.mealPlanCount).toBe(0);
    expect(client.weightTrendCount).toBe(0);
  });

  it('returns 500 when fetch.json throws', async () => {
    (global as any).fetch.mockResolvedValueOnce({
      json: async () => {
        throw new Error('Bad JSON');
      },
    });

    const { req, res, statusMock, jsonMock } = createReqRes('GET', 'client1');
    await handler(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Internal server error',
      details: 'Bad JSON',
    });
  });

  it('returns 500 when fetch rejects', async () => {
    (global as any).fetch.mockRejectedValueOnce(new Error('Network error'));

    const { req, res, statusMock, jsonMock } = createReqRes('GET', 'client1');
    await handler(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Internal server error',
      details: 'Network error',
    });
  });
});