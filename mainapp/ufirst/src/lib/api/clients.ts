/**
 * Client API Functions
 * Frontend helper functions for client management
 */

export interface Client {
  id: string;
  userId: string;
  trainerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientWithDetails extends Client {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  trainerName?: string;
  workoutCount: number;
  mealPlanCount: number;
  weightTrendCount: number;
}

/**
 * Fetch all clients from the API
 */
export async function getAllClients(): Promise<ClientWithDetails[]> {
  const response = await fetch('/api/clients/getAll', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = 'Failed to fetch clients';
    try {
      const error = await response.json();
      if (error && error.error){
        errorMessage = error.error;
      }
    } catch (e) {

    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.clients;
}

/**
 * Fetch single client by ID with full details
 */
export async function getClientById(id: string): Promise<ClientWithDetails> {
  const response = await fetch(`/api/clients/getById?id=${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch client');
  }

  const data = await response.json();
  return data.client;
}

/**
 * Fetch clients by trainer ID
 */
export async function getClientsByTrainer(trainerId: string): Promise<ClientWithDetails[]> {
  const response = await fetch(`/api/clients/getByTrainer?trainerId=${trainerId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch clients for trainer');
  }

  const data = await response.json();
  return data.clients;
}

/**
 * Create new client
 */
export async function createClient(data: {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  trainerId?: string;
}): Promise<ClientWithDetails> {
  const response = await fetch('/api/clients/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create client');
  }

  const result = await response.json();
  return result.client;
}

/**
 * Update client information
 */
export async function updateClient(
  clientId: string,
  userId: string,
  updates: {
    firstName?: string;
    lastName?: string;
    email?: string;
    trainerId?: string;
  }
): Promise<void> {
  const response = await fetch('/api/clients/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clientId, userId, ...updates }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update client');
  }
}

/**
 * Delete client from system (cascades to user)
 */
export async function deleteClient(id: string): Promise<void> {
  const response = await fetch('/api/clients/delete', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete client');
  }
}

/**
 * Assign client to trainer
 */
export async function assignClientToTrainer(
  clientId: string,
  trainerId: string
): Promise<void> {
  const response = await fetch('/api/clients/assignTrainer', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clientId, trainerId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to assign trainer');
  }
}

/**
 * Remove trainer from client
 */
export async function removeTrainerFromClient(clientId: string): Promise<void> {
  const response = await fetch('/api/clients/removeTrainer', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clientId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove trainer');
  }
}
