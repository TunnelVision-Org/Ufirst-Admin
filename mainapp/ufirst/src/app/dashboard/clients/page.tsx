'use client';

import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { UserCircle, Plus, Search, Phone, Mail, Calendar, TrendingUp, MoreVertical } from 'lucide-react';
import { getAllClients } from '@/app/data/mockData';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function ClientsPage() {
  const allClients = getAllClients();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = allClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.trainer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalClients = allClients.length;
  const newThisWeek = allClients.filter(c => {
    const joinDate = new Date(c.joinDate);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return joinDate >= weekAgo;
  }).length;
  const avgAttendance = Math.round(
    allClients.reduce((sum, c) => sum + c.sessionsCompleted, 0) / totalClients
  );

  const getMembershipColor = (type: string) => {
    switch (type) {
      case 'VIP': return 'bg-purple-100 text-purple-700';
      case 'Premium': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <DashboardLayout userName="Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-500 mt-1">Manage your fitness center members</p>
          </div>
          <Button className="bg-[#3C4526] hover:bg-[#2d331c]">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalClients}</div>
              <p className="text-xs text-gray-500 mt-1">{newThisWeek} new this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalClients}</div>
              <p className="text-xs text-gray-500 mt-1">All members</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                New This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{newThisWeek}</div>
              <p className="text-xs text-gray-500 mt-1">Joined recently</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg. Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{avgAttendance}</div>
              <p className="text-xs text-gray-500 mt-1">Per client</p>
            </CardContent>
          </Card>
        </div>

        {/* Clients List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Clients</CardTitle>
                <CardDescription>A list of all members in your fitness center</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredClients.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <UserCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-2">No clients found</p>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchQuery ? 'Try adjusting your search' : 'Start by adding your first client'}
                  </p>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredClients.map((client) => (
                  <Card key={client.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-[#8B5CF6] text-white font-semibold">
                              {client.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{client.name}</h3>
                            <div className="flex gap-2 mt-1">
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                getMembershipColor(client.membershipType)
                              )}>
                                {client.membershipType}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{client.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{client.phone}</span>
                        </div>
                      </div>

                      <div className="border-t pt-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-[#3C4526] text-white text-xs">
                              {client.trainer.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs text-gray-500">Trainer</p>
                            <p className="text-sm font-medium text-gray-900">{client.trainer.name}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">{client.trainer.specialization}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                        <div>
                          <p className="text-xs text-gray-500">Joined</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(client.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Sessions</p>
                          <p className="text-sm font-medium text-gray-900">{client.sessionsCompleted}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Last Visit</p>
                          <p className="text-sm font-medium text-gray-900">
                            {client.lastSession 
                              ? new Date(client.lastSession).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" className="flex-1" size="sm">
                          View Profile
                        </Button>
                        <Button variant="outline" className="flex-1" size="sm">
                          Schedule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
