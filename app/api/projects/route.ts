import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import type { Project } from "@/types/project"

const PROJECTS_FILE = path.join(process.cwd(), "data", "projects.json")

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), "data")
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// GET - Load all projects
export async function GET() {
  try {
    await ensureDataDirectory()

    try {
      const data = await fs.readFile(PROJECTS_FILE, "utf8")
      return NextResponse.json(JSON.parse(data))
    } catch (error) {
      // File doesn't exist, return empty projects
      return NextResponse.json({ projects: [] })
    }
  } catch (error) {
    console.error("Error loading projects:", error)
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 })
  }
}

// POST - Create new project
export async function POST(request: NextRequest) {
  try {
    await ensureDataDirectory()

    const { name, description, startDate, endDate } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    // Load existing projects
    let projects: Project[] = []
    try {
      const data = await fs.readFile(PROJECTS_FILE, "utf8")
      projects = JSON.parse(data).projects || []
    } catch {
      // File doesn't exist, start with empty array
    }

    // Create new project
    const newProject: Project = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: [],
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
    }

    projects.push(newProject)

    // Save updated projects
    await fs.writeFile(PROJECTS_FILE, JSON.stringify({ projects }, null, 2))

    return NextResponse.json({ project: newProject })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
