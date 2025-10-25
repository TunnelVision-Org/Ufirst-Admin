/**
 * Unit Tests for Delete Client API Route
 */

import { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/clients/delete';

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

describe('Delete Client API Route', () => {
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
      method: 'DELETE',
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

    it('should reject POST requests', async () => {
      req.method = 'POST';

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

    it('should accept DELETE requests', async () => {
      req.body = { id: 'client1' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client1', userId: 'user1' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteUser: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).not.toHaveBeenCalledWith(405);
    });
  });

  describe('Request Body Validation', () => {
    it('should reject request without id', async () => {
      req.body = {};

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Client ID is required',
      });
    });

    it('should reject request with empty id', async () => {
      req.body = { id: '' };

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Client ID is required',
      });
    });

    it('should reject request with null id', async () => {
      req.body = { id: null };

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Client ID is required',
      });
    });

    it('should accept request with valid id', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user123' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteUser: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).not.toHaveBeenCalledWith(400);
    });
  });

  describe('Successful Deletion', () => {
    it('should successfully delete client and user', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteUser: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Client and associated user deleted successfully',
        deletedClientId: 'client123',
        deletedUserId: 'user456',
      });
    });

    it('should make three GraphQL calls in sequence', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteUser: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(fetch).toHaveBeenCalledTimes(3);

      const firstCall = (fetch as jest.Mock).mock.calls[0][1];
      const firstBody = JSON.parse(firstCall.body);
      expect(firstBody.query).toContain('query GetClientForDelete');

      const secondCall = (fetch as jest.Mock).mock.calls[1][1];
      const secondBody = JSON.parse(secondCall.body);
      expect(secondBody.query).toContain('mutation DeleteClient');

      const thirdCall = (fetch as jest.Mock).mock.calls[2][1];
      const thirdBody = JSON.parse(thirdCall.body);
      expect(thirdBody.query).toContain('mutation DeleteUser');
    });

    it('should log all success steps', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteUser: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🔍 [clients/delete] Fetching client to get userId...'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '✅ [clients/delete] Found client with userId:',
        'user456'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🗑️ [clients/delete] Deleting client record...'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '✅ [clients/delete] Client record deleted'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🗑️ [clients/delete] Deleting associated user record...'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '✅ [clients/delete] User record deleted'
      );
    });

    it('should delete client without userId', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: null } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(fetch).toHaveBeenCalledTimes(2); // No user deletion call
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Client and associated user deleted successfully',
        deletedClientId: 'client123',
        deletedUserId: null,
      });
    });
  });

  describe('Client Fetch Errors', () => {
    it('should handle GraphQL errors when fetching client', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          errors: [{ message: 'Client query failed' }],
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to fetch client',
        details: [{ message: 'Client query failed' }],
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ [clients/delete] Failed to fetch client:',
        [{ message: 'Client query failed' }]
      );
    });

    it('should handle client not found', async () => {
      req.body = { id: 'nonexistent' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          data: { client: null },
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Client not found',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ [clients/delete] Client not found'
      );
    });

    it('should handle missing data in response', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          data: {},
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Client not found',
      });
    });
  });

  describe('Client Deletion Errors', () => {
    it('should handle GraphQL errors when deleting client', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            errors: [{ message: 'Delete operation failed' }],
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to delete client',
        details: [{ message: 'Delete operation failed' }],
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ [clients/delete] Failed to delete client:',
        [{ message: 'Delete operation failed' }]
      );
    });

    it('should handle mutation failure with success: false', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              deleteClient: {
                success: false,
                errors: [{ message: 'Client has active workouts' }],
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Client has active workouts',
        details: undefined,
      });
    });

    it('should use default error message when no error provided', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              deleteClient: {
                success: false,
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to delete client',
        details: undefined,
      });
    });
  });

  describe('User Deletion Errors', () => {
    it('should handle GraphQL errors when deleting user', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            errors: [{ message: 'User deletion failed' }],
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Client deleted but user deletion failed',
        warning: 'Associated user account may still exist',
        deletedClientId: 'client123',
        userId: 'user456',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '⚠️ [clients/delete] Warning: Failed to delete associated user:',
        [{ message: 'User deletion failed' }]
      );
    });

    it('should handle mutation failure when deleting user', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              deleteUser: {
                success: false,
                errors: [{ message: 'User has active sessions' }],
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Client deleted but user deletion failed',
        warning: 'Associated user account may still exist',
        deletedClientId: 'client123',
        userId: 'user456',
      });
    });

    it('should still return success when user deletion fails', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteUser: { success: false } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      const response = jsonMock.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.warning).toBe('Associated user account may still exist');
    });
  });

  describe('Network and Server Errors', () => {
    it('should handle network error during client fetch', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        details: 'Network error',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ [clients/delete] Error:',
        expect.any(Error)
      );
    });

    it('should handle network error during client deletion', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
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

    it('should handle network error during user deletion', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        details: 'Network error',
      });
    });

    it('should handle malformed JSON response', async () => {
      req.body = { id: 'client123' };

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
      req.body = { id: 'client123' };

      (fetch as jest.Mock).mockRejectedValueOnce('String error');

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        details: 'Unknown error',
      });
    });
  });

  describe('GraphQL Request Structure', () => {
    it('should send correct client fetch query', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteUser: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const firstCall = (fetch as jest.Mock).mock.calls[0];
      expect(firstCall[0]).toBe('https://api.gadget.test/graphql');
      expect(firstCall[1].method).toBe('POST');
      expect(firstCall[1].headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-api-key-123',
      });

      const requestBody = JSON.parse(firstCall[1].body);
      expect(requestBody.query).toContain('query GetClientForDelete');
      expect(requestBody.variables).toEqual({ id: 'client123' });
    });

    it('should send correct client deletion mutation', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteUser: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const secondCall = (fetch as jest.Mock).mock.calls[1];
      const requestBody = JSON.parse(secondCall[1].body);
      expect(requestBody.query).toContain('mutation DeleteClient');
      expect(requestBody.variables).toEqual({ id: 'client123' });
    });

    it('should send correct user deletion mutation', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteUser: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const thirdCall = (fetch as jest.Mock).mock.calls[2];
      const requestBody = JSON.parse(thirdCall[1].body);
      expect(requestBody.query).toContain('mutation DeleteUser');
      expect(requestBody.variables).toEqual({ id: 'user456' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in client ID', async () => {
      req.body = { id: 'client-123-abc' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client-123-abc', userId: 'user-456-def' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteUser: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      const response = jsonMock.mock.calls[0][0];
      expect(response.deletedClientId).toBe('client-123-abc');
      expect(response.deletedUserId).toBe('user-456-def');
    });

    it('should handle very long client IDs', async () => {
      const longId = 'client-' + 'a'.repeat(200);

      req.body = { id: longId };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: longId, userId: 'user123' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteUser: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should handle numeric client IDs', async () => {
      req.body = { id: 12345 };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 12345, userId: 67890 } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteUser: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      const response = jsonMock.mock.calls[0][0];
      expect(response.deletedClientId).toBe(12345);
      expect(response.deletedUserId).toBe(67890);
    });

    it('should handle client with undefined userId', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: undefined } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(fetch).toHaveBeenCalledTimes(2); // No user deletion
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should handle client with empty string userId', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: '' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(fetch).toHaveBeenCalledTimes(2); // No user deletion for empty string
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('Response Structure', () => {
    it('should return correct structure on full success', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteUser: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const response = jsonMock.mock.calls[0][0];
      expect(response).toEqual({
        success: true,
        message: 'Client and associated user deleted successfully',
        deletedClientId: 'client123',
        deletedUserId: 'user456',
      });
    });

    it('should return correct structure on partial success', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteUser: { success: false } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const response = jsonMock.mock.calls[0][0];
      expect(response).toEqual({
        success: true,
        message: 'Client deleted but user deletion failed',
        warning: 'Associated user account may still exist',
        deletedClientId: 'client123',
        userId: 'user456',
      });
    });

    it('should include all required fields in success response', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteUser: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('deletedClientId');
      expect(response).toHaveProperty('deletedUserId');
    });

    it('should include warning field on partial success', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            errors: [{ message: 'User not found' }],
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty('warning');
      expect(response).toHaveProperty('userId');
      expect(response.warning).toBe('Associated user account may still exist');
    });
  });

  describe('Deletion Order', () => {
    it('should delete client before user', async () => {
      req.body = { id: 'client123' };

      const callOrder: string[] = [];

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => {
            callOrder.push('fetch-client');
            return { data: { client: { id: 'client123', userId: 'user456' } } };
          },
        })
        .mockResolvedValueOnce({
          json: async () => {
            callOrder.push('delete-client');
            return { data: { deleteClient: { success: true } } };
          },
        })
        .mockResolvedValueOnce({
          json: async () => {
            callOrder.push('delete-user');
            return { data: { deleteUser: { success: true } } };
          },
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(callOrder).toEqual(['fetch-client', 'delete-client', 'delete-user']);
    });

    it('should not attempt user deletion if client deletion fails', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: false } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(fetch).toHaveBeenCalledTimes(2); // Only fetch and delete client, no user deletion
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should not attempt user deletion if client not found', async () => {
      req.body = { id: 'nonexistent' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          data: { client: null },
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(fetch).toHaveBeenCalledTimes(1); // Only fetch attempt
      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('Authorization Headers', () => {
    it('should include authorization header in all requests', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteUser: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const calls = (fetch as jest.Mock).mock.calls;
      
      calls.forEach(call => {
        const headers = call[1].headers;
        expect(headers['Authorization']).toBe('Bearer test-api-key-123');
        expect(headers['Content-Type']).toBe('application/json');
      });
    });

    it('should use correct GraphQL endpoint for all requests', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteUser: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const calls = (fetch as jest.Mock).mock.calls;
      
      calls.forEach(call => {
        expect(call[0]).toBe('https://api.gadget.test/graphql');
        expect(call[1].method).toBe('POST');
      });
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle rapid successive deletion requests', async () => {
      req.body = { id: 'client1' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client1', userId: 'user1' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteClient: { success: true } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { deleteUser: { success: true } },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle deletion with multiple error messages', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            data: { client: { id: 'client123', userId: 'user456' } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              deleteClient: {
                success: false,
                errors: [
                  { message: 'Error 1' },
                  { message: 'Error 2' },
                  { message: 'Error 3' },
                ],
              },
            },
          }),
        });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      const response = jsonMock.mock.calls[0][0];
      expect(response.error).toBe('Error 1'); // Should use first error
    });

    it('should maintain idempotency - handle already deleted client gracefully', async () => {
      req.body = { id: 'client123' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          data: { client: null },
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Client not found',
      });
    });
  });
});