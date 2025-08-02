"use client"

import { useState, useEffect } from "react"
import { ProjectCard } from "@/components/project-card"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { EditProjectDialog } from "@/components/edit-project-dialog"
import type { Project } from "@/types/project"
import { Button } from "@/components/ui/button"
import { Plus, FolderOpen } from "lucide-react"

export default function ProjectDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error("Failed to load projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (
    name: string,
    description?: string,
    startDate?: string,
    endDate?: string
  ) => {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description, startDate, endDate }),
      })

      if (response.ok) {
        loadProjects()
        setIsCreateDialogOpen(false)
      }
    } catch (error) {
      console.error("Failed to create project:", error)
    }
  }

  const deleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        loadProjects()
      }
    } catch (error) {
      console.error("Failed to delete project:", error)
    }
  }

  const updateProject = async (
    projectId: string,
    name: string,
    description?: string,
    startDate?: string,
    endDate?: string
  ) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description, startDate, endDate }),
      })

      if (response.ok) {
        loadProjects()
        setEditingProject(null)
      }
    } catch (error) {
      console.error("Failed to update project:", error)
    }
  }

  const editProject = (project: Project) => {
    setEditingProject(project)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading projects...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Dashboard</h1>
              <p className="text-gray-600">Manage your projects and tasks</p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Create your first project to start organizing your tasks</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="mx-auto flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={deleteProject} onEdit={editProject} />
            ))}
          </div>
        )}

        <CreateProjectDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onCreateProject={createProject}
        />

        <EditProjectDialog
          open={!!editingProject}
          project={editingProject}
          onOpenChange={(open) => {
            if (!open) setEditingProject(null)
          }}
          onUpdateProject={(name, description, startDate, endDate) => {
            if (editingProject) {
              updateProject(editingProject.id, name, description, startDate, endDate)
            }
          }}
        />
      </div>
    </div>
  )
}
