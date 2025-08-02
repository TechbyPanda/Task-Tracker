import type { Task } from "./task"

export interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  tasks: Task[]
  startDate?: string
  endDate?: string
}
