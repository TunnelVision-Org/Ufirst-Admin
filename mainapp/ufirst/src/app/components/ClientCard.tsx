import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dumbbell, FileText, X, Plus } from 'lucide-react';
import { Button } from './ui/button';
import type { ClientWithDetails } from '@/lib/api/clients';

type TabKey = 'info' | 'mealPlans' | 'workout' | 'weightTrends';

interface Meal {
  calories: number;
  carbs: number;
  fats: number;
  name: string;
  protein: number;
}

// Helper to safely parse exercises - handles both JSON strings and arrays
function parseExercises(exercises: unknown): Array<{ reps?: number; sets?: number; weight?: number; name?: string }> {
  if (!exercises) return [];
  if (Array.isArray(exercises)) return exercises;
  if (typeof exercises === 'string') {
    try {
      const parsed = JSON.parse(exercises);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function ClientCard({ client }: { client: Partial<ClientWithDetails> }) {
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  // Some client payloads include a fitnessGoal field even if not in the typed interface.
  const fitnessGoal = (client as any).fitnessGoal as string | undefined;

  const fullName = client.name ?? `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim();
  const initials = fullName
    ? fullName.split(' ').map(n => (n && n.length > 0 ? n[0] : '')).join('').slice(0, 2).toUpperCase()
    : 'U';

  // Meal plan modal state
  const [showMealModal, setShowMealModal] = useState(false);
    const [mealPlans, setMealPlans] = useState<Array<{ id: string; name: string; description?: string; meals: Meal[]}>>(() => {
      const seed = (client as any).mockMealPlans as any[] | undefined;
      if (seed && Array.isArray(seed)) return seed.map((m, i) => ({ id: m.id ?? `mp${i+1}`, name: m.name ?? `Plan ${i+1}`, description: m.description, meals: m.meals ?? [] }));
      return [];
    });
  const [mealPlansLoading, setMealPlansLoading] = useState(false);
  const [mealPlansError, setMealPlansError] = useState<string | null>(null);
  const [mealPlansSaving, setMealPlansSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<{ id?: string; name: string; description?: string; meals: Meal[] } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [mealPlansDeletingId, setMealPlansDeletingId] = useState<string | null>(null);
  // Workout modal state
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workouts, setWorkouts] = useState<Array<{ id: string; name: string; completed?: boolean; exercises?: Array<{ reps?: number; sets?: number; weight?: number; name?: string }> }>>(() => {
    const seed = (client as any).mockWorkouts as any[] | undefined;
    if (seed && Array.isArray(seed)) return seed.map((w, i) => ({ id: w.id ?? `w${i+1}`, name: w.name ?? `Workout ${i+1}`, completed: !!w.completed, exercises: w.exercises }));
    return [];
  });
  const [editingWorkout, setEditingWorkout] = useState<{ id?: string; name: string; completed?: boolean; exercises?: Array<{ reps?: number; sets?: number; weight?: number; name?: string }> } | null>(null);
  const [confirmDeleteWorkoutId, setConfirmDeleteWorkoutId] = useState<string | null>(null);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);
  const [workoutsError, setWorkoutsError] = useState<string | null>(null);
  const [workoutsSaving, setWorkoutsSaving] = useState(false);
  const [workoutsDeletingId, setWorkoutsDeletingId] = useState<string | null>(null);

  // Fetch meal plans from API when modal opens
  const fetchMealPlans = useCallback(async () => {
    if (!client?.id) return;
    setMealPlansLoading(true);
    setMealPlansError(null);
    try {
      const res = await fetch(`/api/mealPlans/getAll?clientId=${encodeURIComponent(String(client.id))}`);
      const json = await res.json();
      if (!res.ok || !json?.success) {
        const message = json?.error ?? json?.message ?? `Failed to load (${res.status})`;
        setMealPlansError(String(message));
        setMealPlans([]);
      } else {
        setMealPlans((json.mealPlans || []).map((m: any) => ({ id: m.id, name: m.name, description: m.description })));
      }
    } catch (err) {
      setMealPlansError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setMealPlansLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (showMealModal) fetchMealPlans();
  }, [showMealModal, fetchMealPlans]);

  // Fetch workouts from API when modal opens
  const fetchWorkouts = useCallback(async () => {
    if (!client?.id) return;
    setWorkoutsLoading(true);
    setWorkoutsError(null);
    try {
      const res = await fetch(`/api/workouts/getAll?clientId=${encodeURIComponent(String(client.id))}`);
      const json = await res.json();
      if (!res.ok || !json?.success) {
        const message = json?.error ?? json?.message ?? `Failed to load (${res.status})`;
        setWorkoutsError(String(message));
        setWorkouts([]);
      } else {
        setWorkouts((json.workouts || []).map((w: any) => ({ id: w.id, name: w.name, completed: w.completed, exercises: w.exercises })));
      }
    } catch (err) {
      setWorkoutsError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setWorkoutsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (showWorkoutModal) fetchWorkouts();
  }, [showWorkoutModal, fetchWorkouts]);

  const createOrUpdateWorkout = async (workout: { id?: string; name: string; completed?: boolean; exercises?: any[] }): Promise<boolean> => {
    if (!client?.id) {
      const msg = 'Missing client id when saving workout';
      console.error('[ClientCard] ' + msg, { client });
      setWorkoutsError(msg);
      return false;
    }
    if (!workout.name || workout.name.trim() === '') {
      const msg = 'Workout name is required';
      console.warn('[ClientCard] ' + msg);
      setWorkoutsError(msg);
      return false;
    }
    setWorkoutsSaving(true);
    setWorkoutsError(null);
    try {
      const url = workout.id ? '/api/workouts/update' : '/api/workouts/create';
      console.debug('[ClientCard] Saving workout', { url, workout, clientId: client.id });
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: workout.id,
          name: workout.name,
          exercises: workout.exercises,
          completed: workout.completed,
          clientId: client.id,
          trainerId: (client as any).trainerId ?? (client as any).trainer?.id ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        const msg = json?.error ?? json?.message ?? `Save failed (${res.status})`;
        console.error('[ClientCard] save failed', { msg, json });
        setWorkoutsError(msg);
        return false;
      }
      // refresh list
      await fetchWorkouts();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[ClientCard] createOrUpdateWorkout error', err);
      setWorkoutsError(msg);
      return false;
    } finally {
      setWorkoutsSaving(false);
    }
  };

  const deleteWorkout = async (id: string) => {
    setWorkoutsDeletingId(id);
    setWorkoutsError(null);
    try {
      const res = await fetch('/api/workouts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setWorkoutsError(json?.error ?? json?.message ?? `Delete failed (${res.status})`);
        return;
      }
      // remove locally for snappy UI
      setWorkouts(s => s.filter(w => w.id !== id));
    } catch (err) {
      setWorkoutsError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setWorkoutsDeletingId(null);
      setConfirmDeleteWorkoutId(null);
    }
  };

  const createOrUpdateMealPlan = async (plan: { id?: string; name: string; description?: string, meals: Meal[]}) => {
    if (!client?.id) return;
    if (!plan.name || plan.name.trim() === '') return;
    setMealPlansSaving(true);
    setMealPlansError(null);
    try {
      const url = plan.id ? '/api/mealPlans/update' : '/api/mealPlans/create';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          clientId: client.id,
          trainerId: (client as any).trainerId ?? (client as any).trainer?.id ?? undefined,
          meals: plan.meals,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setMealPlansError(json?.error ?? json?.message ?? `Save failed (${res.status})`);
        return;
      }
      // refresh list
      await fetchMealPlans();
    } catch (err) {
      setMealPlansError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setMealPlansSaving(false);
    }
  };

  const deleteMealPlan = async (id: string) => {
    setMealPlansDeletingId(id);
    setMealPlansError(null);
    try {
      const res = await fetch('/api/mealPlans/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setMealPlansError(json?.error ?? json?.message ?? `Delete failed (${res.status})`);
        return;
      }
      // remove locally for snappy UI
      setMealPlans(s => s.filter(m => m.id !== id));
    } catch (err) {
      setMealPlansError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setMealPlansDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <>
    <Card className="hover:shadow-sm transition-shadow border border-gray-100 rounded-lg">
      <CardContent className="p-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar (compact) */}
          <div className="flex-shrink-0">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-[#3C4526] text-white text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{fullName || 'Unnamed Client'}</h3>
                </div>
                <div className="text-xs text-gray-500 truncate mt-0.5">{client.email ?? ''}</div>
              </div>

              {/* small stats (compact badges) */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs">
                  <Dumbbell className="h-3 w-3" />
                  {client.workoutCount || 0}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">
                  <FileText className="h-3 w-3" />
                  {client.mealPlanCount || 0}
                </span>
              </div>
            </div>

            {/* compact tab strip */}
            <nav className="mt-3 flex gap-2 text-xs" aria-label="Client tabs">
              {(['info','mealPlans','workout','weightTrends'] as TabKey[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      if (tab === 'mealPlans') {
                        setShowMealModal(true);
                      } else if (tab === 'workout') {
                        setShowWorkoutModal(true);
                      } else {
                        setActiveTab(tab);
                      }
                    }}
                    className={`px-2 py-1 rounded-md ${activeTab === tab ? 'bg-[#F3F2EA] text-gray-900 font-medium' : 'bg-transparent text-gray-600'}`}
                  >
                    {tab === 'info' ? 'Info' : tab === 'mealPlans' ? 'Meal Plans' : tab === 'workout' ? "Workout" : 'Weight Trends'}
                  </button>
                ))}
            </nav>

            {/* tab panel (compact) */}
            <div className="mt-3 text-sm text-gray-700">
              {activeTab === 'info' && (
                <div className="break-words whitespace-normal">
                  {fitnessGoal ? (
                    <p className="text-sm text-gray-800">{fitnessGoal}</p>
                  ) : (
                    <p className="text-sm text-gray-500">No additional info available.</p>
                  )}
                </div>
              )}

              {activeTab === 'mealPlans' && (
                <div className="text-sm text-gray-600">{client.mealPlanCount ? `${client.mealPlanCount} meal plan(s)` : 'No meal plans.'}</div>
              )}

              {activeTab === 'workout' && (
                <div className="text-sm text-gray-600">{client.workoutCount ? `${client.workoutCount} workout(s)` : 'No workouts logged.'}</div>
              )}

              {activeTab === 'weightTrends' && (
                <div className="text-sm text-gray-600">No weight trend data available.</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Meal Plans Modal Overlay */}
    {showMealModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowMealModal(false)}>
        <Card className="w-full max-w-3xl max-h-[85vh] overflow-hidden bg-[#F7F5ED]" onClick={(e) => e.stopPropagation()}>
          <CardHeader className="pb-3 pt-4 px-6 border-b bg-gradient-to-r from-[#3C4526] to-[#2d331c]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-white">Meal Plans for {fullName}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 -mr-2" onClick={() => setShowMealModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">Manage meal plans for this client.</div>
              <div>
                <Button className="bg-[#3C4526] text-white" onClick={() => setEditingPlan({ name: '', description: '', meals: [] })}>
                  <Plus className="h-4 w-4 mr-2" /> New Meal Plan
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {mealPlansLoading ? (
                <div className="text-center py-8">Loading meal plans…</div>
              ) : mealPlansError ? (
                <div className="text-center py-8 text-red-600">Error loading meal plans: {mealPlansError}</div>
              ) : mealPlans.length === 0 ? (
                <div className="text-center py-10">
                  <div className="mx-auto mb-4 w-24 h-24 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-3xl text-gray-700">+</div>
                  <p className="text-sm text-gray-700 font-medium">Client has no meal plans</p>
                  <p className="text-xs text-gray-500 mt-1">Click "New Meal Plan" to create one.</p>
                </div>
              ) : (
                mealPlans.map(mp => (
                  <Card key={mp.id} className="border border-gray-200 bg-white">
                    <CardContent>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-900">{mp.name}</h4>
                          <p className="text-sm text-gray-600 mt-1 break-words">{mp.description ?? 'No description'}</p>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <Button size="sm" variant="outline" className="text-white" onClick={() => setEditingPlan({ id: mp.id, name: mp.name, description: mp.description, meals: mp.meals })}>Edit</Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => setConfirmDeleteId(mp.id)} disabled={mealPlansDeletingId === mp.id}>{mealPlansDeletingId === mp.id ? 'Deleting…' : 'Delete'}</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Inline editor */}
            {editingPlan && (() => {
              const ep = editingPlan as { id?: string; name: string; description?: string; meals: Meal[] };
              return (
                <div className="mt-4 p-3 border border-gray-100 rounded bg-white">
                  {/* PLAN FIELDS */}
                  <label className="block text-xs text-black">Name</label>
                  <input
                    autoFocus
                    value={ep.name}
                    onChange={(e) => setEditingPlan({ ...ep, name: e.target.value })}
                    className="w-full mt-1 p-2 border rounded text-sm text-black"
                  />

                  <label className="block text-xs text-black mt-2">Description</label>
                  <textarea
                    value={ep.description}
                    onChange={(e) => setEditingPlan({ ...ep, description: e.target.value })}
                    className="w-full mt-1 p-2 border rounded text-sm text-black"
                    rows={4}
                  />

                  {/* MEALS ARRAY FORM */}
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-black mb-2">Meals</label>

                    {(ep.meals ?? []).map((meal, index) => (
                      <div key={index} className="p-3 border border-gray-200 rounded mb-3">

                        <label className="block text-xs text-black">Meal Name</label>
                        <input
                          value={meal.name}
                          onChange={(e) => {
                            const meals = [...ep.meals];
                            meals[index] = { ...meals[index], name: e.target.value };
                            setEditingPlan({ ...ep, meals });
                          }}
                          className="w-full mt-1 p-2 border rounded text-sm text-black"
                        />

                        <label className="block text-xs text-black mt-2">Calories</label>
                        <input
                          type="number"
                          value={meal.calories}
                          onChange={(e) => {
                            const meals = [...ep.meals];
                            meals[index] = { ...meals[index], calories: Number(e.target.value) };
                            setEditingPlan({ ...ep, meals });
                          }}
                          className="w-full mt-1 p-2 border rounded text-sm text-black"
                        />

                        <label className="block text-xs text-black mt-2">Carbs</label>
                        <input
                          type="number"
                          value={meal.carbs}
                          onChange={(e) => {
                            const meals = [...ep.meals];
                            meals[index] = { ...meals[index], carbs: Number(e.target.value) };
                            setEditingPlan({ ...ep, meals });
                          }}
                          className="w-full mt-1 p-2 border rounded text-sm text-black"
                        />

                        <label className="block text-xs text-black mt-2">Fats</label>
                        <input
                          type="number"
                          value={meal.fats}
                          onChange={(e) => {
                            const meals = [...ep.meals];
                            meals[index] = { ...meals[index], fats: Number(e.target.value) };
                            setEditingPlan({ ...ep, meals });
                          }}
                          className="w-full mt-1 p-2 border rounded text-sm text-black"
                        />

                        <label className="block text-xs text-black mt-2">Proteins</label>
                        <input
                          type="number"
                          value={meal.protein}
                          onChange={(e) => {
                            const meals = [...ep.meals];
                            meals[index] = { ...meals[index], protein: Number(e.target.value) };
                            setEditingPlan({ ...ep, meals });
                          }}
                          className="w-full mt-1 p-2 border rounded text-sm text-black"
                        />

                        {/* REMOVE MEAL BUTTON */}
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => {
                              const meals = [...ep.meals];
                              meals.splice(index, 1);
                              setEditingPlan({ ...ep, meals });
                            }}
                            className="text-xs border px-2 py-1 rounded text-red-600"
                          >
                            Remove Meal
                          </button>
                        </div>

                      </div>
                    ))}

                    {/* ADD NEW MEAL BUTTON */}
                    <button
                      onClick={() =>
                        setEditingPlan({
                          ...ep,
                          meals: [
                            ...(ep.meals ?? []),
                            { name: "", calories: 0, carbs: 0, fats: 0, protein: 0 }
                          ]
                        })
                      }
                      className="mt-1 px-3 py-1 text-xs border rounded text-black"
                    >
                      + Add Meal
                    </button>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="mt-3 flex gap-2 justify-end">
                    <Button variant="outline" className="text-white" onClick={() => setEditingPlan(null)} disabled={mealPlansSaving}>
                      Cancel
                    </Button>

                    <Button
                      onClick={async () => {
                        if (!ep.name || ep.name.trim() === '') return;
                        await createOrUpdateMealPlan(ep);
                        setEditingPlan(null);
                      }}
                      className="bg-[#3C4526] text-white"
                      disabled={mealPlansSaving}
                    >
                      {mealPlansSaving ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                </div>
              );
            })()}

            {/* Delete confirmation */}
            {confirmDeleteId && (
              <div className="mt-4 p-3 border border-red-100 rounded bg-red-50 text-red-800">
                <div>Are you sure you want to delete this meal plan?</div>
                <div className="mt-2 flex gap-2 justify-end">
                  <Button variant="outline" className="text-white" onClick={() => setConfirmDeleteId(null)} disabled={!!mealPlansDeletingId}>Cancel</Button>
                  <Button className="bg-red-600 text-white" onClick={() => confirmDeleteId && deleteMealPlan(confirmDeleteId)} disabled={!!mealPlansDeletingId}>{mealPlansDeletingId ? 'Deleting…' : 'Delete'}</Button>
                </div>
                {mealPlansError && <div className="mt-2 text-xs text-red-700">{mealPlansError}</div>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )}
    {/* Workout Modal Overlay */}
    {showWorkoutModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowWorkoutModal(false)}>
        <Card className="w-full max-w-3xl max-h-[85vh] overflow-hidden bg-[#F7F5ED]" onClick={(e) => e.stopPropagation()}>
          <CardHeader className="pb-3 pt-4 px-6 border-b bg-gradient-to-r from-[#3C4526] to-[#2d331c]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-white">Workouts for {fullName}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 -mr-2" onClick={() => setShowWorkoutModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">Manage workouts for this client.</div>
              <div>
                <Button className="bg-[#3C4526] text-white" onClick={() => setEditingWorkout({ name: '', completed: false, exercises: [] })}>
                  <Plus className="h-4 w-4 mr-2" /> New Workout
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {workouts.length === 0 ? (
                <div className="text-center py-10">
                  <div className="mx-auto mb-4 w-24 h-24 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-3xl text-gray-700">+</div>
                  <p className="text-sm text-gray-700 font-medium">No workouts scheduled</p>
                  <p className="text-xs text-gray-500 mt-1">Click "New Workout" to create one.</p>
                </div>
              ) : (
                workouts.map(w => (
                  <Card key={w.id} className="border border-gray-200 bg-white">
                    <CardContent>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-900">{w.name}</h4>
                          <div className="text-xs text-gray-600 mt-1">{w.completed ? 'Completed' : 'Pending'}</div>
                          <div className="mt-2 text-sm text-gray-700">
                            {parseExercises(w.exercises).length > 0 ? (
                              <div className="space-y-1">
                                {parseExercises(w.exercises).map((ex, i) => (
                                  <div key={i} className="text-xs text-gray-600">{ex.name ?? 'Exercise'} — reps: {ex.reps ?? '-'}, sets: {ex.sets ?? '-'}, weight: {ex.weight ?? '-'}</div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">No exercises</div>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <Button size="sm" variant="outline" className="text-white" onClick={() => setEditingWorkout({ id: w.id, name: w.name, completed: w.completed, exercises: parseExercises(w.exercises) })}>Edit</Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => setConfirmDeleteWorkoutId(w.id)}>Delete</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Inline workout editor */}
            {editingWorkout && (() => {
              const ew = editingWorkout as { id?: string; name: string; completed?: boolean; exercises?: Array<{ reps?: number; sets?: number; weight?: number; name?: string }> };
              const updateExercise = (idx: number, val: Partial<{ reps?: number; sets?: number; weight?: number; name?: string }>) => {
                const exs = (ew.exercises || []).slice();
                exs[idx] = { ...exs[idx], ...val };
                setEditingWorkout({ ...ew, exercises: exs });
              };
              return (
                <div className="mt-4 p-3 border border-gray-100 rounded bg-white">
                  <label className="block text-xs text-black">Name</label>
                  <input autoFocus value={ew.name} onChange={(e) => setEditingWorkout({ ...ew, name: e.target.value })} className="w-full mt-1 p-2 border rounded text-sm text-black" />
                  <div className="mt-2 flex gap-2 items-center">
                    <label className="text-xs items-center flex gap-1 text-black"><input type="checkbox" checked={!!ew.completed} onChange={(e) => setEditingWorkout({ ...ew, completed: e.target.checked })} /> Completed</label>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-black">Exercises</label>
                      <Button size="sm" className="text-black" onClick={() => setEditingWorkout({ ...ew, exercises: [...(ew.exercises || []), { name: '', reps: undefined, sets: undefined, weight: undefined }] })}>Add Exercise</Button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {(ew.exercises || []).map((ex, idx) => (
                        <div key={idx} className="p-2 border rounded bg-gray-50 txt-color-black">
                          <div className="flex gap-2">
                            <input placeholder="Exercise name" value={ex.name ?? ''} onChange={(e) => updateExercise(idx, { name: e.target.value })} className="flex-1 p-1 border rounded text-sm text-black" />
                            <input placeholder="reps" type="number" value={ex.reps ?? ''} onChange={(e) => updateExercise(idx, { reps: e.target.value ? Number(e.target.value) : undefined })} className="w-20 p-1 border rounded text-sm text-black" />
                            <input placeholder="sets" type="number" value={ex.sets ?? ''} onChange={(e) => updateExercise(idx, { sets: e.target.value ? Number(e.target.value) : undefined })} className="w-20 p-1 border rounded text-sm text-black" />
                            <input placeholder="weight" type="number" value={ex.weight ?? ''} onChange={(e) => updateExercise(idx, { weight: e.target.value ? Number(e.target.value) : undefined })} className="w-24 p-1 border rounded text-sm text-black" />
                            <Button size="sm" variant="ghost" className="text-black" onClick={() => setEditingWorkout({ ...ew, exercises: (ew.exercises || []).filter((_, i) => i !== idx) })}>Remove</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 justify-end">
                    <Button variant="outline" className="text-white" onClick={() => setEditingWorkout(null)} disabled={workoutsSaving}>Cancel</Button>
                    <Button onClick={async () => {
                      if (!ew.name || ew.name.trim() === '') return;
                      const ok = await createOrUpdateWorkout({ id: ew.id, name: ew.name, completed: ew.completed, exercises: ew.exercises });
                      if (ok) setEditingWorkout(null);
                    }} className="bg-[#3C4526] text-white" disabled={workoutsSaving}>{workoutsSaving ? 'Saving…' : 'Save'}</Button>
                  </div>
                </div>
              );
            })()}

            {/* Delete confirmation for workout */}
            {confirmDeleteWorkoutId && (
              <div className="mt-4 p-3 border border-red-100 rounded bg-red-50 text-red-800">
                <div>Are you sure you want to delete this workout?</div>
                  <div className="mt-2 flex gap-2 justify-end">
                    <Button variant="outline" className="text-white" onClick={() => setConfirmDeleteWorkoutId(null)} disabled={!!workoutsDeletingId}>Cancel</Button>
                    <Button className="bg-red-600 text-white" onClick={() => confirmDeleteWorkoutId && deleteWorkout(confirmDeleteWorkoutId)} disabled={!!workoutsDeletingId}>{workoutsDeletingId ? 'Deleting…' : 'Delete'}</Button>
                  </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )}
    </>
  );
}

