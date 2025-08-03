"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { TaskTree } from "@/components/task-tree"
import type { Project } from "@/types/project"
import type { Task } from "@/types/task"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Calendar, CheckCircle2, Circle, Clock } from "lucide-react"

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [newTaskName, setNewTaskName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId])

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error("Failed to load project:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const saveTasks = async (updatedTasks: Task[]) => {
    if (!project) return

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tasks: updatedTasks }),
      })

      if (response.ok) {
        setProject({ ...project, tasks: updatedTasks })
      }
    } catch (error) {
      console.error("Failed to save tasks:", error)
    }
  }

  const addRootTask = () => {
    if (!newTaskName.trim() || !project) return

    const newTask: Task = {
      id: Date.now().toString(),
      name: newTaskName.trim(),
      done: false,
      subtasks: [],
    }

    const updatedTasks = [...project.tasks, newTask]
    saveTasks(updatedTasks)
    setNewTaskName("")
  }

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    if (!project) return

    const updateTaskRecursive = (taskList: Task[]): Task[] => {
      return taskList.map((task) => {
        if (task.id === taskId) {
          const updatedTask = { ...task, ...updates }

          // If the task is being checked/unchecked, cascade to all subtasks
          if ("done" in updates) {
            updatedTask.subtasks = cascadeToSubtasks(updatedTask.subtasks, updates.done!)
          }

          return updatedTask
        }
        if (task.subtasks.length > 0) {
          const updatedSubtasks = updateTaskRecursive(task.subtasks)
          const updatedTask = { ...task, subtasks: updatedSubtasks }

          // Check if parent task status should be updated based on subtasks
          const allSubtasksDone = updatedSubtasks.length > 0 && updatedSubtasks.every((subtask) => subtask.done)
          const noSubtasksDone = updatedSubtasks.every((subtask) => !subtask.done)

          // Update parent task status based on subtasks
          if (updatedSubtasks.length > 0) {
            if (allSubtasksDone && !updatedTask.done) {
              updatedTask.done = true
            } else if (noSubtasksDone && updatedTask.done) {
              updatedTask.done = false
            } else if (!allSubtasksDone && !noSubtasksDone) {
              // Mixed state - if parent was auto-checked, uncheck it
              // but don't uncheck if user manually checked it
              // For simplicity, we'll leave mixed states as-is
            }
          }

          return updatedTask
        }
        return task
      })
    }

    // Helper function to cascade done status to all subtasks
    const cascadeToSubtasks = (subtasks: Task[], done: boolean): Task[] => {
      return subtasks.map((subtask) => ({
        ...subtask,
        done,
        subtasks: cascadeToSubtasks(subtask.subtasks, done),
      }))
    }

    const updatedTasks = updateTaskRecursive(project.tasks)
    saveTasks(updatedTasks)
  }

  const addSubtask = (parentId: string, subtaskName: string) => {
    if (!project) return

    const newSubtask: Task = {
      id: Date.now().toString(),
      name: subtaskName.trim(),
      done: false,
      subtasks: [],
    }

    const addSubtaskRecursive = (taskList: Task[]): Task[] => {
      return taskList.map((task) => {
        if (task.id === parentId) {
          return {
            ...task,
            subtasks: [...task.subtasks, newSubtask],
          }
        }
        if (task.subtasks.length > 0) {
          return {
            ...task,
            subtasks: addSubtaskRecursive(task.subtasks),
          }
        }
        return task
      })
    }

    const updatedTasks = addSubtaskRecursive(project.tasks)
    saveTasks(updatedTasks)
  }

  const deleteTask = (taskId: string) => {
    if (!project) return

    const deleteTaskRecursive = (taskList: Task[]): Task[] => {
      return taskList.filter((task) => {
        if (task.id === taskId) {
          return false
        }
        if (task.subtasks.length > 0) {
          task.subtasks = deleteTaskRecursive(task.subtasks)
        }
        return true
      })
    }

    const updatedTasks = deleteTaskRecursive(project.tasks)
    saveTasks(updatedTasks)
  }

  // Calculate statistics
  const totalTasks = project ? countTasks(project.tasks) : 0
  const completedTasks = project ? countCompletedTasks(project.tasks) : 0
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Date displays
  const startDateDisplay = project?.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A"
  const endDateDisplay = project?.endDate ? new Date(project.endDate).toLocaleDateString() : "N/A"
  let timeLeftDisplay: string | null = null
  if (project?.endDate) {
    const diffMs = new Date(project.endDate).getTime() - Date.now()
    if (diffMs > 0) {
      const days = Math.floor(diffMs / 86400000)
      const hours = Math.floor((diffMs % 86400000) / 3600000)
      timeLeftDisplay = `${days}d ${hours}h left`
    } else {
      timeLeftDisplay = "Ended"
    }
  }

  function countTasks(tasks: Task[]): number {
    return tasks.reduce((count, task) => {
      return count + 1 + countTasks(task.subtasks || [])
    }, 0)
  }

  function countCompletedTasks(tasks: Task[]): number {
    return tasks.reduce((count, task) => {
      const taskCount = task.done ? 1 : 0
      return count + taskCount + countCompletedTasks(task.subtasks || [])
    }, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading project...</div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Project not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h1>
                {project.description && <p className="text-gray-600 mb-4">{project.description}</p>}

                {/* Project Statistics */}
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Circle className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Total: {totalTasks}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">Completed: {completedTasks}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Start: {startDateDisplay}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">End: {endDateDisplay}</span>
                  </div>
                  {timeLeftDisplay && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{timeLeftDisplay}</span>
                    </div>
                  )}
                  <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
                    {completionPercentage}% Complete
                  </Badge>
                </div>

                {/* Progress Bar */}
                {totalTasks > 0 && (
                  <div className="mt-4 max-w-md">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Add new task */}
          <div className="p-6 border-b bg-gray-50">
            <div className="flex gap-2">
              <Input
                placeholder="Add a new task..."
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addRootTask()
                  }
                }}
                className="flex-1"
              />
              <Button onClick={addRootTask} disabled={!newTaskName.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>

          {/* Task tree */}
          <div className="p-6">
            <div className="space-y-1">
              {project.tasks.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No tasks yet. Add your first task above!</div>
              ) : (
                project.tasks.map((task) => (
                  <TaskTree
                    key={task.id}
                    task={task}
                    onUpdateTask={updateTask}
                    onAddSubtask={addSubtask}
                    onDeleteTask={deleteTask}
                    level={0}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
