"use client"

import React, { useEffect, useState } from "react"
import DashboardLayout from "@/app/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

type Exercise = { name: string; reps?: string }
type Template = { id: string; name: string; notes?: string; exercises?: Exercise[] }
type Trainer = { id: string; name: string; email?: string }

export default function WorkoutsManagerPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [trainers, setTrainers] = useState<Trainer[]>([])

  const [name, setName] = useState("")
  const [notes, setNotes] = useState("")
  const [exercisesText, setExercisesText] = useState("")

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
    fetchTrainers()
  }, [])

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/workouts/templates/getAll")
      const json = await res.json()
      if (json?.templates) setTemplates(json.templates)
    } catch {
      // ignore silently, show small message
    }
  }

  async function fetchTrainers() {
    try {
      const res = await fetch("/api/trainers/getAll")
      const json = await res.json()
      if (json?.trainers) setTrainers(json.trainers)
    } catch {
      // ignore silently
    }
  }

  function parseExercises(text: string): Exercise[] {
    // simple parser: each line "Name - reps"
    return text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const parts = l.split("-")
        return { name: parts[0].trim(), reps: (parts[1] || "").trim() }
      })
  }

  async function createTemplate() {
    setError(null)
    setSuccess(null)
    if (!name.trim()) return setError("Please provide a template name")
    setLoading(true)
    try {
      const payload = { name: name.trim(), notes: notes.trim(), exercises: parseExercises(exercisesText) }
      const res = await fetch("/api/workouts/templates/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json?.template) {
        setError(json?.message || "Create failed")
      } else {
        setSuccess("Template created")
        setName("")
        setNotes("")
        setExercisesText("")
        fetchTemplates()
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  async function assignTemplate() {
    setError(null)
    setSuccess(null)
    if (!selectedTemplate) return setError("Select a template")
    if (!selectedTrainer) return setError("Select a trainer")
    setLoading(true)
    try {
      const res = await fetch("/api/workouts/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selectedTemplate, trainerId: selectedTrainer }),
      })
      const json = await res.json()
      if (!res.ok || !json?.success) {
        setError(json?.message || "Assign failed")
      } else {
        setSuccess("Template assigned")
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Workouts Manager</h1>
          <Link href="/dashboard/workouts/create">
            <Button className="bg-[#3C4526] hover:bg-[#2d331c]">
              <Plus className="h-4 w-4 mr-2" />
              Create Workout Plan
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium">Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 p-2 border rounded text-sm text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full mt-1 p-2 border rounded text-sm text-black" rows={4} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Exercises (one per line: \"Name - reps\")</label>
                  <textarea value={exercisesText} onChange={(e) => setExercisesText(e.target.value)} className="w-full mt-1 p-2 border rounded text-sm text-black" rows={6} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={createTemplate} disabled={loading}>{loading ? "Saving..." : "Create"}</Button>
                  <Button variant="ghost" onClick={() => { setName(""); setNotes(""); setExercisesText("") }}>Reset</Button>
                </div>
                {error && <div className="text-sm text-red-600">{error}</div>}
                {success && <div className="text-sm text-green-700">{success}</div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Templates & Assign</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium">Select Template</label>
                  <select value={selectedTemplate ?? ""} onChange={(e) => setSelectedTemplate(e.target.value || null)} className="w-full mt-1 p-2 border rounded text-black">
                    <option value="">-- select --</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">Select Trainer</label>
                  <select value={selectedTrainer ?? ""} onChange={(e) => setSelectedTrainer(e.target.value || null)} className="w-full mt-1 p-2 border rounded text-black">
                    <option value="">-- select --</option>
                    {trainers.map((tr) => (
                      <option key={tr.id} value={tr.id}>{tr.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={assignTemplate} disabled={loading || !selectedTemplate || !selectedTrainer}>{loading ? "Assigning..." : "Assign to Trainer"}</Button>
                </div>

                <div className="pt-3">
                  <h3 className="text-sm font-medium">Available templates</h3>
                  <ul className="mt-2 space-y-2">
                    {templates.map((t) => (
                      <li key={t.id} className="p-2 border rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{t.name}</div>
                            {t.notes && <div className="text-sm text-gray-600">{t.notes}</div>}
                          </div>
                          <div className="text-sm text-gray-500">{t.exercises?.length ?? 0} exercises</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}
                {success && <div className="text-sm text-green-700">{success}</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
