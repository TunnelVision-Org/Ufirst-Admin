"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/app/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { getTrainerByEmail, type TrainerWithDetails } from "@/lib/api/trainers";
import { getCurrentUser } from "@/lib/auth";
import { Plus, X, Check, Users, Dumbbell, Trash2, Clock, User } from "lucide-react";

type Exercise = {
  name: string;
  sets?: string;
  reps?: string;
  notes?: string;
};

type Workout = {
  id: string;
  name: string;
  exercises: string | Exercise[];
  completed: boolean;
  clientId?: string;
  trainerId?: string;
  createdAt: string;
};

type TrainerClient = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
};

// Helper to parse exercises from JSON string or array
function parseExercises(exercises: unknown): Exercise[] {
  if (!exercises) return [];
  if (Array.isArray(exercises)) return exercises;
  if (typeof exercises === "string") {
    try {
      const parsed = JSON.parse(exercises);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function WorkoutDashboardPage() {
  const [activeTab, setActiveTab] = useState<"workouts" | "create">("workouts");

  // Trainer data
  const [trainer, setTrainer] = useState<TrainerWithDetails | null>(null);
  const [trainerClients, setTrainerClients] = useState<TrainerClient[]>([]);
  const [trainerLoading, setTrainerLoading] = useState(true);

  // Workouts list
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([{ name: "", sets: "", reps: "", notes: "" }]);

  // Client selection state
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [editName, setEditName] = useState("");
  const [editExercises, setEditExercises] = useState<Exercise[]>([]);
  const [editSelectedClientIds, setEditSelectedClientIds] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  // Fetch trainer data on mount
  useEffect(() => {
    async function loadTrainerData() {
      const user = getCurrentUser();
      if (!user?.email) {
        setTrainerLoading(false);
        return;
      }

      try {
        const trainerData = await getTrainerByEmail(user.email);
        setTrainer(trainerData);

        // Map clients from trainer data
        const clients: TrainerClient[] = (trainerData.clients || []).map((c) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`.trim(),
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
        }));
        setTrainerClients(clients);
      } catch (err) {
        console.error("Failed to load trainer data:", err);
      } finally {
        setTrainerLoading(false);
      }
    }

    loadTrainerData();
  }, []);

  // Fetch workouts for this trainer
  const fetchWorkouts = useCallback(async () => {
    if (!trainer?.id) return;

    setWorkoutsLoading(true);
    try {
      const res = await fetch(`/api/workouts/getAll`);
      const data = await res.json();
      if (data.workouts) {
        // Filter to only this trainer's workouts
        const myWorkouts = data.workouts.filter((w: Workout) => w.trainerId === trainer.id);
        setWorkouts(myWorkouts);
      }
    } catch (err) {
      console.error("Failed to fetch workouts:", err);
    } finally {
      setWorkoutsLoading(false);
    }
  }, [trainer?.id]);

  useEffect(() => {
    if (trainer?.id) {
      fetchWorkouts();
    }
  }, [trainer?.id, fetchWorkouts]);

  // Exercise management
  function addExercise() {
    setExercises([...exercises, { name: "", sets: "", reps: "", notes: "" }]);
  }

  function removeExercise(index: number) {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index));
    }
  }

  function updateExercise(index: number, field: keyof Exercise, value: string) {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  }

  // Client selection
  function toggleClient(clientId: string) {
    setSelectedClientIds((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  }

  function removeClient(clientId: string) {
    setSelectedClientIds((prev) => prev.filter((id) => id !== clientId));
  }

  const filteredClients = trainerClients.filter(
    (client) =>
      client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      client.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const selectedClients = trainerClients.filter((c) => selectedClientIds.includes(c.id));

  // Get client name by ID
  function getClientName(clientId?: string): string {
    if (!clientId) return "Unassigned";
    const client = trainerClients.find((c) => c.id === clientId);
    return client?.name || "Unknown Client";
  }

  // Open edit modal for a workout
  function openEditModal(workout: Workout) {
    setEditingWorkout(workout);
    setEditName(workout.name);
    setEditExercises(parseExercises(workout.exercises));
    setEditSelectedClientIds(workout.clientId ? [workout.clientId] : []);
    setEditModalOpen(true);
  }

  function toggleEditClient(clientId: string) {
    setEditSelectedClientIds((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  }

  async function handleSaveEdit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!editingWorkout) return;
    setError(null);
    setSuccess(null);
    if (!editName.trim()) {
      setError("Please enter a workout plan name");
      return;
    }
    const validExercises = editExercises.filter((ex) => ex.name.trim());
    if (validExercises.length === 0) {
      setError("Please add at least one exercise");
      return;
    }

    if (editSelectedClientIds.length === 0) {
      setError("Please select at least one client to assign this workout to");
      return;
    }

    setSavingEdit(true);
    try {
      // Update the existing workout to the first selected client (or keep original)
      const primaryClient = editSelectedClientIds[0];
      const updatePayload = {
        id: editingWorkout.id,
        name: editName.trim(),
        exercises: JSON.stringify(validExercises),
        clientId: primaryClient,
        trainerId: trainer?.id,
      };

      const updRes = await fetch('/api/workouts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      const updJson = await updRes.json();
      if (!updRes.ok || !updJson.success) {
        throw new Error(updJson.error || 'Failed to update workout');
      }

      // For any additional selected clients, create new workout copies
      const additional = editSelectedClientIds.slice(1);
      if (additional.length > 0) {
        await Promise.allSettled(
          additional.map((clientId) =>
            fetch('/api/workouts/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: editName.trim(),
                exercises: JSON.stringify(validExercises),
                completed: false,
                clientId,
                trainerId: trainer?.id,
              }),
            })
          )
        );
      }

      setSuccess('Workout updated and assignments saved');
      setEditModalOpen(false);
      setEditingWorkout(null);
      // refresh list
      fetchWorkouts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSavingEdit(false);
    }
  }

  // Delete workout
  async function handleDelete(workoutId: string) {
    if (!confirm("Are you sure you want to delete this workout?")) return;

    setDeletingId(workoutId);
    try {
      const res = await fetch("/api/workouts/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: workoutId }),
      });

      if (res.ok) {
        setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
      }
    } catch (err) {
      console.error("Failed to delete workout:", err);
    } finally {
      setDeletingId(null);
    }
  }

  // Form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!name.trim()) {
      setError("Please enter a workout plan name");
      return;
    }

    const validExercises = exercises.filter((ex) => ex.name.trim());
    if (validExercises.length === 0) {
      setError("Please add at least one exercise");
      return;
    }

    if (selectedClientIds.length === 0) {
      setError("Please select at least one client to assign this workout to");
      return;
    }

    setSaving(true);

    try {
      // Create a workout for each selected client
      const results = await Promise.allSettled(
        selectedClientIds.map(async (clientId) => {
          const payload = {
            name: name.trim(),
            exercises: JSON.stringify(validExercises),
            completed: false,
            clientId,
            trainerId: trainer?.id,
          };

          const res = await fetch("/api/workouts/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.error || "Failed to create workout");
          }
          return json.workout;
        })
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (failed > 0 && successful > 0) {
        setSuccess(`Workout plan created for ${successful} client(s). ${failed} assignment(s) failed.`);
      } else if (failed > 0) {
        setError(`Failed to create workout plan for ${failed} client(s)`);
      } else {
        setSuccess(`Workout plan "${name}" successfully assigned to ${successful} client(s)!`);
        // Reset form
        setName("");
        setNotes("");
        setExercises([{ name: "", sets: "", reps: "", notes: "" }]);
        setSelectedClientIds([]);
        // Refresh workouts list
        fetchWorkouts();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  const userName = trainer ? `${trainer.firstName} ${trainer.lastName}`.trim() : "Trainer";

  if (trainerLoading) {
    return (
      <DashboardLayout userName="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3C4526]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userName={userName}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workout Plans</h1>
            <p className="text-gray-600 mt-1">Create and manage workout plans for your clients</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{trainerClients.length} clients</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab("workouts")}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "workouts"
                  ? "border-[#3C4526] text-[#3C4526]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                My Workouts ({workouts.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "create"
                  ? "border-[#3C4526] text-[#3C4526]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New
              </div>
            </button>
          </nav>
        </div>

        {/* Workouts Tab */}
        {activeTab === "workouts" && (
          <div className="space-y-4">
            {workoutsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3C4526]"></div>
              </div>
            ) : workouts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Dumbbell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No workouts yet</h3>
                  <p className="text-gray-500 mt-1">Create your first workout plan to get started</p>
                  <Button
                    onClick={() => setActiveTab("create")}
                    className="mt-4 bg-[#3C4526] hover:bg-[#2d331c]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workout
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {workouts.map((workout) => {
                  const exerciseList = parseExercises(workout.exercises);
                  return (
                    <Card
                      key={workout.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => openEditModal(workout)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {workout.name}
                              </h3>
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full ${
                                  workout.completed
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {workout.completed ? "Completed" : "Pending"}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>{getClientName(workout.clientId)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>Created {new Date(workout.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {exerciseList.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-gray-500 mb-1">
                                  Exercises ({exerciseList.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {exerciseList.slice(0, 4).map((ex, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                    >
                                      {ex.name || "Exercise"}
                                      {ex.sets && ` • ${ex.sets} sets`}
                                      {ex.reps && ` × ${ex.reps}`}
                                    </span>
                                  ))}
                                  {exerciseList.length > 4 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                                      +{exerciseList.length - 4} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(workout.id);
                            }}
                            disabled={deletingId === workout.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
          </div>
        )}

        {/* Create Tab */}
        {activeTab === "create" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Messages */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Dumbbell className="h-5 w-5" />
                      Workout Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Workout Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Upper Body Strength"
                        className="w-full p-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-[#3C4526] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes / Instructions
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any additional notes..."
                        rows={3}
                        className="w-full p-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-[#3C4526] focus:border-transparent"
                      />
                    </div>

                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Exercises</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {exercises.map((exercise, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-gray-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">Exercise {index + 1}</span>
                          {exercises.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeExercise(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={exercise.name}
                          onChange={(e) => updateExercise(index, "name", e.target.value)}
                          placeholder="Exercise name"
                          className="w-full p-2 border rounded text-gray-900 text-sm"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={exercise.sets}
                            onChange={(e) => updateExercise(index, "sets", e.target.value)}
                            placeholder="Sets"
                            className="p-2 border rounded text-gray-900 text-sm"
                          />
                          <input
                            type="text"
                            value={exercise.reps}
                            onChange={(e) => updateExercise(index, "reps", e.target.value)}
                            placeholder="Reps"
                            className="p-2 border rounded text-gray-900 text-sm"
                          />
                          <input
                            type="text"
                            value={exercise.notes}
                            onChange={(e) => updateExercise(index, "notes", e.target.value)}
                            placeholder="Notes"
                            className="p-2 border rounded text-gray-900 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Client Selection */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Assign to Your Clients
                    </CardTitle>
                    <CardDescription>Select clients to receive this workout</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Selected Clients */}
                    {selectedClients.length > 0 && (
                      <div className="flex flex-wrap gap-2 pb-3 border-b">
                        {selectedClients.map((client) => (
                          <div
                            key={client.id}
                            className="flex items-center gap-2 bg-[#3C4526] text-white px-3 py-1.5 rounded-full text-sm"
                          >
                            <span>{client.name}</span>
                            <button
                              type="button"
                              onClick={() => removeClient(client.id)}
                              className="hover:bg-white/20 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Client Search */}
                    <div className="relative">
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setShowClientDropdown(true);
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        placeholder="Search your clients..."
                        className="w-full p-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-[#3C4526] focus:border-transparent"
                      />

                      {showClientDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {trainerClients.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              No clients assigned to you
                            </div>
                          ) : filteredClients.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              No clients match your search
                            </div>
                          ) : (
                            <>
                              <div className="p-2 border-b bg-gray-50 flex justify-between items-center">
                                <span className="text-xs text-gray-500">{filteredClients.length} client(s)</span>
                                <button
                                  type="button"
                                  onClick={() => setShowClientDropdown(false)}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  Close
                                </button>
                              </div>
                              {filteredClients.map((client) => {
                                const isSelected = selectedClientIds.includes(client.id);
                                return (
                                  <div
                                    key={client.id}
                                    onClick={() => toggleClient(client.id)}
                                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 ${
                                      isSelected ? "bg-green-50" : ""
                                    }`}
                                  >
                                    <div>
                                      <div className="font-medium text-gray-900">{client.name}</div>
                                      <div className="text-sm text-gray-500">{client.email}</div>
                                    </div>
                                    {isSelected && <Check className="h-5 w-5 text-green-600" />}
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-500">
                      {selectedClientIds.length === 0
                        ? "No clients selected"
                        : `${selectedClientIds.length} client(s) selected`}
                    </p>

                    {/* Quick select all */}
                    {trainerClients.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedClientIds.length === trainerClients.length) {
                            setSelectedClientIds([]);
                          } else {
                            setSelectedClientIds(trainerClients.map((c) => c.id));
                          }
                        }}
                      >
                        {selectedClientIds.length === trainerClients.length
                          ? "Deselect All"
                          : "Select All Clients"}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#3C4526] hover:bg-[#2d331c] text-white py-3"
                >
                  {saving ? "Creating..." : "Create & Assign Workout Plan"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditModalOpen(false)} />
          <form
            onSubmit={handleSaveEdit}
            className="relative z-50 w-full max-w-4xl bg-white rounded-lg shadow-lg p-6 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Edit Workout</h2>
              <div className="flex items-center gap-2"> 
                <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)}>
                  Close
                </Button>
                <Button type="submit" className="bg-[#3C4526] text-white">
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Workout Name *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-3 border rounded-lg text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exercises</label>
                  <div className="space-y-3">
                    {editExercises.map((exercise, idx) => (
                      <div key={idx} className="p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500">Exercise {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => setEditExercises((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={exercise.name}
                          onChange={(e) =>
                            setEditExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, name: e.target.value } : ex)))
                          }
                          placeholder="Exercise name"
                          className="w-full p-2 border rounded text-gray-900 text-sm mb-2"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={exercise.sets}
                            onChange={(e) =>
                              setEditExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, sets: e.target.value } : ex)))
                            }
                            placeholder="Sets"
                            className="p-2 border rounded text-gray-900 text-sm"
                          />
                          <input
                            type="text"
                            value={exercise.reps}
                            onChange={(e) =>
                              setEditExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, reps: e.target.value } : ex)))
                            }
                            placeholder="Reps"
                            className="p-2 border rounded text-gray-900 text-sm"
                          />
                          <input
                            type="text"
                            value={exercise.notes}
                            onChange={(e) =>
                              setEditExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, notes: e.target.value } : ex)))
                            }
                            placeholder="Notes"
                            className="p-2 border rounded text-gray-900 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditExercises((prev) => [...prev, { name: '', sets: '', reps: '', notes: '' }])}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Exercise
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3">
                  <h3 className="text-sm font-medium">Assign to your clients</h3>
                  <p className="text-sm text-gray-500">Select one or more clients to assign this workout to.</p>
                </div>

                <div className="max-h-64 overflow-y-auto border rounded p-2 space-y-2">
                  {trainerClients.length === 0 ? (
                    <div className="text-sm text-gray-500 p-2">No clients assigned to you</div>
                  ) : (
                    trainerClients.map((client) => (
                      <label key={client.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer">
                        <div>
                          <div className="font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={editSelectedClientIds.includes(client.id)}
                          onChange={() => toggleEditClient(client.id)}
                          className="h-4 w-4"
                        />
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
