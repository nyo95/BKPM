import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const createMaterialSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(2),
  category: z.string().min(1),
  vendor: z.string().optional(),
  url: z.string().optional(),
  price: z.number().optional(),
  status: z.enum(["sampled", "approved", "replaced", "obsolete"]).default("sampled"),
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

    const materials = await db.materialItem.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(materials)
  } catch (error) {
    console.error("Failed to fetch materials:", error)
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
    const { code, name, category, vendor, url, price, status, notes } = createMaterialSchema.parse(body)

    const material = await db.materialItem.create({
      data: {
        code,
        name,
        category,
        vendor,
        url,
        price,
        status,
        notes,
        projectId: params.id
      }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        projectId: params.id,
        actorId: session.user.id,
        action: "CREATE_MATERIAL",
        payload: {
          materialId: material.id,
          materialCode: material.code,
          materialName: material.name
        }
      }
    })

    return NextResponse.json(material)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to create material:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}