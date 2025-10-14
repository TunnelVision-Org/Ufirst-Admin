export interface Trainer {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  userId: string;
  clientCount: number;
  hireDate: string;
  phone: string;
  specialization: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrainerWithDetails extends Trainer {
  workoutId?: string;
  mealPlans: any[];
  clients: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    userId: string;
  }[];
}

/**
 * Fetch all trainers from the API
 */
export async function getAllTrainers(): Promise<Trainer[]> {
  const response = await fetch('/api/trainers/getAll', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch trainers');
  }

  const data = await response.json();
  return data.trainers;
}

/**
 * Fetch single trainer by ID with full details
 */
export async function getTrainerById(id: string): Promise<TrainerWithDetails> {
  const response = await fetch(`/api/trainers/getById?id=${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch trainer');
  }

  const data = await response.json();
  return data.trainer;
}

/**
 * Update trainer information
 */
export async function updateTrainer(
  id: string,
  userId: string,
  updates: { firstName?: string; lastName?: string; email?: string }
): Promise<void> {
  const response = await fetch('/api/trainers/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, userId, ...updates }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update trainer');
  }
}

/**
 * Delete trainer from system
 */
export async function deleteTrainer(id: string): Promise<void> {
  const response = await fetch('/api/trainers/delete', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete trainer');
  }
}
