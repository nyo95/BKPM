"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, Users, FileText, Settings, Download } from "lucide-react"
import { KanbanBoard } from "@/components/kanban/kanban-board"
import { GanttChart } from "@/components/gantt/gantt-chart"
import { MaterialsManager } from "@/components/materials/materials-manager"
import { FileManager } from "@/components/files/file-manager"
import { RevisionManager } from "@/components/revisions/revision-manager"

interface Project {
  id: string
  name: string
  code: string
  clientName: string
  startDate: string
  endDate?: string
  description?: string
  progress: number
  status: 'on_track' | 'at_risk' | 'delayed'
  phases: Array<{
    id: string
    key: string
    name: string
    order: number
    weight: number
    progress: number
    startDate?: string
    dueDate?: string
    revisions: Array<{
      id: string
      label: string
      status: string
      createdAt: string
    }>
    tasks: Array<{
      id: string
      title: string
      status: string
      progress: number
    }>
  }>
  tasks: Array<{
    id: string
    title: string
    status: string
    progress: number
    assignee?: {
      name: string
      email: string
    }
  }>
  materials: Array<{
    id: string
    code: string
    name: string
    category: string
    vendor?: string
    status: string
  }>
  attachments: Array<{
    id: string
    filename: string
    originalName: string
    mimeType: string
    size: number
    createdAt: string
  }>
  activity: Array<{
    id: string
    action: string
    createdAt: string
    payload?: any
  }>
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session && params.id) {
      fetchProject()
    }
  }, [session, params.id])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else if (response.status === 404) {
        router.push("/projects")
      }
    } catch (error) {
      console.error("Failed to fetch project:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'bg-green-500'
      case 'at_risk':
        return 'bg-yellow-500'
      case 'delayed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getRevisionStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500'
      case 'submitted':
        return 'bg-blue-500'
      case 'rejected':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!session || !project) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/projects">
              <Button variant="ghost" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-muted-foreground">
                {project.code} • {project.clientName}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className={`${getStatusColor(project.status)} text-white`}>
              {project.status.replace('_', ' ')}
            </Badge>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.progress}%</div>
              <Progress value={project.progress} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(project.startDate).toLocaleDateString()}
              </div>
              {project.endDate && (
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(project.endDate).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Phases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.phases.length}</div>
              <p className="text-xs text-muted-foreground">
                {project.phases.filter(p => p.progress === 100).length} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.tasks.length}</div>
              <p className="text-xs text-muted-foreground">
                {project.tasks.filter(t => t.status === 'done').length} completed
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="gantt">Gantt</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
                <CardDescription>
                  Summary of project progress and key information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {project.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{project.description}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-4">Phase Progress</h3>
                  <div className="space-y-4">
                    {project.phases.map((phase) => (
                      <div key={phase.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{phase.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {phase.progress}% (Weight: {phase.weight}%)
                          </span>
                        </div>
                        <Progress value={phase.progress} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{phase.revisions.length} revisions</span>
                          <span>{phase.tasks.length} tasks</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phases">
            <Card>
              <CardHeader>
                <CardTitle>Phases & Revisions</CardTitle>
                <CardDescription>
                  Manage project phases and track revisions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {project.phases.map((phase) => (
                    <div key={phase.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{phase.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Weight: {phase.weight}% • Progress: {phase.progress}%
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Add Revision
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {phase.revisions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No revisions yet</p>
                        ) : (
                          phase.revisions.map((revision) => (
                            <div key={revision.id} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="flex items-center space-x-3">
                                <span className="font-medium">{revision.label}</span>
                                <Badge variant="secondary" className={`${getRevisionStatusColor(revision.status)} text-white`}>
                                  {revision.status}
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(revision.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                      
                      <div className="mt-4">
                        <RevisionManager 
                          phaseId={phase.id} 
                          projectId={params.id}
                          phaseKey={phase.key}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kanban">
            <Card>
              <CardHeader>
                <CardTitle>Task Board</CardTitle>
                <CardDescription>
                  Drag and drop tasks to update their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <KanbanBoard projectId={params.id} phases={project.phases} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gantt">
            <Card>
              <CardHeader>
                <CardTitle>Gantt Chart</CardTitle>
                <CardDescription>
                  Visual timeline of project phases and tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GanttChart 
                  projectId={params.id} 
                  phases={project.phases} 
                  tasks={project.tasks}
                  projectStartDate={project.startDate}
                  projectEndDate={project.endDate || undefined}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <CardTitle>Materials</CardTitle>
                <CardDescription>
                  Manage project materials and specifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MaterialsManager projectId={params.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle>Files</CardTitle>
                <CardDescription>
                  Project attachments and documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileManager 
                  projectId={params.id} 
                  phases={project.phases}
                  revisions={project.phases.flatMap(phase => phase.revisions)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>
                  Recent activities and changes in the project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.activity.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No activity recorded yet
                    </div>
                  ) : (
                    project.activity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}