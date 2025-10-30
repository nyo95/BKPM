import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { calculatePhaseProgress, calculatePhaseStatus } from "@/lib/progress"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get phase with tasks
    const phase = await db.phase.findUnique({
      where: { id: params.id },
      include: {
        tasks: true,
        project: {
          select: {
            id: true,
            startDate: true,
            endDate: true
          }
        }
      }
    })

    if (!phase) {
      return NextResponse.json({ error: "Phase not found" }, { status: 404 })
    }

    // Calculate new progress
    const newProgress = calculatePhaseProgress(phase.tasks)

    // Update phase progress
    const updatedPhase = await db.phase.update({
      where: { id: params.id },
      data: { progress: newProgress }
    })

    // Update project progress
    const allPhases = await db.phase.findMany({
      where: { projectId: phase.project.id },
      select: { weight: true, progress: true }
    })

    const projectProgress = Math.round(
      allPhases.reduce((sum, p) => sum + (p.progress * p.weight), 0) / 
      allPhases.reduce((sum, p) => sum + p.weight, 0)
    )

    const projectStatus = calculatePhaseStatus(
      phase.startDate || undefined,
      phase.dueDate || undefined,
      newProgress
    )

    // Update project (if needed - this would be handled by a separate call)
    // For now, just return the updated phase

    // Log activity
    await db.activityLog.create({
      data: {
        projectId: phase.project.id,
        actorId: session.user.id,
        action: "UPDATE_PHASE_PROGRESS",
        payload: {
          phaseId: params.id,
          oldProgress: phase.progress,
          newProgress,
          taskCount: phase.tasks.length
        }
      }
    })

    return NextResponse.json({
      phase: updatedPhase,
      projectProgress,
      projectStatus
    })
  } catch (error) {
    console.error("Failed to update phase progress:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}