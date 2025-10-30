import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const updateRevisionSchema = z.object({
  status: z.enum(['draft', 'submitted', 'approved', 'rejected'])
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

    // Check if user has permission to update revision status
    const userRole = session.user.role
    if (!['admin', 'pm', 'client'].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await req.json()
    const { status } = updateRevisionSchema.parse(body)

    // Get revision with phase info
    const existingRevision = await db.revision.findUnique({
      where: { id: params.id },
      include: {
        phase: {
          include: {
            project: true
          }
        }
      }
    })

    if (!existingRevision) {
      return NextResponse.json({ error: "Revision not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = { status }
    
    // Add timestamps based on status
    const now = new Date()
    if (status === 'submitted' && existingRevision.status !== 'submitted') {
      updateData.submittedAt = now
    }
    if (['approved', 'rejected'].includes(status) && !['approved', 'rejected'].includes(existingRevision.status)) {
      updateData.decidedAt = now
    }

    const revision = await db.revision.update({
      where: { id: params.id },
      data: updateData,
      include: {
        attachments: true
      }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        projectId: existingRevision.phase.projectId,
        actorId: session.user.id,
        action: `UPDATE_REVISION_STATUS`,
        payload: {
          revisionId: revision.id,
          revisionLabel: revision.label,
          oldStatus: existingRevision.status,
          newStatus: status,
          phaseId: existingRevision.phaseId
        }
      }
    })

    return NextResponse.json(revision)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to update revision:", error)
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

    // Check if user has permission to delete revisions
    const userRole = session.user.role
    if (!['admin', 'pm'].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get revision with phase info
    const existingRevision = await db.revision.findUnique({
      where: { id: params.id },
      include: {
        phase: {
          include: {
            project: true
          }
        }
      }
    })

    if (!existingRevision) {
      return NextResponse.json({ error: "Revision not found" }, { status: 404 })
    }

    // Only allow deletion of draft revisions
    if (existingRevision.status !== 'draft') {
      return NextResponse.json(
        { error: "Can only delete draft revisions" },
        { status: 400 }
      )
    }

    await db.revision.delete({
      where: { id: params.id }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        projectId: existingRevision.phase.projectId,
        actorId: session.user.id,
        action: `DELETE_REVISION`,
        payload: {
          revisionId: existingRevision.id,
          revisionLabel: existingRevision.label,
          phaseId: existingRevision.phaseId
        }
      }
    })

    return NextResponse.json({ message: "Revision deleted successfully" })
  } catch (error) {
    console.error("Failed to delete revision:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}