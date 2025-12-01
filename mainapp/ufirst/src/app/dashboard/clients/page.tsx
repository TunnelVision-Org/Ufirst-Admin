'use client';

import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { UserCircle, Plus, Search, Mail, Calendar, TrendingUp, MoreVertical, Trash2, X, Check, AlertTriangle, CheckCircle, Eye, Dumbbell, UtensilsCrossed, Scale } from 'lucide-react';
import { getAllClients, updateClient, deleteClient, type ClientWithDetails } from '@/lib/api/clients';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{name: string; email: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ClientWithDetails | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    client: ClientWithDetails | null;
    isDeleting: boolean;
  }>({ isOpen: false, client: null, isDeleting: false });

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllClients();
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirmation = (client: ClientWithDetails) => {
    setDeleteConfirmation({ isOpen: true, client, isDeleting: false });
  };

  const closeDeleteConfirmation = () => {
    if (!deleteConfirmation.isDeleting) {
      setDeleteConfirmation({ isOpen: false, client: null, isDeleting: false });
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirmation.client) return;

    setDeleteConfirmation(prev => ({ ...prev, isDeleting: true }));

    try {
      await deleteClient(deleteConfirmation.client.id);
      setClients(clients.filter(c => c.id !== deleteConfirmation.client!.id));
      setDeleteConfirmation({ isOpen: false, client: null, isDeleting: false });
      
      // Show success notification
      setNotification({ message: 'Client deleted successfully', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ message: err instanceof Error ? err.message : 'Failed to delete client', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      setDeleteConfirmation(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleEdit = (client: ClientWithDetails) => {
    setEditingClientId(client.id);
    setEditForm({
      name: client.name,
      email: client.email,
    });
  };

  const handleSave = async (clientId: string) => {
    if (!editForm) return;

    try {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      const [firstName, ...lastNameParts] = editForm.name.split(' ');
      const lastName = lastNameParts.join(' ');

      await updateClient(clientId, client.userId, {
        firstName,
        lastName,
        email: editForm.email,
      });

      // Update local state
      setClients(clients.map(c => 
        c.id === clientId 
          ? { ...c, name: editForm.name, email: editForm.email, firstName, lastName }
          : c
      ));
      setEditingClientId(null);
      setEditForm(null);
      
      // Show success notification
      setNotification({ message: 'Client updated successfully', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ message: err instanceof Error ? err.message : 'Failed to update client', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleCancel = () => {
    setEditingClientId(null);
    setEditForm(null);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.trainerName && client.trainerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.workoutCount > 0 || c.mealPlanCount > 0).length;
  const totalWorkouts = clients.reduce((sum, c) => sum + c.workoutCount, 0);

  // Notification Toast Component
  const NotificationToast = () => {
    if (!notification) return null;
    
    return (
      <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border",
          notification.type === 'success' 
            ? "bg-green-50 border-green-200 text-green-800" 
            : "bg-red-50 border-red-200 text-red-800"
        )}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          )}
          <p className="font-medium text-sm">{notification.message}</p>
          <button 
            onClick={() => setNotification(null)}
            className="ml-2 hover:opacity-70 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout userName="Admin">
      <NotificationToast />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="text-black mt-1">Manage your fitness center members</p>
          </div>
          {/* <Button className="bg-[#3C4526] hover:bg-[#2d331c]">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button> */}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalClients}</div>
              <p className="text-xs text-black mt-1">All members</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Active Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{activeClients}</div>
              <p className="text-xs text-black mt-1">With workouts/meals</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Total Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalWorkouts}</div>
              <p className="text-xs text-black mt-1">Across all clients</p>
            </CardContent>
          </Card>
        </div>

        {/* Clients List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between text-black">
              <div>
                <CardTitle>All Clients</CardTitle>
                <CardDescription>A list of all members in your fitness center</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 text-black border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C4526] w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3C4526] mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading clients...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-2">Failed to load clients</p>
                  <p className="text-sm text-black mb-4">{error}</p>
                  <Button onClick={fetchClients} variant="outline">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <UserCircle className="h-12 w-12 text-black mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-2">No clients found</p>
                  <p className="text-sm text-black mb-4">
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
                {filteredClients.map((client) => {
                  const isEditing = editingClientId === client.id;
                  
                  return (
                  <Card key={client.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-[#3C4526] text-white font-semibold">
                              {(isEditing ? editForm?.name : client.name)?.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm?.name || ''}
                                onChange={(e) => setEditForm(editForm ? {...editForm, name: e.target.value} : null)}
                                className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3C4526]"
                                placeholder="Name"
                              />
                            ) : (
                              <>
                                <h3 className="font-semibold text-gray-900">{client.name}</h3>
                                <div className="flex gap-2 mt-1">
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                                    {client.workoutCount} Workouts
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                                    {client.mealPlanCount} Meals
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 text-green-600 hover:bg-green-50"
                              onClick={() => handleSave(client.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                              onClick={handleCancel}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEdit(client)}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        {isEditing ? (
                          <>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-black" />
                              <input
                                type="email"
                                value={editForm?.email || ''}
                                onChange={(e) => setEditForm(editForm ? {...editForm, email: e.target.value} : null)}
                                className="flex-1 px-2 py-1 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3C4526]"
                                placeholder="Email"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span className="truncate">{client.email}</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="border-t pt-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-[#3C4526] text-white text-xs">
                              {client.trainerName ? client.trainerName.split(' ').map((n: string) => n[0]).join('') : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs text-black">Trainer</p>
                            <p className="text-sm font-medium text-gray-900">{client.trainerName || 'Unassigned'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between pt-3 border-t">
                        <div>
                          <p className="text-xs text-black">Weight Trends</p>
                          <p className="text-sm font-medium text-gray-900">{client.weightTrendCount} records</p>
                        </div>
                        <div>
                          <p className="text-xs text-black">Created</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          className="flex-1" 
                          size="sm"
                          onClick={() => setSelectedProfile(client)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 text-red-600 hover:bg-red-50 border-red-200" 
                          size="sm"
                          onClick={() => openDeleteConfirmation(client)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Profile Modal */}
        {selectedProfile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedProfile(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-[#3C4526] to-[#2d331c] p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-white/20">
                      <AvatarFallback className="bg-white/20 text-white font-semibold">
                        {selectedProfile.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-lg font-semibold">{selectedProfile.name}</h2>
                      <p className="text-sm text-white/80">{selectedProfile.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20"
                    onClick={() => setSelectedProfile(null)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto max-h-[calc(85vh-120px)]">
                {/* Trainer Info */}
                {selectedProfile.trainerName && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Assigned Trainer</p>
                    <p className="font-medium text-gray-900">{selectedProfile.trainerName}</p>
                  </div>
                )}

                {/* Records Summary */}
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Client Records</h3>
                <div className="space-y-3">
                  {/* Workouts */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Dumbbell className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Workouts</p>
                        <p className="text-xs text-gray-500">Training sessions completed</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">{selectedProfile.workoutCount}</span>
                  </div>

                  {/* Meal Plans */}
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <UtensilsCrossed className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Meal Plans</p>
                        <p className="text-xs text-gray-500">Active nutrition plans</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-green-600">{selectedProfile.mealPlanCount}</span>
                  </div>

                  {/* Weight Trends */}
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Scale className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Weight Trends</p>
                        <p className="text-xs text-gray-500">Progress tracking entries</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-purple-600">{selectedProfile.weightTrendCount}</span>
                  </div>
                </div>

                {/* Account Info */}
                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Member Since</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedProfile.createdAt).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        selectedProfile.workoutCount > 0 || selectedProfile.mealPlanCount > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      )}>
                        {selectedProfile.workoutCount > 0 || selectedProfile.mealPlanCount > 0 ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t bg-gray-50">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setSelectedProfile(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.isOpen && deleteConfirmation.client && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Client</h3>
                  <p className="text-sm text-black">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-700 mb-2">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold">{deleteConfirmation.client.name}</span>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> This will permanently delete:
                  </p>
                  <ul className="text-sm text-red-700 mt-2 ml-4 list-disc space-y-1">
                    <li>Client profile and account</li>
                    <li>{deleteConfirmation.client.workoutCount} workout records</li>
                    <li>{deleteConfirmation.client.mealPlanCount} meal plans</li>
                    <li>{deleteConfirmation.client.weightTrendCount} weight trend entries</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={closeDeleteConfirmation}
                  disabled={deleteConfirmation.isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDeleteConfirmed}
                  disabled={deleteConfirmation.isDeleting}
                >
                  {deleteConfirmation.isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Client
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
