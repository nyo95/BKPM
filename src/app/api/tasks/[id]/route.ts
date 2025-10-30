import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(["backlog", "in_progress", "review", "done"]).optional(),
  assigneeId: z.string().optional(),
  startDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  dueDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  progress: z.number().min(0).max(100).optional()
})

const moveTaskSchema = z.object({
  status: z.enum(["backlog", "in_progress", "review", "done"]),
  order: z.number().min(0)
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { action, ...data } = body

    if (action === "move") {
      const { status, order } = moveTaskSchema.parse(data)
      
      // Get the task to find its project
      const task = await db.task.findUnique({
        where: { id: params.id },
        select: { projectId: true }
      })

      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 })
      }

      // Update task status and order
      const updatedTask = await db.task.update({
        where: { id: params.id },
        data: { status, order },
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

      // Reorder other tasks in the old and new columns
      await reorderTasks(task.projectId, status)

      // Log activity
      await db.activityLog.create({
        data: {
          projectId: task.projectId,
          actorId: session.user.id,
          action: "MOVE_TASK",
          payload: {
            taskId: params.id,
            newStatus: status,
            newOrder: order
          }
        }
      })

      return NextResponse.json(updatedTask)
    } else {
      // Regular update
      const updateData = updateTaskSchema.parse(data)
      
      const task = await db.task.findUnique({
        where: { id: params.id },
        select: { projectId: true }
      })

      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 })
      }

      const updatedTask = await db.task.update({
        where: { id: params.id },
        data: updateData,
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
          projectId: task.projectId,
          actorId: session.user.id,
          action: "UPDATE_TASK",
          payload: {
            taskId: params.id,
            updatedFields: Object.keys(updateData)
          }
        }
      })

      return NextResponse.json(updatedTask)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to update task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const task = await db.task.findUnique({
      where: { id: params.id },
      select: { projectId: true }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    await db.task.delete({
      where: { id: params.id }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        projectId: task.projectId,
        actorId: session.user.id,
        action: "DELETE_TASK",
        payload: {
          taskId: params.id
        }
      }
    })

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Failed to delete task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function reorderTasks(projectId: string, status: string) {
  const tasks = await db.task.findMany({
    where: { 
      projectId,
      status
    },
    orderBy: { order: 'asc' }
  })

  for (let i = 0; i < tasks.length; i++) {
    await db.task.update({
      where: { id: tasks[i].id },
      data: { order: i + 1 }
    })
  }
}