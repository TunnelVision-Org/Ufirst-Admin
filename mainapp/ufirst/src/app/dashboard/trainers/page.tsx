'use client';

import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Plus, UserPlus, Users, TrendingUp, Award, Phone, Mail, MoreVertical, Search } from 'lucide-react';
import { mockTrainers } from '@/app/data/mockData';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function TrainersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTrainers = mockTrainers.filter(trainer =>
    trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trainer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trainer.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTrainers = mockTrainers.length;
  const totalClients = mockTrainers.reduce((sum, t) => sum + t.clientCount, 0);
  const avgRating = (mockTrainers.reduce((sum, t) => sum + t.rating, 0) / totalTrainers).toFixed(1);

  return (
    <DashboardLayout userName="Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trainers</h1>
            <p className="text-gray-500 mt-1">Manage your fitness training staff</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search trainers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] w-64"
              />
            </div>
            <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED]">
              <Plus className="h-4 w-4 mr-2" />
              Add Trainer
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Trainers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalTrainers}</div>
              <p className="text-xs text-gray-500 mt-1">Active trainers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalClients}</div>
              <p className="text-xs text-gray-500 mt-1">Across all trainers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg. Load
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{Math.round(totalClients / totalTrainers)}</div>
              <p className="text-xs text-gray-500 mt-1">Clients per trainer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Avg. Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{avgRating}</div>
              <p className="text-xs text-gray-500 mt-1">Out of 5.0 stars</p>
            </CardContent>
          </Card>
        </div>

        {/* Trainers Grid */}
        {filteredTrainers.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center text-center">
                <Users className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No trainers found</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm">
                  {searchQuery 
                    ? `No trainers match "${searchQuery}". Try adjusting your search.`
                    : 'Get started by adding your first trainer to the system.'
                  }
                </p>
                {searchQuery ? (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                ) : (
                  <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Trainer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTrainers.map((trainer) => (
              <Card key={trainer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-[#8B5CF6] text-white text-lg font-semibold">
                        {trainer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{trainer.name}</h3>
                      <p className="text-sm text-gray-500">{trainer.specialization}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{trainer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{trainer.phone}</span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-500">Clients</p>
                    <p className="text-xl font-bold text-gray-900">{trainer.clientCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">This Week</p>
                    <p className="text-xl font-bold text-gray-900">{trainer.sessionsThisWeek}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Rating</p>
                    <p className="text-xl font-bold text-gray-900">{trainer.rating} ⭐</p>
                  </div>
                </div>

                {/* Clients Preview */}
                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-2">Recent Clients</p>
                  <div className="flex -space-x-2">
                    {trainer.clients.slice(0, 5).map((client) => (
                      <Avatar key={client.id} className="h-8 w-8 border-2 border-white">
                        <AvatarFallback className="bg-gray-300 text-gray-700 text-xs">
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {trainer.clients.length > 5 && (
                      <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                        <span className="text-xs text-gray-600 font-medium">
                          +{trainer.clients.length - 5}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" size="sm">
                    View Clients
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm">
                    View Reports ({trainer.reports.length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}
      </div>
    </DashboardLayout>
  );
}
