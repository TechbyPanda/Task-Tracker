"use client"

import type React from "react"

import { useState } from "react"
import type { Task } from "@/types/task"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, ChevronRight, ChevronDown } from "lucide-react"

interface TaskTreeProps {
  task: Task
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onAddSubtask: (parentId: string, subtaskName: string) => void
  onDeleteTask: (taskId: string) => void
  level: number
}

export function TaskTree({ task, onUpdateTask, onAddSubtask, onDeleteTask, level }: TaskTreeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [newSubtaskName, setNewSubtaskName] = useState("")

  const handleToggleDone = (checked: boolean) => {
    onUpdateTask(task.id, { done: checked })
  }

  // Add helper function to determine checkbox state
  const getCheckboxState = () => {
    if (task.subtasks.length === 0) {
      return task.done
    }

    const completedSubtasks = countCompletedSubtasks(task.subtasks)
    const totalSubtasks = countTotalSubtasks(task.subtasks)

    if (completedSubtasks === totalSubtasks && totalSubtasks > 0) {
      return true
    } else if (completedSubtasks === 0) {
      return false
    } else {
      return "indeterminate" // Mixed state
    }
  }

  const countTotalSubtasks = (tasks: Task[]): number => {
    return tasks.reduce((count, task) => {
      return count + 1 + countTotalSubtasks(task.subtasks || [])
    }, 0)
  }

  const countCompletedSubtasks = (tasks: Task[]): number => {
    return tasks.reduce((count, task) => {
      const taskCount = task.done ? 1 : 0
      return count + taskCount + countCompletedSubtasks(task.subtasks || [])
    }, 0)
  }

  const checkboxState = getCheckboxState()

  const handleAddSubtask = () => {
    if (!newSubtaskName.trim()) return

    onAddSubtask(task.id, newSubtaskName)
    setNewSubtaskName("")
    setIsAddingSubtask(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddSubtask()
    } else if (e.key === "Escape") {
      setIsAddingSubtask(false)
      setNewSubtaskName("")
    }
  }

  const indentClass = `ml-${level * 6}`
  const hasSubtasks = task.subtasks.length > 0

  return (
    <div className="select-none">
      {/* Main task row */}
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded hover:bg-gray-50 group ${indentClass}`}
        style={{ marginLeft: `${level * 24}px` }}
      >
        {/* Expand/collapse button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-6 h-6 p-0 hover:bg-gray-200"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={!hasSubtasks && !isAddingSubtask}
        >
          {hasSubtasks || isAddingSubtask ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </Button>

        {/* Checkbox */}
        <Checkbox
          checked={checkboxState === true}
          onCheckedChange={handleToggleDone}
          className="flex-shrink-0"
          ref={(ref) => {
            if (ref) {
              ref.indeterminate = checkboxState === "indeterminate"
            }
          }}
        />

        {/* Task name */}
        <span
          className={`flex-1 text-sm ${
            task.done
              ? "line-through text-gray-500"
              : checkboxState === "indeterminate"
                ? "text-blue-600 font-medium"
                : "text-gray-900"
          }`}
        >
          {task.name}
          {checkboxState === "indeterminate" && (
            <span className="ml-2 text-xs text-blue-500 font-normal">
              ({countCompletedSubtasks(task.subtasks)}/{countTotalSubtasks(task.subtasks)})
            </span>
          )}
        </span>

        {/* Action buttons */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 hover:bg-green-100 hover:text-green-600"
            onClick={() => setIsAddingSubtask(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 hover:bg-red-100 hover:text-red-600"
            onClick={() => onDeleteTask(task.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div>
          {/* Add subtask input */}
          {isAddingSubtask && (
            <div className="flex gap-2 py-2 px-3 ml-6" style={{ marginLeft: `${(level + 1) * 24}px` }}>
              <div className="w-6" /> {/* Spacer for expand button */}
              <Input
                placeholder="Enter subtask name..."
                value={newSubtaskName}
                onChange={(e) => setNewSubtaskName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (!newSubtaskName.trim()) {
                    setIsAddingSubtask(false)
                  }
                }}
                className="flex-1 h-8 text-sm"
                autoFocus
              />
              <Button size="sm" onClick={handleAddSubtask} disabled={!newSubtaskName.trim()} className="h-8 px-3">
                Add
              </Button>
            </div>
          )}

          {/* Subtasks */}
          {task.subtasks.map((subtask) => (
            <TaskTree
              key={subtask.id}
              task={subtask}
              onUpdateTask={onUpdateTask}
              onAddSubtask={onAddSubtask}
              onDeleteTask={onDeleteTask}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
