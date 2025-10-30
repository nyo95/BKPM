import { Phase, Task } from '@prisma/client'

// Calculate phase progress based on tasks
export function calculatePhaseProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0
  
  const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0)
  return Math.round(totalProgress / tasks.length)
}

// Calculate project progress based on phases and their weights
export function calculateProjectProgress(phases: Array<{ weight: number; progress: number }>): number {
  if (phases.length === 0) return 0
  
  const totalWeight = phases.reduce((sum, phase) => sum + phase.weight, 0)
  const weightedProgress = phases.reduce((sum, phase) => sum + (phase.progress * phase.weight), 0)
  
  return Math.round(weightedProgress / totalWeight)
}

// Calculate project status based on timeline and progress
export function calculateProjectStatus(
  startDate: Date,
  endDate: Date | undefined,
  progress: number
): 'on_track' | 'at_risk' | 'delayed' {
  const now = new Date()
  
  // If project is overdue and not complete
  if (endDate && now > endDate && progress < 100) {
    return 'delayed'
  }
  
  // Calculate time elapsed and total time
  const totalTime = endDate ? endDate.getTime() - startDate.getTime() : now.getTime() - startDate.getTime()
  const elapsedTime = now.getTime() - startDate.getTime()
  const timeRatio = elapsedTime / totalTime
  
  // If more than 80% of time has passed but less than 80% progress
  if (timeRatio > 0.8 && progress < 80) {
    return 'at_risk'
  }
  
  return 'on_track'
}

// Calculate phase status based on timeline and progress
export function calculatePhaseStatus(
  startDate: Date | undefined,
  dueDate: Date | undefined,
  progress: number
): 'on_track' | 'at_risk' | 'delayed' | 'not_started' {
  if (!startDate) return 'not_started'
  
  const now = new Date()
  
  // If phase is overdue and not complete
  if (dueDate && now > dueDate && progress < 100) {
    return 'delayed'
  }
  
  // If phase hasn't started yet
  if (now < startDate) {
    return 'not_started'
  }
  
  // Calculate time elapsed and total time
  if (dueDate) {
    const totalTime = dueDate.getTime() - startDate.getTime()
    const elapsedTime = now.getTime() - startDate.getTime()
    const timeRatio = elapsedTime / totalTime
    
    // If more than 80% of time has passed but less than 80% progress
    if (timeRatio > 0.8 && progress < 80) {
      return 'at_risk'
    }
  }
  
  return 'on_track'
}

// Update phase progress based on task changes
export async function updatePhaseProgress(phaseId: string) {
  try {
    const response = await fetch(`/api/phases/${phaseId}/update-progress`, {
      method: 'POST'
    })
    
    if (!response.ok) {
      throw new Error('Failed to update phase progress')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error updating phase progress:', error)
    throw error
  }
}

// Update project progress based on all phases
export async function updateProjectProgress(projectId: string) {
  try {
    const response = await fetch(`/api/projects/${projectId}/update-progress`, {
      method: 'POST'
    })
    
    if (!response.ok) {
      throw new Error('Failed to update project progress')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error updating project progress:', error)
    throw error
  }
}

// Get progress statistics for dashboard
export function getProgressStats(phases: Array<{ progress: number; weight: number }>) {
  const totalPhases = phases.length
  const completedPhases = phases.filter(p => p.progress === 100).length
  const inProgressPhases = phases.filter(p => p.progress > 0 && p.progress < 100).length
  const notStartedPhases = phases.filter(p => p.progress === 0).length
  
  const overallProgress = calculateProjectProgress(phases)
  
  return {
    totalPhases,
    completedPhases,
    inProgressPhases,
    notStartedPhases,
    overallProgress
  }
}

// Get task statistics for dashboard
export function getTaskStats(tasks: Array<{ status: string }>) {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'done').length
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
  const reviewTasks = tasks.filter(t => t.status === 'review').length
  const backlogTasks = tasks.filter(t => t.status === 'backlog').length
  
  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    reviewTasks,
    backlogTasks
  }
}