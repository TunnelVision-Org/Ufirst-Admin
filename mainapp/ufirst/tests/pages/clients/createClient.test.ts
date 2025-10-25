/**
 * Unit Tests for Create Client API Route
 */

import { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/clients/create';

// Mock the config
jest.mock('@/config/api', () => ({
  GADGET_API_URL: 'https://api.gadget.test/graphql',
  GADGET_API_KEY: 'test-api-key-123',
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to avoid cluttering test output
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

describe('Create Client API Route', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup response mocks
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    req = {
      method: 'POST',
      body: {},
    };

    res = {
      status: statusMock,
      json: jsonMock,
    };
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('HTTP Method Validation', () => {
    it('should reject GET requests', async () => {
      req.method = 'GET';

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('should reject PUT requests', async () => {
      req.method = 'PUT';

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('should reject DELETE requests', async () => {
      req.method = 'DELETE';

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('should accept POST requests', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: true,
                client: {
                  id: 'client1',
                  userId: 'user1',
                  trainerId: null,
                  user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).not.toHaveBeenCalledWith(405);
    });
  });

  describe('Request Body Validation', () => {
    it('should reject request without firstName', async () => {
      req.body = {
        lastName: 'Doe',
        email: 'john@example.com',
      };

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'First name, last name, and email are required',
      });
    });

    it('should reject request without lastName', async () => {
      req.body = {
        firstName: 'John',
        email: 'john@example.com',
      };

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'First name, last name, and email are required',
      });
    });

    it('should reject request without email', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
      };

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'First name, last name, and email are required',
      });
    });

    it('should reject request with empty firstName', async () => {
      req.body = {
        firstName: '',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should reject request with empty lastName', async () => {
      req.body = {
        firstName: 'John',
        lastName: '',
        email: 'john@example.com',
      };

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should reject request with empty email', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: '',
      };

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should accept request with all required fields', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: true,
                client: {
                  id: 'client1',
                  userId: 'user1',
                  trainerId: null,
                  user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).not.toHaveBeenCalledWith(400);
    });
  });

  describe('Successful Client Creation', () => {
    it('should create client with required fields only', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: {
                  id: 'user123',
                  firstName: 'John',
                  lastName: 'Doe',
                  email: 'john@example.com',
                },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: true,
                client: {
                  id: 'client123',
                  userId: 'user123',
                  trainerId: null,
                  user: {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                  },
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-01T00:00:00Z',
                },
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        client: {
          id: 'client123',
          userId: 'user123',
          trainerId: null,
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          workoutCount: 0,
          mealPlanCount: 0,
          weightTrendCount: 0,
        },
      });
    });

    it('should create client with custom password', async () => {
      req.body = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'customPassword123',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: {
                  id: 'user456',
                  firstName: 'Jane',
                  lastName: 'Smith',
                  email: 'jane@example.com',
                },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: true,
                client: {
                  id: 'client456',
                  userId: 'user456',
                  trainerId: null,
                  user: {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    email: 'jane@example.com',
                  },
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-01T00:00:00Z',
                },
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const firstFetchCall = (fetch as jest.Mock).mock.calls[0];
      const userRequestBody = JSON.parse(firstFetchCall[1].body);

      expect(userRequestBody.variables.password).toBe('customPassword123');
      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it('should create client with default password when not provided', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: true,
                client: {
                  id: 'client1',
                  userId: 'user1',
                  trainerId: null,
                  user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const firstFetchCall = (fetch as jest.Mock).mock.calls[0];
      const userRequestBody = JSON.parse(firstFetchCall[1].body);

      expect(userRequestBody.variables.password).toBe('defaultPassword123');
    });

    it('should create client with trainerId', async () => {
      req.body = {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob@example.com',
        trainerId: 'trainer789',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: {
                  id: 'user789',
                  firstName: 'Bob',
                  lastName: 'Johnson',
                  email: 'bob@example.com',
                },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: true,
                client: {
                  id: 'client789',
                  userId: 'user789',
                  trainerId: 'trainer789',
                  user: {
                    firstName: 'Bob',
                    lastName: 'Johnson',
                    email: 'bob@example.com',
                  },
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-01T00:00:00Z',
                },
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const secondFetchCall = (fetch as jest.Mock).mock.calls[1];
      const clientRequestBody = JSON.parse(secondFetchCall[1].body);

      expect(clientRequestBody.variables.trainerId).toBe('trainer789');
      expect(statusMock).toHaveBeenCalledWith(201);
      
      const response = jsonMock.mock.calls[0][0];
      expect(response.client.trainerId).toBe('trainer789');
    });

    it('should make two GraphQL calls (create user, then create client)', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: true,
                client: {
                  id: 'client1',
                  userId: 'user1',
                  trainerId: null,
                  user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(fetch).toHaveBeenCalledTimes(2);
      
      const firstCall = (fetch as jest.Mock).mock.calls[0][1];
      const firstBody = JSON.parse(firstCall.body);
      expect(firstBody.query).toContain('mutation CreateUser');
      
      const secondCall = (fetch as jest.Mock).mock.calls[1][1];
      const secondBody = JSON.parse(secondCall.body);
      expect(secondBody.query).toContain('mutation CreateClient');
    });

    it('should log success messages', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: true,
                client: {
                  id: 'client1',
                  userId: 'user1',
                  trainerId: null,
                  user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🔍 [clients/create] Creating user for client:',
        'john@example.com'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '✅ [clients/create] User created with ID:',
        'user1'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🔍 [clients/create] Creating client record...'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '✅ [clients/create] Client created:',
        'client1'
      );
    });
  });

  describe('User Creation Errors', () => {
    it('should handle GraphQL errors when creating user', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          errors: [
            {
              message: 'Email already exists',
            },
          ],
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to create user',
        details: [{ message: 'Email already exists' }],
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ [clients/create] Failed to create user:',
        [{ message: 'Email already exists' }]
      );
    });

    it('should handle mutation failure with success: false', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          data: {
            createUser: {
              success: false,
              errors: [
                {
                  message: 'Invalid email format',
                },
              ],
            },
          },
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Invalid email format',
        details: undefined,
      });
    });

    it('should use default error message when no error provided', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          data: {
            createUser: {
              success: false,
            },
          },
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to create user',
        details: undefined,
      });
    });
  });

  describe('Client Creation Errors', () => {
    it('should handle GraphQL errors when creating client', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            errors: [
              {
                message: 'Client creation failed',
              },
            ],
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to create client',
        details: [{ message: 'Client creation failed' }],
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ [clients/create] Failed to create client:',
        [{ message: 'Client creation failed' }]
      );
    });

    it('should handle mutation failure with success: false when creating client', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: false,
                errors: [
                  {
                    message: 'Invalid trainer ID',
                  },
                ],
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Invalid trainer ID',
        details: undefined,
      });
    });

    it('should use default error message when creating client fails without message', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: false,
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to create client',
        details: undefined,
      });
    });
  });

  describe('Network and Server Errors', () => {
    it('should handle network error during user creation', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        details: 'Network error',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ [clients/create] Error:',
        expect.any(Error)
      );
    });

    it('should handle network error during client creation', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
              },
            },
          }),
        })
        .mockRejectedValueOnce(new Error('Connection timeout'));

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        details: 'Connection timeout',
      });
    });

    it('should handle malformed JSON response', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        details: 'Invalid JSON',
      });
    });

    it('should handle non-Error exceptions', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (fetch as jest.Mock).mockRejectedValueOnce('String error');

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        details: 'Unknown error',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in names', async () => {
      req.body = {
        firstName: "O'Brien",
        lastName: 'Smith-Jones',
        email: 'special@example.com',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: { id: 'user1', firstName: "O'Brien", lastName: 'Smith-Jones', email: 'special@example.com' },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: true,
                client: {
                  id: 'client1',
                  userId: 'user1',
                  trainerId: null,
                  user: { firstName: "O'Brien", lastName: 'Smith-Jones', email: 'special@example.com' },
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(201);
      const response = jsonMock.mock.calls[0][0];
      expect(response.client.name).toBe("O'Brien Smith-Jones");
    });

    it('should handle very long names', async () => {
      const longName = 'A'.repeat(100);
      req.body = {
        firstName: longName,
        lastName: longName,
        email: 'long@example.com',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: { id: 'user1', firstName: longName, lastName: longName, email: 'long@example.com' },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: true,
                client: {
                  id: 'client1',
                  userId: 'user1',
                  trainerId: null,
                  user: { firstName: longName, lastName: longName, email: 'long@example.com' },
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it('should handle unicode characters in names', async () => {
      req.body = {
        firstName: '李',
        lastName: '明',
        email: 'unicode@example.com',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: { id: 'user1', firstName: '李', lastName: '明', email: 'unicode@example.com' },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: true,
                client: {
                  id: 'client1',
                  userId: 'user1',
                  trainerId: null,
                  user: { firstName: '李', lastName: '明', email: 'unicode@example.com' },
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(201);
      const response = jsonMock.mock.calls[0][0];
      expect(response.client.name).toBe('李 明');
    });

    it('should handle email with plus addressing', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john+test@example.com',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john+test@example.com' },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: true,
                client: {
                  id: 'client1',
                  userId: 'user1',
                  trainerId: null,
                  user: { firstName: 'John', lastName: 'Doe', email: 'john+test@example.com' },
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(201);
      const response = jsonMock.mock.calls[0][0];
      expect(response.client.email).toBe('john+test@example.com');
    });
  });

  describe('GraphQL Request Structure', () => {
    it('should send correct user creation mutation', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'myPassword',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: true,
                client: {
                  id: 'client1',
                  userId: 'user1',
                  trainerId: null,
                  user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const firstCall = (fetch as jest.Mock).mock.calls[0];
      expect(firstCall[0]).toBe('https://api.gadget.test/graphql');
      expect(firstCall[1].method).toBe('POST');
      expect(firstCall[1].headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-api-key-123',
      });

      const requestBody = JSON.parse(firstCall[1].body);
      expect(requestBody.query).toContain('mutation CreateUser');
      expect(requestBody.variables).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'myPassword',
      });
    });

    it('should send correct client creation mutation', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        trainerId: 'trainer123',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: { id: 'user456', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: true,
                client: {
                  id: 'client1',
                  userId: 'user456',
                  trainerId: 'trainer123',
                  user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const secondCall = (fetch as jest.Mock).mock.calls[1];
      expect(secondCall[0]).toBe('https://api.gadget.test/graphql');
      expect(secondCall[1].method).toBe('POST');
      expect(secondCall[1].headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-api-key-123',
      });

      const requestBody = JSON.parse(secondCall[1].body);
      expect(requestBody.query).toContain('mutation CreateClient');
      expect(requestBody.variables).toEqual({
        userId: 'user456',
        trainerId: 'trainer123',
      });
    });

    it('should send null trainerId when not provided', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: true,
                client: {
                  id: 'client1',
                  userId: 'user1',
                  trainerId: null,
                  user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const secondCall = (fetch as jest.Mock).mock.calls[1];
      const requestBody = JSON.parse(secondCall[1].body);
      expect(requestBody.variables.trainerId).toBeNull();
    });
  });

  describe('Response Structure', () => {
    it('should return complete client object with all fields', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: { id: 'user123', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: true,
                client: {
                  id: 'client123',
                  userId: 'user123',
                  trainerId: null,
                  user: {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                  },
                  createdAt: '2024-01-01T10:30:00Z',
                  updatedAt: '2024-01-01T10:30:00Z',
                },
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('client');
      expect(response.client).toEqual({
        id: 'client123',
        userId: 'user123',
        trainerId: null,
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        createdAt: '2024-01-01T10:30:00Z',
        updatedAt: '2024-01-01T10:30:00Z',
        workoutCount: 0,
        mealPlanCount: 0,
        weightTrendCount: 0,
      });
    });

    it('should initialize counts to zero', async () => {
      req.body = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createUser: {
                success: true,
                user: { id: 'user1', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              createClient: {
                success: true,
                client: {
                  id: 'client1',
                  userId: 'user1',
                  trainerId: null,
                  user: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const response = jsonMock.mock.calls[0][0];
      expect(response.client.workoutCount).toBe(0);
      expect(response.client.mealPlanCount).toBe(0);
      expect(response.client.weightTrendCount).toBe(0);
    });
  });
});