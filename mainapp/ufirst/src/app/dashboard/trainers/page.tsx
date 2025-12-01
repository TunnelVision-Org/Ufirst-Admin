'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { UserPlus, Users, TrendingUp, Mail, MoreVertical, Search, X, Calendar, AlertTriangle, Trash2, Check, FileText, CheckCircle } from 'lucide-react';
import { getAllTrainers, updateTrainer, deleteTrainer, getTrainerById, type Trainer, type TrainerWithDetails } from '@/lib/api/trainers';
import { cn } from '@/lib/utils';

export default function TrainersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerWithDetails | null>(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTrainerId, setEditingTrainerId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{name: string; specialization: string; email: string} | null>(null);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    trainer: Trainer | null;
    isDeleting: boolean;
  }>({ isOpen: false, trainer: null, isDeleting: false });

  // Fetch trainers on component mount
  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllTrainers();
      setTrainers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trainers');
      console.error('Error fetching trainers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrainers = trainers.filter(trainer =>
    trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trainer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (trainer.specialization && trainer.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalTrainers = trainers.length;
  const totalClients = trainers.reduce((sum, t) => sum + t.clientCount, 0);

  const handleViewClients = async (trainer: Trainer) => {
    try {
      setLoadingClients(true);
      const trainerWithDetails = await getTrainerById(trainer.id);
      setSelectedTrainer(trainerWithDetails);
    } catch (err) {
      console.error('Error fetching trainer details:', err);
      setNotification({ message: `Failed to load clients for ${trainer.name}`, type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleEdit = (trainer: Trainer) => {
    setEditingTrainerId(trainer.id);
    setEditForm({
      name: trainer.name,
      specialization: trainer.specialization || '',
      email: trainer.email,
    });
  };

  const handleSave = async (trainerId: string) => {
    if (!editForm) return;

    try {
      const trainer = trainers.find(t => t.id === trainerId);
      if (!trainer) return;

      const [firstName, ...lastNameParts] = editForm.name.split(' ');
      const lastName = lastNameParts.join(' ');

      await updateTrainer(trainerId, trainer.userId, {
        firstName,
        lastName,
        email: editForm.email,
      });

      // Update local state
      setTrainers(trainers.map(t => 
        t.id === trainerId 
          ? { ...t, name: editForm.name, email: editForm.email, firstName, lastName }
          : t
      ));

      setEditingTrainerId(null);
      setEditForm(null);
      
      // Show success notification
      setNotification({ message: 'Trainer updated successfully', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Error updating trainer:', err);
      setNotification({ message: err instanceof Error ? err.message : 'Failed to update trainer', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleCancel = () => {
    setEditingTrainerId(null);
    setEditForm(null);
  };

  const openDeleteConfirmation = (trainer: Trainer) => {
    setDeleteConfirmation({
      isOpen: true,
      trainer,
      isDeleting: false,
    });
  };

  const closeDeleteConfirmation = () => {
    if (!deleteConfirmation.isDeleting) {
      setDeleteConfirmation({
        isOpen: false,
        trainer: null,
        isDeleting: false,
      });
    }
  };

  const handleDeleteConfirmed = async () => {
    const trainer = deleteConfirmation.trainer;
    if (!trainer) return;

    setDeleteConfirmation(prev => ({ ...prev, isDeleting: true }));

    try {
      await deleteTrainer(trainer.id);
      
      // Update local state
      setTrainers(trainers.filter(t => t.id !== trainer.id));
      
      // Close confirmation modal
      setDeleteConfirmation({
        isOpen: false,
        trainer: null,
        isDeleting: false,
      });

      // Show success notification
      setNotification({ message: `Trainer "${trainer.name}" has been deleted successfully`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Error deleting trainer:', err);
      setNotification({ message: err instanceof Error ? err.message : 'Failed to delete trainer', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      
      setDeleteConfirmation(prev => ({ ...prev, isDeleting: false }));
    }
  };

  if (loading) {
    return (
      <DashboardLayout userName="Admin">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3C4526] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading trainers...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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

  if (error) {
    return (
      <DashboardLayout userName="Admin">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchTrainers} className="bg-[#3C4526] hover:bg-[#2d331c]">
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userName="Admin">
      <NotificationToast />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trainers</h1>
            <p className="text-black mt-1">Manage your fitness training staff</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search trainers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#3C4526] w-64"
              />
            </div>
            {/* Add Trainer Button */}
            {/* <Button className="bg-[#3C4526] hover:bg-[#7C3AED]">
              <Plus className="h-4 w-4 mr-2" />
              Add Trainer
            </Button> */}

          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Trainers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalTrainers}</div>
              <p className="text-xs text-black mt-1">Active trainers</p>
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
              <p className="text-xs text-black mt-1">Across all trainers</p>
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
              <p className="text-xs text-black mt-1">Clients per trainer</p>
            </CardContent>
          </Card>
        </div>

        {/* Trainers Grid */}
        {filteredTrainers.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center text-center">
                <Users className="h-16 w-16 text-black mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No trainers found</h3>
                <p className="text-sm text-black mb-6 max-w-sm">
                  {searchQuery 
                    ? `No trainers match "${searchQuery}". Try adjusting your search.`
                    : 'Get started by adding your first trainer to the system.'
                  }
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                )}
                {/* Add Trainer Button - Hidden for now */}
                {/* {!searchQuery && (
                  <Button className="bg-[#3C4526] hover:bg-[#7C3AED]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Trainer
                  </Button>
                )} */}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTrainers.map((trainer) => {
              const isEditing = editingTrainerId === trainer.id;
              
              return (
              <Card key={trainer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-[#3C4526] text-white text-lg font-semibold">
                        {(isEditing ? editForm?.name : trainer.name)?.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editForm?.name || ''}
                            onChange={(e) => setEditForm(editForm ? {...editForm, name: e.target.value} : null)}
                            className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3C4526]"
                           
                            placeholder="Name"
                          />
                          <input
                              type="text" 
                              value={editForm?.specialization || ''}
                              onChange={(e) => setEditForm(editForm ? {...editForm, specialization: e.target.value} : null)}
                              className="w-full px-2 py-1 text-xs text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3C4526]"
                            placeholder="Specialization"
                          />
                        </div>
                      ) : (
                        <>
                          <h3 className="text-lg font-bold text-gray-900">{trainer.name}</h3>
                          <p className="text-sm text-black">{trainer.specialization}</p>
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
                        onClick={() => handleSave(trainer.id)}
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
                      onClick={() => handleEdit(trainer)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2 text-sm">
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
                        <span>{trainer.email}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Stats Row */}
                <div className="pt-4 border-t">
                  <div>
                    <p className="text-xs text-black">Clients</p>
                    <p className="text-xl font-bold text-gray-900">{trainer.clientCount}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    size="sm"
                    onClick={() => handleViewClients(trainer)}
                  >
                    View Clients
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteConfirmation(trainer)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
            })}
        </div>
        )}

        {/* Clients Modal */}
        {(selectedTrainer || loadingClients) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !loadingClients && setSelectedTrainer(null)}>
            <Card className="w-full max-w-2xl max-h-[85vh] overflow-hidden bg-[#F7F5ED]" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="pb-3 pt-4 px-6 border-b bg-gradient-to-r from-[#3C4526] to-[#2d331c]">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-white">
                      {loadingClients ? 'Loading...' : `${selectedTrainer?.name}'s Clients`}
                    </CardTitle>
                    <CardDescription className="text-white/80 text-xs mt-0.5">
                      {loadingClients ? 'Fetching client data...' : `${selectedTrainer?.clients.length} ${selectedTrainer?.clients.length === 1 ? 'client' : 'clients'}`}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20 -mr-2"
                    onClick={() => !loadingClients && setSelectedTrainer(null)}
                    disabled={loadingClients}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
                {loadingClients ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3C4526] mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600">Loading clients...</p>
                    </div>
                  </div>
                ) : !selectedTrainer || selectedTrainer.clients.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <Users className="h-10 w-10 text-black mx-auto mb-3" />
                      <p className="text-sm text-black">No clients assigned</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedTrainer.clients.map((client) => (
                      <Card key={client.id} className="border border-gray-200 hover:border-[#3C4526] transition-colors bg-white">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-[#3C4526] text-white text-sm font-medium">
                                {client.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-base text-gray-900">{client.name}</h3>
                              <div className="flex items-center gap-2 mt-1.5 text-xs text-black">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate">{client.email}</span>
                                </span>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  <TrendingUp className="h-3 w-3" />
                                  {client.workoutCount || 0} Workouts
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                  <FileText className="h-3 w-3" />
                                  {client.mealPlanCount || 0} Meal Plan
                                </span>
                              </div>
                              {client.joinDate && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-black">
                                  <Calendar className="h-3 w-3" />
                                  Joined {new Date(client.joinDate).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric' 
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.isOpen && deleteConfirmation.trainer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeDeleteConfirmation}>
            <Card className="w-full max-w-md bg-white" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Delete Trainer</CardTitle>
                    <CardDescription>This action cannot be undone</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-gray-900">{deleteConfirmation.trainer.name}</span>?
                  This will permanently remove the trainer from the system along with all their associated data.
                </p>

                {deleteConfirmation.trainer.clientCount > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Warning:</strong> This trainer has{' '}
                      <strong>{deleteConfirmation.trainer.clientCount} active client{deleteConfirmation.trainer.clientCount !== 1 ? 's' : ''}</strong>.
                      Deleting them may affect those client relationships.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
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
                        Delete Trainer
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
