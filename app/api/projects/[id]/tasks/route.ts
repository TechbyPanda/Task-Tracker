import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import type { Project } from "@/types/project"

const PROJECTS_FILE = path.join(process.cwd(), "data", "projects.json")

// POST - Update tasks for a specific project
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { tasks } = await request.json()

    // Load existing projects
    const data = await fs.readFile(PROJECTS_FILE, "utf8")
    const { projects } = JSON.parse(data)

    // Find and update the project
    const projectIndex = projects.findIndex((p: Project) => p.id === params.id)
    if (projectIndex === -1) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    projects[projectIndex] = {
      ...projects[projectIndex],
      tasks,
      updatedAt: new Date().toISOString(),
    }

    // Save updated projects
    await fs.writeFile(PROJECTS_FILE, JSON.stringify({ projects }, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating project tasks:", error)
    return NextResponse.json({ error: "Failed to update tasks" }, { status: 500 })
  }
}
