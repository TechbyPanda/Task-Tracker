import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import type { Project } from "@/types/project"

const PROJECTS_FILE = path.join(process.cwd(), "data", "projects.json")

// GET - Load specific project
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await fs.readFile(PROJECTS_FILE, "utf8")
    const { projects } = JSON.parse(data)
    const project = projects.find((p: Project) => p.id === params.id)

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Error loading project:", error)
    return NextResponse.json({ error: "Failed to load project" }, { status: 500 })
  }
}

// PUT - Update project
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, description, startDate, endDate } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    const data = await fs.readFile(PROJECTS_FILE, "utf8")
    const { projects } = JSON.parse(data)

    const projectIndex = projects.findIndex((p: Project) => p.id === params.id)
    if (projectIndex === -1) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const updatedProject: Project = {
      ...projects[projectIndex],
      name: name.trim(),
      description: description?.trim(),
      startDate: startDate ? new Date(startDate).toISOString() : projects[projectIndex].startDate,
      endDate: endDate ? new Date(endDate).toISOString() : projects[projectIndex].endDate,
      updatedAt: new Date().toISOString(),
    }

    projects[projectIndex] = updatedProject

    await fs.writeFile(PROJECTS_FILE, JSON.stringify({ projects }, null, 2))

    return NextResponse.json({ project: updatedProject })
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

// DELETE - Delete project
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await fs.readFile(PROJECTS_FILE, "utf8")
    const { projects } = JSON.parse(data)
    const filteredProjects = projects.filter((p: Project) => p.id !== params.id)

    await fs.writeFile(PROJECTS_FILE, JSON.stringify({ projects: filteredProjects }, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}
