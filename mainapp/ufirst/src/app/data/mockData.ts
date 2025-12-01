export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  membershipType: 'Premium' | 'VIP';
  avatar?: string;
}

export interface Report {
  id: string;
  title: string;
  type: 'progress' | 'attendance' | 'billing' | 'performance';
  date: string;
  status: 'completed' | 'pending' | 'draft';
  clientId?: string;
}

export interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  hireDate: string;
  clientCount: number;
  rating: number;
  avatar?: string;
  clients: Client[];
  reports: Report[];
}

export const mockTrainers: Trainer[] = [
  {
    id: 'T001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@ufirst.com',
    phone: '(555) 123-4567',
    specialization: 'Strength & Conditioning',
    hireDate: '2022-03-15',
    clientCount: 28,
    rating: 4.9,
    clients: [
      {
        id: 'C001',
        name: 'Mike Anderson',
        email: 'mike.a@email.com',
        phone: '(555) 234-5678',
        joinDate: '2024-01-10',
        membershipType: 'Premium'
      },
      {
        id: 'C002',
        name: 'Emily Davis',
        email: 'emily.d@email.com',
        phone: '(555) 345-6789',
        joinDate: '2024-02-20',
        membershipType: 'VIP'
      },
      {
        id: 'C003',
        name: 'James Wilson',
        email: 'james.w@email.com',
        phone: '(555) 456-7890',
        joinDate: '2024-03-05',
        membershipType: 'Premium'
      }
    ],
    reports: [
      {
        id: 'R001',
        title: 'September Performance Review',
        type: 'performance',
        date: '2024-09-30',
        status: 'completed',
        clientId: 'C001'
      },
      {
        id: 'R002',
        title: 'Weekly Attendance Report',
        type: 'attendance',
        date: '2024-10-05',
        status: 'completed'
      }
    ]
  },
  {
    id: 'T002',
    name: 'Marcus Rodriguez',
    email: 'marcus.r@ufirst.com',
    phone: '(555) 234-5678',
    specialization: 'HIIT & Cardio',
    hireDate: '2021-07-20',
    clientCount: 35,
    rating: 4.8,
    clients: [
      {
        id: 'C004',
        name: 'Lisa Thompson',
        email: 'lisa.t@email.com',
        phone: '(555) 567-8901',
        joinDate: '2023-11-15',
        membershipType: 'Premium'
      },
      {
        id: 'C005',
        name: 'David Chen',
        email: 'david.c@email.com',
        phone: '(555) 678-9012',
        joinDate: '2024-01-08',
        membershipType: 'VIP'
      },
      {
        id: 'C006',
        name: 'Rachel Green',
        email: 'rachel.g@email.com',
        phone: '(555) 789-0123',
        joinDate: '2024-04-12',
        membershipType: 'Premium'
      }
    ],
    reports: [
      {
        id: 'R003',
        title: 'Q3 Client Progress Summary',
        type: 'progress',
        date: '2024-09-28',
        status: 'completed'
      },
      {
        id: 'R004',
        title: 'October Revenue Forecast',
        type: 'billing',
        date: '2024-10-01',
        status: 'pending'
      }
    ]
  },
  {
    id: 'T003',
    name: 'Amanda Lee',
    email: 'amanda.l@ufirst.com',
    phone: '(555) 345-6789',
    specialization: 'Yoga & Flexibility',
    hireDate: '2023-01-10',
    clientCount: 22,
    rating: 5.0,
    clients: [
      {
        id: 'C007',
        name: 'Sofia Martinez',
        email: 'sofia.m@email.com',
        phone: '(555) 890-1234',
        joinDate: '2024-05-22',
        membershipType: 'Premium'
      },
      {
        id: 'C008',
        name: 'Tom Bradley',
        email: 'tom.b@email.com',
        phone: '(555) 901-2345',
        joinDate: '2024-06-15',
        membershipType: 'Premium'
      },
      {
        id: 'C009',
        name: 'Nina Patel',
        email: 'nina.p@email.com',
        phone: '(555) 012-3456',
        joinDate: '2024-10-08',
        membershipType: 'Premium'
      }
    ],
    reports: [
      {
        id: 'R005',
        title: 'Client Wellness Assessment',
        type: 'progress',
        date: '2024-09-25',
        status: 'completed',
        clientId: 'C007'
      },
      {
        id: 'R006',
        title: 'Monthly Class Attendance',
        type: 'attendance',
        date: '2024-10-01',
        status: 'draft'
      }
    ]
  },
  {
    id: 'T004',
    name: 'Kevin Murphy',
    email: 'kevin.m@ufirst.com',
    phone: '(555) 456-7890',
    specialization: 'CrossFit & Functional Training',
    hireDate: '2022-09-05',
    clientCount: 31,
    rating: 4.7,
    clients: [
      {
        id: 'C010',
        name: 'Alex Turner',
        email: 'alex.t@email.com',
        phone: '(555) 123-4567',
        joinDate: '2023-12-10',
        membershipType: 'VIP'
      },
      {
        id: 'C011',
        name: 'Jessica Brown',
        email: 'jessica.b@email.com',
        phone: '(555) 234-5678',
        joinDate: '2024-02-28',
        membershipType: 'Premium'
      }
    ],
    reports: [
      {
        id: 'R007',
        title: 'Weekly Performance Metrics',
        type: 'performance',
        date: '2024-10-07',
        status: 'completed'
      }
    ]
  },
  {
    id: 'T005',
    name: 'Priya Sharma',
    email: 'priya.s@ufirst.com',
    phone: '(555) 567-8901',
    specialization: 'Pilates & Core Training',
    hireDate: '2023-06-12',
    clientCount: 19,
    rating: 4.9,
    clients: [
      {
        id: 'C012',
        name: 'Oliver White',
        email: 'oliver.w@email.com',
        phone: '(555) 345-6789',
        joinDate: '2024-07-10',
        membershipType: 'Premium'
      }
    ],
    reports: [
      {
        id: 'R008',
        title: 'End of Quarter Summary',
        type: 'progress',
        date: '2024-09-30',
        status: 'completed'
      }
    ]
  }
];

// Helper function to get all clients across all trainers
export const getAllClients = (): (Client & { trainer: { id: string; name: string; specialization: string } })[] => {
  return mockTrainers.flatMap(trainer => 
    trainer.clients.map(client => ({
      ...client,
      trainer: {
        id: trainer.id,
        name: trainer.name,
        specialization: trainer.specialization
      }
    }))
  );
};

// Helper function to get clients by trainer ID
export const getClientsByTrainerId = (trainerId: string): Client[] => {
  const trainer = mockTrainers.find(t => t.id === trainerId);
  return trainer?.clients || [];
};

// Helper function to get trainer by client ID
export const getTrainerByClientId = (clientId: string): Trainer | undefined => {
  return mockTrainers.find(trainer => 
    trainer.clients.some(client => client.id === clientId)
  );
};
