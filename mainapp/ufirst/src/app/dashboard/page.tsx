'use client';

import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Users, UserCircle, FileText, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total Trainers',
      value: '24',
      description: '+2 from last month',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Clients',
      value: '156',
      description: '+12 from last month',
      icon: UserCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active Reports',
      value: '8',
      description: '+3 from last week',
      icon: FileText,
      color: 'text-black-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Growth Rate',
      value: '12%',
      description: '+4% from last month',
      icon: TrendingUp,
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
              <p className="text-sm opacity-75 mt-2">Ready to manage your fitness center</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <CardDescription className="text-xs mt-1">
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
          <CardDescription className='text-gray-900'>Manage your fitness center efficiently</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/dashboard/trainers"
              className="p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer text-center"
            >
              <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="font-semibold text-gray-900">Manage Trainers</p>
              <p className="text-xs text-gray-500 mt-1">Add or edit trainer profiles</p>
            </a>
            <a
              href="/dashboard/clients"
              className="p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all cursor-pointer text-center"
            >
              <UserCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="font-semibold text-gray-900">Manage Clients</p>
              <p className="text-xs text-gray-500 mt-1">View and manage client data</p>
            </a>
            <a
              href="/dashboard/reports"
              className="p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer text-center"
            >
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="font-semibold text-gray-900">View Reports</p>
              <p className="text-xs text-gray-500 mt-1">Access analytics and insights</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
