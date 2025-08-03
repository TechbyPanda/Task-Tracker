"use client"

import { useState } from "react"
import Link from "next/link"
import type { Project } from "@/types/project"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreVertical, Trash2, Calendar, CheckCircle2, Circle, SquarePen } from "lucide-react"

interface ProjectCardProps {
  project: Project
  onDelete: (projectId: string) => void
  onEdit: (project: Project) => void
}

export function ProjectCard({ project, onDelete, onEdit }: ProjectCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const totalTasks = countTasks(project.tasks)
  const completedTasks = countCompletedTasks(project.tasks)
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  function countTasks(tasks: any[]): number {
    return tasks.reduce((count, task) => {
      return count + 1 + countTasks(task.subtasks || [])
    }, 0)
  }

  function countCompletedTasks(tasks: any[]): number {
    return tasks.reduce((count, task) => {
      const taskCount = task.done ? 1 : 0
      return count + taskCount + countCompletedTasks(task.subtasks || [])
    }, 0)
  }

  const handleDelete = () => {
    onDelete(project.id)
    setShowDeleteDialog(false)
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold line-clamp-2">{project.name}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(project)} className="text-blue-600 focus:text-blue-600">
                  <SquarePen className="w-4 h-4 mr-2" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 focus:text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {project.description && <p className="text-sm text-gray-600 line-clamp-2 mt-1">{project.description}</p>}
        </CardHeader>

        <CardContent className="pb-3">
          <div className="space-y-3">
            {/* Task Statistics */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Tasks: {totalTasks}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">Done: {completedTasks}</span>
              </div>
            </div>

            {/* Progress Bar */}
            {totalTasks > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Progress</span>
                  <span>{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Status Badge */}
            <div className="flex justify-between items-center">
              <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
                {completionPercentage === 100 ? "Completed" : "In Progress"}
              </Badge>
              <div className="flex items-center text-xs text-gray-500 gap-1">
                <Calendar className="w-3 h-3" />
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A"}
                {"-"}
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : ""}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-3">
          <Link href={`/projects/${project.id}`} className="w-full">
            <Button className="w-full">Open Project</Button>
          </Link>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be undone and will permanently delete
              all tasks in this project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
