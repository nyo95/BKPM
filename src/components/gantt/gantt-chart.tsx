"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

interface Task {
  id: string
  title: string
  status: string
  progress: number
  startDate?: string
  dueDate?: string
  phase?: {
    id: string
    name: string
    key: string
  }
}

interface Phase {
  id: string
  name: string
  key: string
  startDate?: string
  dueDate?: string
  progress: number
  weight: number
}

interface GanttChartProps {
  projectId: string
  phases: Phase[]
  tasks: Task[]
  projectStartDate: string
  projectEndDate?: string
}

type ViewMode = 'day' | 'week' | 'month'

export function GanttChart({ projectId, phases, tasks, projectStartDate, projectEndDate }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Calculate date range
  const dateRange = useMemo(() => {
    const start = new Date(projectStartDate)
    const end = projectEndDate ? new Date(projectEndDate) : new Date()
    
    // Add some padding
    start.setDate(start.getDate() - 7)
    end.setDate(end.getDate() + 7)
    
    return { start, end }
  }, [projectStartDate, projectEndDate])

  // Generate date columns based on view mode
  const dateColumns = useMemo(() => {
    const { start, end } = dateRange
    const columns: Date[] = []
    const current = new Date(start)

    while (current <= end) {
      columns.push(new Date(current))
      
      if (viewMode === 'day') {
        current.setDate(current.getDate() + 1)
      } else if (viewMode === 'week') {
        current.setDate(current.getDate() + 7)
      } else if (viewMode === 'month') {
        current.setMonth(current.getMonth() + 1)
      }
    }

    return columns
  }, [dateRange, viewMode])

  // Calculate position and width for tasks
  const calculateTaskPosition = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return { left: 0, width: 0 }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const totalDays = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    
    const startOffset = Math.max(0, (start.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
    const duration = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      left: (startOffset / totalDays) * 100,
      width: (duration / totalDays) * 100
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-500'
      case 'review':
        return 'bg-yellow-500'
      case 'in_progress':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatDate = (date: Date) => {
    if (viewMode === 'day') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else if (viewMode === 'week') {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 28 : -28))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3))
    }
    
    setCurrentDate(newDate)
  }

  // Combine phases and tasks for display
  const allItems = [
    ...phases.map(phase => ({
      id: phase.id,
      title: phase.name,
      type: 'phase' as const,
      startDate: phase.startDate,
      endDate: phase.dueDate,
      progress: phase.progress,
      status: phase.progress === 100 ? 'done' : 'in_progress'
    })),
    ...tasks.map(task => ({
      id: task.id,
      title: task.title,
      type: 'task' as const,
      startDate: task.startDate,
      endDate: task.dueDate,
      progress: task.progress,
      status: task.status,
      phase: task.phase
    }))
  ].filter(item => item.startDate && item.endDate)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gantt Chart</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header with dates */}
              <div className="flex border-b">
                <div className="w-64 p-4 border-r bg-muted">
                  <h4 className="font-medium text-sm">Item</h4>
                </div>
                <div className="flex-1 flex">
                  {dateColumns.map((date, index) => (
                    <div
                      key={index}
                      className="flex-1 min-w-[100px] p-2 text-center border-r text-xs"
                    >
                      {formatDate(date)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gantt rows */}
              <div className="divide-y">
                {allItems.map((item) => {
                  const position = calculateTaskPosition(item.startDate, item.endDate)
                  
                  return (
                    <div key={item.id} className="flex">
                      <div className="w-64 p-4 border-r bg-muted">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h5 className="font-medium text-sm truncate">{item.title}</h5>
                            {item.type === 'phase' && (
                              <Badge variant="outline" className="text-xs">Phase</Badge>
                            )}
                          </div>
                          {item.phase && (
                            <p className="text-xs text-muted-foreground">{item.phase.name}</p>
                          )}
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-1">
                              <div
                                className="bg-blue-500 h-1 rounded-full"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{item.progress}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 relative min-h-[80px]">
                        {/* Timeline grid */}
                        <div className="absolute inset-0 flex">
                          {dateColumns.map((_, index) => (
                            <div key={index} className="flex-1 border-r" />
                          ))}
                        </div>
                        
                        {/* Task bar */}
                        <div
                          className="absolute top-4 h-6 rounded-md flex items-center px-2 text-white text-xs font-medium"
                          style={{
                            left: `${position.left}%`,
                            width: `${position.width}%`,
                            backgroundColor: getStatusColor(item.status)
                          }}
                        >
                          <span className="truncate">{item.title}</span>
                        </div>
                        
                        {/* Progress indicator */}
                        <div
                          className="absolute top-4 h-6 bg-black bg-opacity-20 rounded-md"
                          style={{
                            left: `${position.left}%`,
                            width: `${position.width * (item.progress / 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>Review</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Done</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span>Backlog</span>
        </div>
      </div>
    </div>
  )
}