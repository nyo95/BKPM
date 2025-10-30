'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, FileText, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Revision {
  id: string
  label: string
  notes?: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submittedAt?: string
  decidedAt?: string
  createdAt: string
  attachments?: Array<{
    id: string
    filename: string
    originalName: string
    size: number
  }>
}

interface RevisionManagerProps {
  phaseId: string
  projectId: string
  phaseKey: string
}

export function RevisionManager({ phaseId, projectId, phaseKey }: RevisionManagerProps) {
  const { data: session } = useSession()
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newRevision, setNewRevision] = useState({
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchRevisions()
  }, [phaseId])

  const fetchRevisions = async () => {
    try {
      const response = await fetch(`/api/phases/${phaseId}/revisions`)
      if (response.ok) {
        const data = await response.json()
        setRevisions(data)
      }
    } catch (error) {
      console.error('Failed to fetch revisions:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateRevisionLabel = () => {
    const revisionCount = revisions.length
    const phasePrefix = phaseKey.toUpperCase()
    
    switch (phaseKey) {
      case 'moodboard':
        return `Moodboard ${revisionCount + 1}`
      case 'layout':
        return `Layout ${revisionCount + 1}`
      case 'design':
        return `D${revisionCount + 1}`
      case 'material_scheduler':
        return `MS${revisionCount + 1}`
      case 'construction_drawing':
        return `CD${revisionCount + 1}`
      case 'supervision':
        return `SV${revisionCount + 1}`
      default:
        return `${phasePrefix} ${revisionCount + 1}`
    }
  }

  const handleCreateRevision = async () => {
    if (!session) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/phases/${phaseId}/revisions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          label: generateRevisionLabel(),
          notes: newRevision.notes
        })
      })

      if (response.ok) {
        const createdRevision = await response.json()
        setRevisions([createdRevision, ...revisions])
        setNewRevision({ notes: '' })
        setIsCreateDialogOpen(false)
      }
    } catch (error) {
      console.error('Failed to create revision:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateRevisionStatus = async (revisionId: string, status: string) => {
    if (!session) return

    try {
      const response = await fetch(`/api/revisions/${revisionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        const updatedRevision = await response.json()
        setRevisions(revisions.map(r => r.id === revisionId ? updatedRevision : r))
      }
    } catch (error) {
      console.error('Failed to update revision status:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'submitted':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500 text-white'
      case 'submitted':
        return 'bg-blue-500 text-white'
      case 'rejected':
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const canCreateRevision = ['admin', 'pm', 'designer'].includes(session?.user?.role || '')
  const canApproveReject = ['admin', 'pm', 'client'].includes(session?.user?.role || '')

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Revisions ({revisions.length})</h4>
        {canCreateRevision && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Revision
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Revision</DialogTitle>
                <DialogDescription>
                  Create a new revision for {phaseKey} phase
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="label">Revision Label</Label>
                  <Input
                    id="label"
                    value={generateRevisionLabel()}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this revision..."
                    value={newRevision.notes}
                    onChange={(e) => setNewRevision({ notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateRevision}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Revision'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {revisions.length === 0 ? (
        <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg">
          No revisions created yet
        </div>
      ) : (
        <div className="space-y-2">
          {revisions.map((revision) => (
            <Card key={revision.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(revision.status)}
                  <div>
                    <div className="font-medium text-sm">{revision.label}</div>
                    {revision.notes && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {revision.notes}
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Created: {new Date(revision.createdAt).toLocaleDateString()}
                      </span>
                      {revision.submittedAt && (
                        <span>
                          • Submitted: {new Date(revision.submittedAt).toLocaleDateString()}
                        </span>
                      )}
                      {revision.decidedAt && (
                        <span>
                          • Decided: {new Date(revision.decidedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className={getStatusColor(revision.status)}>
                    {revision.status}
                  </Badge>
                  
                  {canApproveReject && (
                    <Select
                      value={revision.status}
                      onValueChange={(value) => handleUpdateRevisionStatus(revision.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="submitted">Submit</SelectItem>
                        <SelectItem value="approved">Approve</SelectItem>
                        <SelectItem value="rejected">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              
              {revision.attachments && revision.attachments.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Attachments:</div>
                  <div className="space-y-1">
                    {revision.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center space-x-2 text-xs">
                        <FileText className="h-3 w-3" />
                        <span>{attachment.originalName}</span>
                        <span className="text-muted-foreground">
                          ({(attachment.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}