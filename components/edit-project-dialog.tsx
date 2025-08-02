"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Project } from "@/types/project"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface EditProjectDialogProps {
  open: boolean
  project: Project | null
  onOpenChange: (open: boolean) => void
  onUpdateProject: (
    name: string,
    description?: string,
    startDate?: string,
    endDate?: string
  ) => void
}

export function EditProjectDialog({
  open,
  project,
  onOpenChange,
  onUpdateProject,
}: EditProjectDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  // Populate form fields when a project is selected
  useEffect(() => {
    if (project) {
      setName(project.name || "")
      setDescription(project.description || "")
      setStartDate(project.startDate ? project.startDate.slice(0, 10) : "")
      setEndDate(project.endDate ? project.endDate.slice(0, 10) : "")
    }
  }, [project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !name.trim()) return

    setIsUpdating(true)
    try {
      await onUpdateProject(
        name.trim(),
        description.trim() || undefined,
        startDate || undefined,
        endDate || undefined
      )
    } finally {
      setIsUpdating(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isUpdating) {
      onOpenChange(newOpen)
      if (!newOpen) {
        setName("")
        setDescription("")
        setStartDate("")
        setEndDate("")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {project && (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update the project details and click save when you&apos;re finished.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="Enter project name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isUpdating}
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter project description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isUpdating}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isUpdating}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
