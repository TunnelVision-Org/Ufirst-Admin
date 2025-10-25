/**
 * Unit Tests for Client API Functions
 */

import {
  getAllClients,
  getClientById,
  getClientsByTrainer,
  createClient,
  updateClient,
  deleteClient,
  assignClientToTrainer,
  removeTrainerFromClient,
  ClientWithDetails,
} from '../../src/lib/api/clients';


// Mock fetch globally
global.fetch = jest.fn();

describe('Client API Functions', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getAllClients', () => {
    it('should fetch all clients successfully', async () => {
      const mockClients: ClientWithDetails[] = [
        {
          id: '1',
          userId: 'user1',
          trainerId: 'trainer1',
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          trainerName: 'Jane Smith',
          workoutCount: 5,
          mealPlanCount: 3,
          weightTrendCount: 10,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ clients: mockClients }),
      });

      const result = await getAllClients();

      expect(fetch).toHaveBeenCalledWith('/api/clients/getAll', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockClients);
    });

    it('should throw error when fetch fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });

      await expect(getAllClients()).rejects.toThrow('Server error');
    });

    it('should throw default error message when no error provided', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(getAllClients()).rejects.toThrow('Failed to fetch clients');
    });
  });

  describe('getClientById', () => {
    it('should fetch client by id successfully', async () => {
      const mockClient: ClientWithDetails = {
        id: '1',
        userId: 'user1',
        trainerId: 'trainer1',
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        trainerName: 'Jane Smith',
        workoutCount: 5,
        mealPlanCount: 3,
        weightTrendCount: 10,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ client: mockClient }),
      });

      const result = await getClientById('1');

      expect(fetch).toHaveBeenCalledWith('/api/clients/getById?id=1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockClient);
    });

    it('should throw error when client not found', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Client not found' }),
      });

      await expect(getClientById('999')).rejects.toThrow('Client not found');
    });
  });

  describe('getClientsByTrainer', () => {
    it('should fetch clients for a trainer successfully', async () => {
      const mockClients: ClientWithDetails[] = [
        {
          id: '1',
          userId: 'user1',
          trainerId: 'trainer1',
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          workoutCount: 5,
          mealPlanCount: 3,
          weightTrendCount: 10,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ clients: mockClients }),
      });

      const result = await getClientsByTrainer('trainer1');

      expect(fetch).toHaveBeenCalledWith(
        '/api/clients/getByTrainer?trainerId=trainer1',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockClients);
    });

    it('should throw error when fetch fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Trainer not found' }),
      });

      await expect(getClientsByTrainer('invalid')).rejects.toThrow(
        'Trainer not found'
      );
    });
  });

  describe('createClient', () => {
    it('should create client successfully with all fields', async () => {
      const clientData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'securepass123',
        trainerId: 'trainer1',
      };

      const mockCreatedClient: ClientWithDetails = {
        id: '1',
        userId: 'user1',
        trainerId: 'trainer1',
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        workoutCount: 0,
        mealPlanCount: 0,
        weightTrendCount: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ client: mockCreatedClient }),
      });

      const result = await createClient(clientData);

      expect(fetch).toHaveBeenCalledWith('/api/clients/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      expect(result).toEqual(mockCreatedClient);
    });

    it('should create client successfully with minimal fields', async () => {
      const clientData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      };

      const mockCreatedClient: ClientWithDetails = {
        id: '2',
        userId: 'user2',
        trainerId: null,
        name: 'Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        workoutCount: 0,
        mealPlanCount: 0,
        weightTrendCount: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ client: mockCreatedClient }),
      });

      const result = await createClient(clientData);

      expect(result).toEqual(mockCreatedClient);
    });

    it('should throw error when email already exists', async () => {
      const clientData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email already exists' }),
      });

      await expect(createClient(clientData)).rejects.toThrow(
        'Email already exists'
      );
    });
  });

  describe('updateClient', () => {
    it('should update client successfully with all fields', async () => {
      const updates = {
        firstName: 'John',
        lastName: 'Smith',
        email: 'newjohn@example.com',
        trainerId: 'trainer2',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await updateClient('client1', 'user1', updates);

      expect(fetch).toHaveBeenCalledWith('/api/clients/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: 'client1',
          userId: 'user1',
          ...updates,
        }),
      });
    });

    it('should update client with partial fields', async () => {
      const updates = {
        firstName: 'John',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await updateClient('client1', 'user1', updates);

      expect(fetch).toHaveBeenCalledWith('/api/clients/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: 'client1',
          userId: 'user1',
          firstName: 'John',
        }),
      });
    });

    it('should throw error when update fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Update failed' }),
      });

      await expect(
        updateClient('client1', 'user1', { firstName: 'John' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteClient', () => {
    it('should delete client successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await deleteClient('client1');

      expect(fetch).toHaveBeenCalledWith('/api/clients/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: 'client1' }),
      });
    });

    it('should throw error when deletion fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Client not found' }),
      });

      await expect(deleteClient('invalid')).rejects.toThrow('Client not found');
    });
  });

  describe('assignClientToTrainer', () => {
    it('should assign trainer to client successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await assignClientToTrainer('client1', 'trainer1');

      expect(fetch).toHaveBeenCalledWith('/api/clients/assignTrainer', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId: 'client1', trainerId: 'trainer1' }),
      });
    });

    it('should throw error when assignment fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Trainer not found' }),
      });

      await expect(
        assignClientToTrainer('client1', 'invalid')
      ).rejects.toThrow('Trainer not found');
    });
  });

  describe('removeTrainerFromClient', () => {
    it('should remove trainer from client successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await removeTrainerFromClient('client1');

      expect(fetch).toHaveBeenCalledWith('/api/clients/removeTrainer', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId: 'client1' }),
      });
    });

    it('should throw error when removal fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Client has no trainer' }),
      });

      await expect(removeTrainerFromClient('client1')).rejects.toThrow(
        'Client has no trainer'
      );
    });
  });

  describe('Network and Edge Cases', () => {
    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(getAllClients()).rejects.toThrow('Network error');
    });

    it('should handle malformed JSON responses', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(getAllClients()).rejects.toThrow('Invalid JSON');
    });

    it('should handle empty response bodies', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => null,
      });

      await expect(getAllClients()).rejects.toThrow('Failed to fetch clients');
    });
  });
});