/**
 * Unit Tests for Trainer API Functions
 */

import {
  getAllTrainers,
  getTrainerById,
  updateTrainer,
  deleteTrainer,
  getTrainerByEmail,
  Trainer,
  TrainerWithDetails,
} from '../../src/lib/api/trainers';

// Mock fetch globally
global.fetch = jest.fn();

describe('Trainer API Functions', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getAllTrainers', () => {
    it('should fetch all trainers successfully', async () => {
      const mockTrainers: Trainer[] = [
        {
          id: '1',
          name: 'John Trainer',
          firstName: 'John',
          lastName: 'Trainer',
          email: 'john.trainer@example.com',
          userId: 'user1',
          clientCount: 5,
          hireDate: '2023-01-15',
          phone: '555-0100',
          specialization: 'Strength Training',
          rating: 4.8,
          createdAt: '2023-01-15T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Jane Coach',
          firstName: 'Jane',
          lastName: 'Coach',
          email: 'jane.coach@example.com',
          userId: 'user2',
          clientCount: 8,
          hireDate: '2022-06-01',
          phone: '555-0200',
          specialization: 'Cardio',
          rating: 4.9,
          createdAt: '2022-06-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ trainers: mockTrainers }),
      });

      const result = await getAllTrainers();

      expect(fetch).toHaveBeenCalledWith('/api/trainers/getAll', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockTrainers);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no trainers exist', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ trainers: [] }),
      });

      const result = await getAllTrainers();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should throw error when fetch fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });

      await expect(getAllTrainers()).rejects.toThrow('Server error');
    });

    it('should throw default error message when no error provided', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(getAllTrainers()).rejects.toThrow('Failed to fetch trainers');
    });
  });

  describe('getTrainerById', () => {
    it('should fetch trainer by id with full details successfully', async () => {
      const mockTrainer: TrainerWithDetails = {
        id: '1',
        name: 'John Trainer',
        firstName: 'John',
        lastName: 'Trainer',
        email: 'john.trainer@example.com',
        userId: 'user1',
        clientCount: 3,
        hireDate: '2023-01-15',
        phone: '555-0100',
        specialization: 'Strength Training',
        rating: 4.8,
        createdAt: '2023-01-15T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        workoutId: 'workout123',
        mealPlans: [
          { id: 'mp1', name: 'Bulk Plan' },
          { id: 'mp2', name: 'Cut Plan' },
        ],
        clients: [
          {
            id: 'c1',
            name: 'Client One',
            firstName: 'Client',
            lastName: 'One',
            email: 'client1@example.com',
            userId: 'cu1',
            workoutCount: 10,
            mealPlanCount: 2,
            joinDate: '2023-06-01',
            fitnessGoal: 'Weight Loss',
            createdAt: '2023-06-01T00:00:00Z',
          },
          {
            id: 'c2',
            name: 'Client Two',
            firstName: 'Client',
            lastName: 'Two',
            email: 'client2@example.com',
            userId: 'cu2',
            workoutCount: 5,
            mealPlanCount: 1,
            joinDate: '2023-08-15',
            createdAt: '2023-08-15T00:00:00Z',
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ trainer: mockTrainer }),
      });

      const result = await getTrainerById('1');

      expect(fetch).toHaveBeenCalledWith('/api/trainers/getById?id=1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockTrainer);
      expect(result.clients).toHaveLength(2);
      expect(result.mealPlans).toHaveLength(2);
      expect(result.workoutId).toBe('workout123');
    });

    it('should fetch trainer with no clients', async () => {
      const mockTrainer: TrainerWithDetails = {
        id: '2',
        name: 'New Trainer',
        firstName: 'New',
        lastName: 'Trainer',
        email: 'new@example.com',
        userId: 'user2',
        clientCount: 0,
        hireDate: '2024-01-01',
        phone: '555-0300',
        specialization: 'Yoga',
        rating: 5.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        mealPlans: [],
        clients: [],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ trainer: mockTrainer }),
      });

      const result = await getTrainerById('2');

      expect(result.clients).toHaveLength(0);
      expect(result.clientCount).toBe(0);
    });

    it('should throw error when trainer not found', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Trainer not found' }),
      });

      await expect(getTrainerById('999')).rejects.toThrow('Trainer not found');
    });

    it('should handle invalid trainer id format', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid trainer ID format' }),
      });

      await expect(getTrainerById('invalid-id')).rejects.toThrow(
        'Invalid trainer ID format'
      );
    });
  });

  describe('updateTrainer', () => {
    it('should update trainer successfully with all fields', async () => {
      const updates = {
        firstName: 'John',
        lastName: 'Updated',
        email: 'john.updated@example.com',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await updateTrainer('trainer1', 'user1', updates);

      expect(fetch).toHaveBeenCalledWith('/api/trainers/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'trainer1',
          userId: 'user1',
          ...updates,
        }),
      });
    });

    it('should update trainer with only firstName', async () => {
      const updates = {
        firstName: 'John',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await updateTrainer('trainer1', 'user1', updates);

      expect(fetch).toHaveBeenCalledWith('/api/trainers/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'trainer1',
          userId: 'user1',
          firstName: 'John',
        }),
      });
    });

    it('should update trainer with only lastName', async () => {
      const updates = {
        lastName: 'Smith',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await updateTrainer('trainer1', 'user1', updates);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body).toEqual({
        id: 'trainer1',
        userId: 'user1',
        lastName: 'Smith',
      });
    });

    it('should update trainer with only email', async () => {
      const updates = {
        email: 'newemail@example.com',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await updateTrainer('trainer1', 'user1', updates);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body).toEqual({
        id: 'trainer1',
        userId: 'user1',
        email: 'newemail@example.com',
      });
    });

    it('should throw error when update fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Update failed' }),
      });

      await expect(
        updateTrainer('trainer1', 'user1', { firstName: 'John' })
      ).rejects.toThrow('Update failed');
    });

    it('should throw error when email already exists', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email already in use' }),
      });

      await expect(
        updateTrainer('trainer1', 'user1', { email: 'existing@example.com' })
      ).rejects.toThrow('Email already in use');
    });

    it('should throw error when trainer not found', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Trainer not found' }),
      });

      await expect(
        updateTrainer('invalid', 'user1', { firstName: 'John' })
      ).rejects.toThrow('Trainer not found');
    });
  });

  describe('deleteTrainer', () => {
    it('should delete trainer successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await deleteTrainer('trainer1');

      expect(fetch).toHaveBeenCalledWith('/api/trainers/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: 'trainer1' }),
      });
    });

    it('should throw error when trainer not found', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Trainer not found' }),
      });

      await expect(deleteTrainer('invalid')).rejects.toThrow('Trainer not found');
    });

    it('should throw error when trainer has active clients', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Cannot delete trainer with active clients' }),
      });

      await expect(deleteTrainer('trainer1')).rejects.toThrow(
        'Cannot delete trainer with active clients'
      );
    });

    it('should throw default error when deletion fails without message', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(deleteTrainer('trainer1')).rejects.toThrow(
        'Failed to delete trainer'
      );
    });
  });

  describe('getTrainerByEmail', () => {
    it('should fetch trainer by email successfully', async () => {
      const mockTrainer: TrainerWithDetails = {
        id: '1',
        name: 'John Trainer',
        firstName: 'John',
        lastName: 'Trainer',
        email: 'john.trainer@example.com',
        userId: 'user1',
        clientCount: 2,
        hireDate: '2023-01-15',
        phone: '555-0100',
        specialization: 'Strength Training',
        rating: 4.8,
        createdAt: '2023-01-15T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        mealPlans: [],
        clients: [
          {
            id: 'c1',
            name: 'Client One',
            firstName: 'Client',
            lastName: 'One',
            email: 'client1@example.com',
            userId: 'cu1',
            workoutCount: 10,
            mealPlanCount: 2,
            joinDate: '2023-06-01',
            createdAt: '2023-06-01T00:00:00Z',
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrainer,
      });

      const result = await getTrainerByEmail('john.trainer@example.com');

      expect(fetch).toHaveBeenCalledWith(
        '/api/trainers/getByEmail?email=john.trainer%40example.com',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockTrainer);
      expect(result.email).toBe('john.trainer@example.com');
    });

    it('should properly encode email with special characters', async () => {
      const mockTrainer: TrainerWithDetails = {
        id: '1',
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        email: 'test+trainer@example.com',
        userId: 'user1',
        clientCount: 0,
        hireDate: '2023-01-15',
        phone: '555-0100',
        specialization: 'General',
        rating: 4.5,
        createdAt: '2023-01-15T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        mealPlans: [],
        clients: [],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrainer,
      });

      await getTrainerByEmail('test+trainer@example.com');

      expect(fetch).toHaveBeenCalledWith(
        '/api/trainers/getByEmail?email=test%2Btrainer%40example.com',
        expect.any(Object)
      );
    });

    it('should throw error when trainer not found by email', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Trainer not found' }),
      });

      await expect(
        getTrainerByEmail('nonexistent@example.com')
      ).rejects.toThrow('Trainer not found');
    });

    it('should throw error for invalid email format', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid email format' }),
      });

      await expect(getTrainerByEmail('invalid-email')).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should throw default error when no error message provided', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(
        getTrainerByEmail('test@example.com')
      ).rejects.toThrow('Failed to fetch trainer');
    });
  });

  describe('Network and Edge Cases', () => {
    it('should handle network errors in getAllTrainers', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(getAllTrainers()).rejects.toThrow('Network error');
    });

    it('should handle network errors in getTrainerById', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Connection timeout')
      );

      await expect(getTrainerById('1')).rejects.toThrow('Connection timeout');
    });

    it('should handle network errors in updateTrainer', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        updateTrainer('1', 'user1', { firstName: 'John' })
      ).rejects.toThrow('Network error');
    });

    it('should handle network errors in deleteTrainer', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(deleteTrainer('1')).rejects.toThrow('Network error');
    });

    it('should handle network errors in getTrainerByEmail', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(getTrainerByEmail('test@example.com')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle malformed JSON responses', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(getAllTrainers()).rejects.toThrow('Invalid JSON');
    });

    it('should handle unexpected response structure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unexpected: 'structure' }),
      });

      const result = await getAllTrainers();
      
      expect(result).toBeUndefined();
    });
  });
});