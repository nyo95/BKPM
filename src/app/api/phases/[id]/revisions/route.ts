import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const createRevisionSchema = z.object({
  label: z.string().min(1),
  notes: z.string().optional()
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

    const revisions = await db.revision.findMany({
      where: {
        phaseId: params.id
      },
      include: {
        attachments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(revisions)
  } catch (error) {
    console.error("Failed to fetch revisions:", error)
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

    // Check if user has permission to create revisions
    const userRole = session.user.role
    if (!['admin', 'pm', 'designer'].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await req.json()
    const { label, notes } = createRevisionSchema.parse(body)

    // Get phase info to verify it exists
    const phase = await db.phase.findUnique({
      where: { id: params.id }
    })

    if (!phase) {
      return NextResponse.json({ error: "Phase not found" }, { status: 404 })
    }

    const revision = await db.revision.create({
      data: {
        phaseId: params.id,
        label,
        notes,
        status: 'draft',
        createdBy: session.user.id
      },
      include: {
        attachments: true
      }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        projectId: phase.projectId,
        actorId: session.user.id,
        action: `CREATE_REVISION`,
        payload: {
          revisionId: revision.id,
          revisionLabel: revision.label,
          phaseId: params.id
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

    console.error("Failed to create revision:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}