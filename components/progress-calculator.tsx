"use client"

import React, { useMemo, useState } from "react"

interface ProgressCalculatorProps {
  totalTasks: number
  completedTasks: number
}

/**
 * A small utility component that helps the user understand how many additional tasks
 * need to be completed to bump the project progress by a chosen percentage.
 *
 * The user can specify the desired progress increase (in %). The component then
 * calculates the minimal integer number of tasks that have to be marked as done
 * in order to reach **at least** that increase, taking natural rounding of the
 * displayed percentage into account.
 */
export function ProgressCalculator({ totalTasks, completedTasks }: ProgressCalculatorProps) {
  // Desired percentage increase – keep local UI state.
  const [percentIncrease, setPercentIncrease] = useState<number>(1)

  const tasksNeeded = useMemo(() => {
    if (totalTasks === 0) return 0

    // Current progress expressed as a real percentage (0-100).
    const currentPercent = (completedTasks / totalTasks) * 100

    // Clamp the requested increase so we never exceed 100 % total progress.
    const targetPercent = Math.min(100, currentPercent + percentIncrease)

    // Convert target percentage back to an **integer** number of tasks.
    const targetCompleted = Math.ceil((targetPercent / 100) * totalTasks)

    return Math.max(0, targetCompleted - completedTasks)
  }, [completedTasks, percentIncrease, totalTasks])

  // Hide when no tasks exist or everything is already finished.
  if (totalTasks === 0 || completedTasks === totalTasks) return null

  // Helpful helper for pluralisation.
  const taskLabel = tasksNeeded === 1 ? "task" : "tasks"

  return (
    <div className="mt-4 space-y-2">
      <label className="text-sm text-gray-600 flex items-center gap-2">
        Increase progress by
        <input
          type="number"
          value={percentIncrease}
          min={0}
          max={100}
          step={1}
          onChange={(e) => {
            const value = Number(e.target.value)
            if (!Number.isNaN(value)) {
              setPercentIncrease(Math.max(0, Math.min(100, value)))
            }
          }}
          className="w-16 px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        %
      </label>

      {tasksNeeded === 0 ? (
        <div className="text-sm text-gray-700">The project will already meet that goal.</div>
      ) : (
        <div className="text-sm text-gray-700">
          Complete <span className="font-semibold">
            {tasksNeeded} {taskLabel}
          </span>{" "}
          to reach at least {Math.min(100, Math.round(((completedTasks + tasksNeeded) / totalTasks) * 100))}% progress.
        </div>
      )}
    </div>
  )
}
