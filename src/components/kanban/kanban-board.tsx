"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Calendar, User } from "lucide-react"

interface Task {
  id: string
  title: string
  description?: string
  status: 'backlog' | 'in_progress' | 'review' | 'done'
  progress: number
  assignee?: {
    id: string
    name: string
    email: string
  }
  phase?: {
    id: string
    name: string
    key: string
  }
  startDate?: string
  dueDate?: string
  order: number
}

interface Phase {
  id: string
  name: string
  key: string
}

interface KanbanBoardProps {
  projectId: string
  phases: Phase[]
}

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-500' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'review', title: 'Review', color: 'bg-yellow-500' },
  { id: 'done', title: 'Done', color: 'bg-green-500' }
]

export function KanbanBoard({ projectId, phases }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    phaseId: '',
    assigneeId: '',
    startDate: '',
    dueDate: ''
  })

  useEffect(() => {
    fetchTasks()
  }, [projectId])

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    
    if (!draggedTask) return

    try {
      const response = await fetch(`/api/tasks/${draggedTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'move',
          status: newStatus,
          order: 0 // Will be reordered on the backend
        })
      })

      if (response.ok) {
        const updatedTask = await response.json()
        setTasks(prev => prev.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        ))
      }
    } catch (error) {
      console.error("Failed to move task:", error)
    }

    setDraggedTask(null)
  }

  const handleCreateTask = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTask)
      })

      if (response.ok) {
        const createdTask = await response.json()
        setTasks(prev => [...prev, createdTask])
        setIsCreateDialogOpen(false)
        setNewTask({
          title: '',
          description: '',
          phaseId: '',
          assigneeId: '',
          startDate: '',
          dueDate: ''
        })
      }
    } catch (error) {
      console.error("Failed to create task:", error)
    }
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status).sort((a, b) => a.order - b.order)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {columns.map((column) => (
          <Card key={column.id} className="min-h-[200px]">
            <CardHeader>
              <div className="animate-pulse h-4 bg-muted rounded w-1/4"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Task Board</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="phase">Phase</Label>
                <Select value={newTask.phaseId} onValueChange={(value) => setNewTask(prev => ({ ...prev, phaseId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newTask.startDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask} disabled={!newTask.title}>
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <Card
            key={column.id}
            className="min-h-[400px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center">
                  <div className={`w-3 h-3 rounded-full ${column.color} mr-2`}></div>
                  {column.title}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {getTasksByStatus(column.id).length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {getTasksByStatus(column.id).map((task) => (
                <Card
                  key={task.id}
                  className="cursor-move hover:shadow-md transition-shadow"
                  draggable
                  onDragStart={() => handleDragStart(task)}
                >
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                      
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {task.phase && (
                        <Badge variant="outline" className="text-xs">
                          {task.phase.name}
                        </Badge>
                      )}

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-1" />
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {task.assignee && (
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {task.assignee.name}
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}