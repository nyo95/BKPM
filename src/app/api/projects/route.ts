import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const createProjectSchema = z.object({
  name: z.string().min(2),
  clientName: z.string().min(2),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  description: z.string().optional()
})

// Calculate project progress based on phases
function calculateProjectProgress(phases: Array<{ weight: number; progress: number }>) {
  if (phases.length === 0) return 0
  
  const totalWeight = phases.reduce((sum, phase) => sum + phase.weight, 0)
  const weightedProgress = phases.reduce((sum, phase) => sum + (phase.progress * phase.weight), 0)
  
  return Math.round(weightedProgress / totalWeight)
}

// Calculate project status based on timeline and progress
function calculateProjectStatus(startDate: Date, endDate?: Date, progress: number): 'on_track' | 'at_risk' | 'delayed' {
  const now = new Date()
  const totalTime = endDate ? endDate.getTime() - startDate.getTime() : now.getTime() - startDate.getTime()
  const elapsedTime = now.getTime() - startDate.getTime()
  const timeRatio = elapsedTime / totalTime
  
  if (endDate && now > endDate && progress < 100) {
    return 'delayed'
  }
  
  if (timeRatio > 0.8 && progress < 80) {
    return 'at_risk'
  }
  
  return 'on_track'
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await db.project.findMany({
      where: {
        // Filter by organization in a real app
      },
      include: {
        phases: {
          select: {
            weight: true,
            progress: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate progress and status for each project
    const projectsWithStatus = projects.map(project => {
      const progress = calculateProjectProgress(project.phases)
      const status = calculateProjectStatus(project.startDate, project.endDate || undefined, progress)
      
      return {
        ...project,
        progress,
        status,
        phases: project.phases
      }
    })

    return NextResponse.json(projectsWithStatus)
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, clientName, startDate, endDate, description } = createProjectSchema.parse(body)

    // Generate project code
    const dateStr = startDate.toISOString().slice(0, 10).replace(/-/g, '')
    const typeCode = 'INT' // Interior project type
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    const code = `${dateStr}-${typeCode}-${randomSuffix}`

    const project = await db.project.create({
      data: {
        name,
        code,
        clientName,
        startDate,
        endDate,
        description,
        createdBy: session.user.id
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to create project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}