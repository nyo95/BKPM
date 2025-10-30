import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// PDF generation would typically use a library like pdfmake or puppeteer
// For this example, we'll create a simple PDF-like response

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get project with all related data
    const project = await db.project.findUnique({
      where: { id: params.id },
      include: {
        phases: {
          include: {
            revisions: {
              orderBy: { createdAt: 'desc' },
              take: 3 // Latest 3 revisions per phase
            },
            tasks: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        materials: {
          orderBy: { createdAt: 'desc' }
        },
        activity: {
          orderBy: { createdAt: 'desc' },
          take: 20 // Latest 20 activities
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Calculate project statistics
    const totalTasks = project.phases.reduce((sum, phase) => sum + phase.tasks.length, 0)
    const completedTasks = project.phases.reduce((sum, phase) => 
      sum + phase.tasks.filter(task => task.status === 'done').length, 0)
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Generate PDF content (simplified HTML to PDF conversion)
    const pdfContent = generatePDFContent(project, {
      totalTasks,
      completedTasks,
      overallProgress
    })

    // Log activity
    await db.activityLog.create({
      data: {
        projectId: params.id,
        actorId: session.user.id,
        action: "EXPORT_PDF",
        payload: {
          projectName: project.name,
          projectCode: project.code
        }
      }
    })

    // Return PDF response
    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="project-report-${project.code}.pdf"`
      }
    })
  } catch (error) {
    console.error("Failed to generate PDF:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function generatePDFContent(project: any, stats: any): string {
  // This is a simplified version. In a real implementation, you would use a PDF library
  // to generate proper PDF content. For now, we'll return HTML that could be converted to PDF
  
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Project Report - ${project.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .project-info { margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .phase { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; }
        .progress-bar { width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: #4CAF50; transition: width 0.3s; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .status-approved { color: #4CAF50; }
        .status-submitted { color: #2196F3; }
        .status-rejected { color: #f44336; }
        .status-draft { color: #9E9E9E; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Project Report</h1>
        <h2>${project.name}</h2>
        <p><strong>Project Code:</strong> ${project.code}</p>
        <p><strong>Client:</strong> ${project.clientName}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="section">
        <h3>Project Overview</h3>
        <div class="project-info">
            <p><strong>Start Date:</strong> ${new Date(project.startDate).toLocaleDateString()}</p>
            <p><strong>End Date:</strong> ${project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}</p>
            <p><strong>Description:</strong> ${project.description || 'No description provided'}</p>
            <p><strong>Overall Progress:</strong> ${stats.overallProgress}%</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${stats.overallProgress}%"></div>
            </div>
            <p><strong>Tasks:</strong> ${stats.completedTasks}/${stats.totalTasks} completed</p>
        </div>
    </div>

    <div class="section">
        <h3>Phases Progress</h3>
        ${project.phases.map((phase: any) => `
            <div class="phase">
                <h4>${phase.name} (Weight: ${phase.weight}%)</h4>
                <p><strong>Progress:</strong> ${phase.progress}%</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${phase.progress}%"></div>
                </div>
                <p><strong>Tasks:</strong> ${phase.tasks.filter((t: any) => t.status === 'done').length}/${phase.tasks.length} completed</p>
                
                ${phase.revisions.length > 0 ? `
                    <h5>Latest Revisions:</h5>
                    <table>
                        <tr>
                            <th>Label</th>
                            <th>Status</th>
                            <th>Created</th>
                        </tr>
                        ${phase.revisions.map((revision: any) => `
                            <tr>
                                <td>${revision.label}</td>
                                <td class="status-${revision.status}">${revision.status}</td>
                                <td>${new Date(revision.createdAt).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </table>
                ` : '<p>No revisions yet</p>'}
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h3>Materials Summary</h3>
        ${project.materials.length > 0 ? `
            <table>
                <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Vendor</th>
                    <th>Status</th>
                </tr>
                ${project.materials.map((material: any) => `
                    <tr>
                        <td>${material.code}</td>
                        <td>${material.name}</td>
                        <td>${material.category}</td>
                        <td>${material.vendor || '-'}</td>
                        <td>${material.status}</td>
                    </tr>
                `).join('')}
            </table>
        ` : '<p>No materials added yet</p>'}
    </div>

    <div class="section">
        <h3>Recent Activity</h3>
        ${project.activity.length > 0 ? `
            <table>
                <tr>
                    <th>Action</th>
                    <th>Date</th>
                </tr>
                ${project.activity.map((activity: any) => `
                    <tr>
                        <td>${activity.action}</td>
                        <td>${new Date(activity.createdAt).toLocaleDateString()}</td>
                    </tr>
                `).join('')}
            </table>
        ` : '<p>No recent activity</p>'}
    </div>
</body>
</html>
  `

  // In a real implementation, you would convert this HTML to PDF
  // For now, we'll return the HTML as a placeholder
  return html
}