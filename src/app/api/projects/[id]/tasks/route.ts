import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  phaseId: z.string().optional(),
  status: z.enum(["backlog", "in_progress", "review", "done"]).default("backlog"),
  assigneeId: z.string().optional(),
  startDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  dueDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  progress: z.number().min(0).max(100).default(0)
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tasks = await db.task.findMany({
      where: { projectId: params.id },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        phase: {
          select: {
            id: true,
            name: true,
            key: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { order: 'asc' }
      ]
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Failed to fetch tasks:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, phaseId, status, assigneeId, startDate, dueDate, progress } = createTaskSchema.parse(body)

    // Get the highest order for the status to place new task at the end
    const maxOrder = await db.task.findFirst({
      where: { 
        projectId: params.id,
        status: status
      },
      orderBy: { order: 'desc' }
    })

    const task = await db.task.create({
      data: {
        title,
        description,
        projectId: params.id,
        phaseId,
        status,
        assigneeId,
        startDate,
        dueDate,
        progress,
        order: (maxOrder?.order || 0) + 1
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        phase: {
          select: {
            id: true,
            name: true,
            key: true
          }
        }
      }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        projectId: params.id,
        actorId: session.user.id,
        action: "CREATE_TASK",
        payload: {
          taskId: task.id,
          taskTitle: task.title
        }
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to create task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}