/**
 * Unit Tests for Assign Trainer API Route
 */

import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../../src/pages/api/clients/assignTrainer';

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

describe('Assign Trainer API Route', () => {
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
      method: 'PUT',
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

    it('should reject DELETE requests', async () => {
      req.method = 'DELETE';

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('should accept PUT requests', async () => {
      req.method = 'PUT';
      req.body = { clientId: 'client1', trainerId: 'trainer1' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          data: {
            updateClient: {
              success: true,
            },
          },
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).not.toHaveBeenCalledWith(405);
    });
  });

  describe('Request Body Validation', () => {
    it('should reject request without clientId', async () => {
      req.body = { trainerId: 'trainer1' };

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Client ID and Trainer ID are required',
      });
    });

    it('should reject request without trainerId', async () => {
      req.body = { clientId: 'client1' };

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Client ID and Trainer ID are required',
      });
    });

    it('should reject request with empty clientId', async () => {
      req.body = { clientId: '', trainerId: 'trainer1' };

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Client ID and Trainer ID are required',
      });
    });

    it('should reject request with empty trainerId', async () => {
      req.body = { clientId: 'client1', trainerId: '' };

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Client ID and Trainer ID are required',
      });
    });

    it('should reject request with null clientId', async () => {
      req.body = { clientId: null, trainerId: 'trainer1' };

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should accept request with both valid IDs', async () => {
      req.body = { clientId: 'client1', trainerId: 'trainer1' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          data: {
            updateClient: {
              success: true,
            },
          },
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).not.toHaveBeenCalledWith(400);
    });
  });

  describe('API Configuration Validation', () => {
    it('should handle missing API key', async () => {
      // Mock the config to return undefined API key
      jest.resetModules();
      jest.doMock('@/config/api', () => ({
        GADGET_API_URL: 'https://api.gadget.test/graphql',
        GADGET_API_KEY: undefined,
      }));

      const handlerWithoutKey = require('../../../src/pages/api/clients/assignTrainer').default;

      req.body = { clientId: 'client1', trainerId: 'trainer1' };

      await handlerWithoutKey(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Server configuration error: Missing API key',
      });

      // Restore mocks
      jest.resetModules();
      jest.mock('@/config/api', () => ({
        GADGET_API_URL: 'https://api.gadget.test/graphql',
        GADGET_API_KEY: 'test-api-key-123',
      }));
    });
  });

  describe('Successful Assignment', () => {
    it('should successfully assign trainer to client', async () => {
      req.body = { clientId: 'client123', trainerId: 'trainer456' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          data: {
            updateClient: {
              success: true,
            },
          },
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(fetch).toHaveBeenCalledWith('https://api.gadget.test/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key-123',
        },
        body: expect.stringContaining('mutation AssignTrainer'),
      });

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Trainer assigned successfully',
      });
    });

    it('should send correct GraphQL mutation', async () => {
      req.body = { clientId: 'client123', trainerId: 'trainer456' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          data: {
            updateClient: {
              success: true,
            },
          },
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.variables).toEqual({
        clientId: 'client123',
        trainerId: 'trainer456',
      });
      expect(requestBody.query).toContain('mutation AssignTrainer');
      expect(requestBody.query).toContain('updateClient');
      expect(requestBody.query).toContain('trainerId: $trainerId');
    });

    it('should log success message', async () => {
      req.body = { clientId: 'client123', trainerId: 'trainer456' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          data: {
            updateClient: {
              success: true,
            },
          },
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🔍 [clients/assignTrainer] Assigning trainer',
        'trainer456',
        'to client',
        'client123'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '✅ [clients/assignTrainer] Trainer assigned successfully'
      );
    });
  });

  describe('GraphQL Error Handling', () => {
    it('should handle GraphQL errors in response', async () => {
      req.body = { clientId: 'client1', trainerId: 'trainer1' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          errors: [
            {
              message: 'GraphQL error: Invalid client ID',
              path: ['updateClient'],
            },
          ],
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to assign trainer',
        details: [
          {
            message: 'GraphQL error: Invalid client ID',
            path: ['updateClient'],
          },
        ],
      });
    });

    it('should handle mutation failure with success: false', async () => {
      req.body = { clientId: 'client1', trainerId: 'trainer1' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          data: {
            updateClient: {
              success: false,
              errors: [
                {
                  message: 'Client not found',
                },
              ],
            },
          },
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Client not found',
        details: undefined,
      });
    });

    it('should handle mutation failure without error message', async () => {
      req.body = { clientId: 'client1', trainerId: 'trainer1' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          data: {
            updateClient: {
              success: false,
            },
          },
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to assign trainer',
        details: undefined,
      });
    });

    it('should handle multiple error messages', async () => {
      req.body = { clientId: 'client1', trainerId: 'trainer1' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          data: {
            updateClient: {
              success: false,
              errors: [
                { message: 'Client not found' },
                { message: 'Trainer is inactive' },
              ],
            },
          },
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Client not found',
        details: undefined,
      });
    });

    it('should log GraphQL errors', async () => {
      req.body = { clientId: 'client1', trainerId: 'trainer1' };

      const mockErrors = [{ message: 'GraphQL error' }];

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          errors: mockErrors,
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ [clients/assignTrainer] Failed:',
        mockErrors
      );
    });
  });

  describe('Network and Server Errors', () => {
    it('should handle fetch network errors', async () => {
      req.body = { clientId: 'client1', trainerId: 'trainer1' };

      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        details: 'Network error',
      });
    });

    it('should handle fetch timeout errors', async () => {
      req.body = { clientId: 'client1', trainerId: 'trainer1' };

      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Request timeout'));

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        details: 'Request timeout',
      });
    });

    it('should handle non-Error exceptions', async () => {
      req.body = { clientId: 'client1', trainerId: 'trainer1' };

      (fetch as jest.Mock).mockRejectedValueOnce('Unknown error');

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        details: 'Unknown error',
      });
    });

    it('should handle malformed JSON response', async () => {
      req.body = { clientId: 'client1', trainerId: 'trainer1' };

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

    it('should log server errors', async () => {
      req.body = { clientId: 'client1', trainerId: 'trainer1' };

      const mockError = new Error('Server error');
      (fetch as jest.Mock).mockRejectedValueOnce(mockError);

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ [clients/assignTrainer] Error:',
        mockError
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in IDs', async () => {
      req.body = { clientId: 'client-123-abc', trainerId: 'trainer-456-def' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          data: {
            updateClient: {
              success: true,
            },
          },
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.variables.clientId).toBe('client-123-abc');
      expect(requestBody.variables.trainerId).toBe('trainer-456-def');
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should handle very long ID strings', async () => {
      const longClientId = 'client-' + 'a'.repeat(100);
      const longTrainerId = 'trainer-' + 'b'.repeat(100);

      req.body = { clientId: longClientId, trainerId: longTrainerId };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          data: {
            updateClient: {
              success: true,
            },
          },
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should handle numeric IDs', async () => {
      req.body = { clientId: 123, trainerId: 456 };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          data: {
            updateClient: {
              success: true,
            },
          },
        }),
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.variables.clientId).toBe(123);
      expect(requestBody.variables.trainerId).toBe(456);
    });
  });
});