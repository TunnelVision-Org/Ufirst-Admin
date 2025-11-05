'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Plus, UserPlus, Users, TrendingUp, Award, Phone, Mail, MoreVertical, Search, X, Calendar, AlertTriangle, Clock, FileText, User, Trash2, Check, Star } from 'lucide-react';
import { getAllTrainers, updateTrainer, deleteTrainer, getTrainerById, type Trainer, type TrainerWithDetails } from '@/lib/api/trainers';
import { mockServiceReports } from '@/app/data/mockData';
import { cn } from '@/lib/utils';

export default function TrainersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerWithDetails | null>(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedTrainerForReports, setSelectedTrainerForReports] = useState<Trainer | null>(null);
  const [reports, setReports] = useState(mockServiceReports);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTrainerId, setEditingTrainerId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{name: string; specialization: string; email: string; phone: string} | null>(null);
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
  const avgRating = totalTrainers > 0 
    ? (trainers.reduce((sum, t) => sum + t.rating, 0) / totalTrainers).toFixed(1)
    : '0.0';

  const handleViewClients = async (trainer: Trainer) => {
    try {
      setLoadingClients(true);
      const trainerWithDetails = await getTrainerById(trainer.id);
      setSelectedTrainer(trainerWithDetails);
    } catch (err) {
      console.error('Error fetching trainer details:', err);
      alert(`Failed to load clients for ${trainer.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      phone: trainer.phone || '',
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
      alert('Trainer updated successfully');
    } catch (err) {
      console.error('Error updating trainer:', err);
      alert(err instanceof Error ? err.message : 'Failed to update trainer');
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
      
      // Remove associated reports
      setReports(reports.filter(r => r.trainerId !== trainer.id));
      
      // Close confirmation modal
      setDeleteConfirmation({
        isOpen: false,
        trainer: null,
        isDeleting: false,
      });

      // Show success message
      alert(`Trainer "${trainer.name}" has been deleted successfully`);
    } catch (err) {
      console.error('Error deleting trainer:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete trainer');
      
      setDeleteConfirmation(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleDismissReport = (reportId: string) => {
    if (window.confirm('Are you sure you want to dismiss this report?')) {
      setReports(reports.filter(r => r.id !== reportId));
    }
  };

  const handleDeleteTrainerFromReport = (trainerId: string) => {
    const trainer = trainers.find(t => t.id === trainerId);
    if (trainer) {
      openDeleteConfirmation(trainer);
      setSelectedTrainerForReports(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'late': return Clock;
      case 'unprofessional': return AlertTriangle;
      case 'unprepared': return FileText;
      case 'inappropriate': return AlertTriangle;
      default: return FileText;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'late': 'Late Arrival',
      'unprofessional': 'Unprofessional',
      'unprepared': 'Unprepared',
      'inappropriate': 'Inappropriate Behavior',
      'other': 'Other'
    };
    return labels[category] || category;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Avg. Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{avgRating}</div>
              <p className="text-xs text-black mt-1">Out of 5.0 stars</p>
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
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3C4526]"
                            placeholder="Name"
                          />
                          <input
                            type="text"
                            value={editForm?.specialization || ''}
                            onChange={(e) => setEditForm(editForm ? {...editForm, specialization: e.target.value} : null)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3C4526]"
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
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3C4526]"
                          placeholder="Email"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-black" />
                        <input
                          type="tel"
                          value={editForm?.phone || ''}
                          onChange={(e) => setEditForm(editForm ? {...editForm, phone: e.target.value} : null)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3C4526]"
                          placeholder="Phone"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{trainer.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{trainer.phone}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-black">Clients</p>
                    <p className="text-xl font-bold text-gray-900">{trainer.clientCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-black">Rating</p>
                    <p className="text-xl font-bold text-gray-900">{trainer.rating} ⭐</p>
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
                    className="flex-1" 
                    size="sm"
                    onClick={() => setSelectedTrainerForReports(trainer)}
                  >
                    View Reports ({reports.filter(r => r.trainerId === trainer.id).length})
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
                      <Card key={client.id} className="border border-gray-200 hover:border-[#3C4526] transition-colors bg-[#F7F5ED] rounded-lg overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-stretch">
                          {/* Avatar column */}
                          <div className="flex items-center justify-center sm:justify-start p-6 bg-white sm:w-40">
                            <Avatar className="h-28 w-28">
                              <AvatarFallback className="bg-[#3C4526] text-white text-2xl font-semibold">
                                {client.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          {/* Content column */}
                          <div className="flex-1 p-6">
                            {/* Top tab-like nav (visual only) */}
                            <div className="mb-4">
                              <nav className="inline-flex rounded-t-lg overflow-hidden border border-gray-200 bg-white">
                                <button className="px-4 py-2 text-sm bg-white text-gray-800">Info</button>
                                <button className="px-4 py-2 text-sm bg-white text-gray-800">Meal Plans</button>
                                <button className="px-4 py-2 text-sm bg-white text-gray-800">Today's Workout</button>
                                <button className="px-4 py-2 text-sm bg-white text-gray-800">Weight Trends</button>
                              </nav>
                            </div>

                            {/* Main centered name */}
                            <div className="flex items-center justify-center sm:justify-start">
                              <h3 className="text-3xl sm:text-2xl font-bold text-gray-900">{client.name}</h3>
                            </div>

                            {/* Secondary metadata row (kept subtle) */}
                            <div className="mt-4 flex flex-wrap gap-3 items-center justify-center sm:justify-start text-sm text-gray-700">
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700">
                                <TrendingUp className="h-3 w-3" />
                                {client.workoutCount || 0} Workouts
                              </span>
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                                <FileText className="h-3 w-3" />
                                {client.mealPlanCount || 0} Meal Plans
                              </span>
                              {client.joinDate && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                                  <Calendar className="h-3 w-3" />
                                  Joined {new Date(client.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Modal */}
        {selectedTrainerForReports && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTrainerForReports(null)}>
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-[#F7F5ED] relative" onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 text-gray-600 hover:bg-gray-200 z-10"
                onClick={() => setSelectedTrainerForReports(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardContent className="p-4 overflow-y-auto max-h-[90vh]">
                {(() => {
                  const trainerReports = reports.filter(r => r.trainerId === selectedTrainerForReports.id);

                  return trainerReports.length === 0 ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="text-center">
                        <FileText className="h-10 w-10 text-black mx-auto mb-3" />
                        <p className="text-sm text-black">No reports for this trainer</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Reports for {selectedTrainerForReports.name}
                        </h3>
                        <p className="text-sm text-black">{trainerReports.length} {trainerReports.length === 1 ? 'report' : 'reports'}</p>
                      </div>
                      {trainerReports.map((report) => {
                        const CategoryIcon = getCategoryIcon(report.category);
                        
                        return (
                          <Card 
                            key={report.id} 
                            className="hover:shadow-md transition-shadow border-l-4 bg-white" 
                            style={{ 
                              borderLeftColor: report.severity === 'high' ? '#dc2626' : 
                                              report.severity === 'medium' ? '#eab308' : '#3b82f6' 
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className={cn(
                                    "p-2 rounded-lg border",
                                    getSeverityColor(report.severity)
                                  )}>
                                    <CategoryIcon className="h-4 w-4" />
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-semibold text-sm text-gray-900">{getCategoryLabel(report.category)}</h4>
                                      <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium border",
                                        getSeverityColor(report.severity)
                                      )}>
                                        {report.severity.toUpperCase()}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        <span>Client: <strong>{report.clientName}</strong></span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{new Date(report.date).toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric', 
                                          year: 'numeric' 
                                        })}</span>
                                      </div>
                                    </div>

                                    <p className="text-gray-700 text-xs leading-relaxed">
                                      {report.description}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-3 border-t">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="flex-1 text-gray-600 hover:bg-gray-50 text-xs h-8"
                                  onClick={() => handleDismissReport(report.id)}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Dismiss
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="flex-1 text-red-600 hover:bg-red-50 border-red-200 text-xs h-8"
                                  onClick={() => handleDeleteTrainerFromReport(report.trainerId)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete Trainer
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  );
                })()}
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
