"use client"

import { useState } from "react"

interface TargetCalculatorProps {
  totalTasks: number
  completedTasks: number
  completionPercentage: number
}

export function TargetCalculator({ totalTasks, completedTasks, completionPercentage }: TargetCalculatorProps) {
  const [targetPercentage, setTargetPercentage] = useState<number>(completionPercentage + 1)

  const getTasksNeededForTarget = (target: number) => {
    if (totalTasks === 0 || target <= completionPercentage) return 0
    const tasksNeeded = Math.ceil((target / 100) * totalTasks) - completedTasks
    return Math.max(0, tasksNeeded)
  }

  return (
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
  )
}
