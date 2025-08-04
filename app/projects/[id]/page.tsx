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
import { ProgressCalculator } from "@/components/progress-calculator"

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [newTaskName, setNewTaskName] = useState("")
  const [loading, setLoading] = useState(true)
  const [targetPercentage, setTargetPercentage] = useState<number>(0)

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
  
  // Calculate total days
  let totalDaysDisplay: string | null = null
  if (project?.startDate && project?.endDate) {
    const startDate = new Date(project.startDate)
    const endDate = new Date(project.endDate)
    const diffMs = endDate.getTime() - startDate.getTime()
    const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    totalDaysDisplay = `${totalDays} days`
  }

  // Calculate progress status
  let progressStatus: { status: string; color: string } | null = null
  if (project?.startDate && project?.endDate && totalTasks > 0) {
    const startDate = new Date(project.startDate)
    const endDate = new Date(project.endDate)
    const now = new Date()
    
    const totalProjectDuration = endDate.getTime() - startDate.getTime()
    const elapsedDuration = now.getTime() - startDate.getTime()
    const expectedProgress = Math.max(0, Math.min(100, (elapsedDuration / totalProjectDuration) * 100))
    
    const progressDiff = completionPercentage - expectedProgress
    
    if (now > endDate) {
      progressStatus = {
        status: completionPercentage === 100 ? "Completed" : "Overdue",
        color: completionPercentage === 100 ? "text-green-600" : "text-red-600"
      }
    } else if (progressDiff > 5) {
      const aheadPercentage = Math.round(progressDiff)
      progressStatus = { status: `Ahead by ${aheadPercentage}%`, color: "text-green-600" }
    } else if (progressDiff < -5) {
      const behindPercentage = Math.round(Math.abs(progressDiff))
      const totalDays = Math.ceil(totalProjectDuration / (1000 * 60 * 60 * 24))
      const behindDays = Math.round((behindPercentage / 100) * totalDays)
      progressStatus = { status: `Behind by ${behindPercentage}% (~${behindDays} days)`, color: "text-red-600" }
    } else {
      progressStatus = { status: "On Track", color: "text-blue-600" }
    }
  }
  
  // Calculate motivational message
  let motivationalMessage: string | null = null
  if (totalTasks > 0 && completedTasks < totalTasks) {
    const nextMilestone = Math.ceil(completionPercentage / 10) * 10
    if (nextMilestone > completionPercentage && nextMilestone <= 100) {
      const tasksNeededForNextMilestone = Math.ceil((nextMilestone / 100) * totalTasks) - completedTasks
      if (tasksNeededForNextMilestone === 1) {
        motivationalMessage = `🎯 Complete 1 more task to reach ${nextMilestone}%!`
      } else if (tasksNeededForNextMilestone <= 5) {
        motivationalMessage = `🚀 Complete ${tasksNeededForNextMilestone} more tasks to reach ${nextMilestone}%!`
      }
    }
  }

  // Calculate tasks needed for target percentage
  const getTasksNeededForTarget = (target: number) => {
    if (totalTasks === 0 || target <= completionPercentage) return 0
    const tasksNeeded = Math.ceil((target / 100) * totalTasks) - completedTasks
    return Math.max(0, tasksNeeded)
  }
  
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
                  {totalDaysDisplay && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Duration: {totalDaysDisplay}</span>
                    </div>
                  )}
                  {progressStatus && (
                    <div className="flex items-center gap-2">
                      <Circle className={`w-4 h-4 ${progressStatus.color}`} />
                      <span className={progressStatus.color}>{progressStatus.status}</span>
                    </div>
                  )}
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
                    {motivationalMessage && (
                      <div className="mt-2 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                        {motivationalMessage}
                      </div>
                    )}
                    
                    {/* Target Calculator */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">To reach</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={targetPercentage}
                          onChange={(e) => setTargetPercentage(Number(e.target.value))}
                          className="w-16 px-2 py-1 border rounded text-center"
                          placeholder="50"
                        />
                        <span className="text-gray-600">% completion, you need</span>
                        <span className="font-semibold text-blue-600">
                          {targetPercentage > 0 && targetPercentage <= 100 
                            ? `${getTasksNeededForTarget(targetPercentage)} more tasks`
                            : "enter target %"
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress Calculator */}
                {/* <ProgressCalculator totalTasks={totalTasks} completedTasks={completedTasks} /> */}
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
