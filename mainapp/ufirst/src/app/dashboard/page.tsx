'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import ClientCard from '../components/ClientCard';
import { Users, UserCircle, FileText, TrendingUp, AlertTriangle } from 'lucide-react';
import { getAllTrainers } from '@/lib/api/trainers';
import { getAllClients } from '@/lib/api/clients';
import { getTrainerByEmail } from '@/lib/api/trainers';
import { getCurrentUser, isCurrentUserAdmin, getUserFullName } from '@/lib/auth';
import type { TrainerWithDetails } from '@/lib/api/trainers';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [trainerData, setTrainerData] = useState<TrainerWithDetails | null>(null);
  
  const [dashboardData, setDashboardData] = useState({
    totalTrainers: 0,
    totalClients: 0,
    totalClientsAssigned: 0,
    avgClientsPerTrainer: 0,
    totalWorkouts: 0,
    totalMealPlans: 0,
    activeClients: 0,
  });

  useEffect(() => {
    // Check authentication and user role
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    
    setCurrentUser(user);
    setIsAdmin(isCurrentUserAdmin());
    
    if (isCurrentUserAdmin()) {
      fetchAdminDashboardData();
    } else {
      fetchTrainerDashboardData(user.email);
    }
  }, [router]);

  const fetchAdminDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [trainers, clients] = await Promise.all([
        getAllTrainers(),
        getAllClients(),
      ]);

      const totalClientsAssigned = trainers.reduce((sum, t) => sum + t.clientCount, 0);
      const avgClientsPerTrainer = trainers.length > 0 
        ? Math.round(totalClientsAssigned / trainers.length) 
        : 0;
      const totalWorkouts = clients.reduce((sum, c) => sum + c.workoutCount, 0);
      const totalMealPlans = clients.reduce((sum, c) => sum + c.mealPlanCount, 0);
      const activeClients = clients.filter(c => c.workoutCount > 0 || c.mealPlanCount > 0).length;

      setDashboardData({
        totalTrainers: trainers.length,
        totalClients: clients.length,
        totalClientsAssigned,
        avgClientsPerTrainer,
        totalWorkouts,
        totalMealPlans,
        activeClients,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainerDashboardData = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      const trainer = await getTrainerByEmail(email);
      setTrainerData(trainer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your trainer profile');
      console.error('Error fetching trainer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render admin dashboard
  if (isAdmin) {
    const stats = [
      {
        title: 'Total Trainers',
        value: loading ? '...' : dashboardData.totalTrainers.toString(),
        description: `Avg ${dashboardData.avgClientsPerTrainer} clients each`,
        icon: Users,
        color: 'text-gray-600',
        bgColor: 'bg-blue-50',
      },
      {
        title: 'Total Clients',
        value: loading ? '...' : dashboardData.totalClients.toString(),
        description: `${dashboardData.activeClients} active clients`,
        icon: UserCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      },
      {
        title: 'Total Workouts',
        value: loading ? '...' : dashboardData.totalWorkouts.toString(),
        description: 'Across all clients',
        icon: TrendingUp,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      },
      {
        title: 'Meal Plans',
        value: loading ? '...' : dashboardData.totalMealPlans.toString(),
        description: 'Active meal plans',
        icon: FileText,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      },
    ];

    return (
      <DashboardLayout userName="Admin">
        {/* Welcome Card */}
        <Card className="mb-8 bg-gradient-to-br from-[#3C4526] to-[#2a3119] border-none">
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 border-4 border-white/20">
                <AvatarFallback className="bg-white/10 text-white text-3xl font-bold">
                  A
                </AvatarFallback>
              </Avatar>
              <div className="text-white">
                <p className="text-lg font-light italic opacity-90">Welcome back,</p>
                <h1 className="text-4xl font-bold mt-1">Admin</h1>
                <p className="text-sm opacity-75 mt-2">
                  {loading ? 'Loading dashboard...' : 'Ready to manage your fitness center'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="mb-8 bg-red-50 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">Failed to load dashboard data</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <button
                    onClick={fetchAdminDashboardData}
                    className="text-sm text-red-600 underline hover:text-red-800 mt-2"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-9 w-16 rounded"></div>
                  ) : (
                    stat.value
                  )}
                </div>
                <CardDescription className="text-xs mt-1 text-black">
                  {stat.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Quick Actions</CardTitle>
            <CardDescription className='text-black'>Manage your fitness center efficiently</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/dashboard/trainers"
                className="p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer text-center"
              >
                <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="font-semibold text-gray-900">Manage Trainers</p>
                <p className="text-xs text-black mt-1">Add or edit trainer profiles</p>
              </a>
              <a
                href="/dashboard/clients"
                className="p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all cursor-pointer text-center"
              >
                <UserCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="font-semibold text-gray-900">Manage Clients</p>
                <p className="text-xs text-black mt-1">View and manage client data</p>
              </a>
              <a
                href="/dashboard/reports"
                className="p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer text-center"
              >
                <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold text-gray-900">View Reports</p>
                <p className="text-xs text-black mt-1">Access analytics and insights</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Render trainer dashboard
  const userName = currentUser ? getUserFullName(currentUser) : 'Trainer';
  const userInitials = currentUser 
    ? `${currentUser.firstName[0] || ''}${currentUser.lastName[0] || ''}`.toUpperCase()
    : 'T';

  return (
    <DashboardLayout userName={userName}>
      {/* Welcome Banner */}
      <Card className="mb-8 bg-gradient-to-br from-[#3C4526] to-[#2a3119] border-none">
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-4 border-white/20">
              <AvatarFallback className="bg-white/10 text-white text-3xl font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="text-white">
              <p className="text-lg font-light italic opacity-90">Welcome back,</p>
              <h1 className="text-4xl font-bold mt-1">{userName}</h1>
              <p className="text-sm opacity-75 mt-2">
                {loading ? 'Loading your clients...' : `You have ${trainerData?.clients?.length || 0} client${trainerData?.clients?.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-8 bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Failed to load your dashboard</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={() => currentUser && fetchTrainerDashboardData(currentUser.email)}
                  className="text-sm text-red-600 underline hover:text-red-800 mt-2"
                >
                  Try again
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3C4526] mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading your clients...</p>
            </div>
          </CardContent>
        </Card>
      ) : trainerData?.clients && trainerData.clients.length > 0 ? (
        /* Clients Grid */
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Clients</h2>
            <p className="text-black mt-1">Manage and track your client's progress</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainerData.clients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Users className="h-16 w-16 text-black mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Clients Yet</h3>
              <p className="text-sm text-black mb-6 max-w-sm mx-auto">
                You don't have any clients assigned yet. Contact your administrator to get clients assigned to you.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
