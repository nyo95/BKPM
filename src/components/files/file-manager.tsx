"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Download, Trash2, FileText, Image, File, Archive } from "lucide-react"

interface Attachment {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  path: string
  uploadedBy: string
  createdAt: string
}

interface FileManagerProps {
  projectId: string
  phases?: Array<{ id: string; name: string; key: string }>
  revisions?: Array<{ id: string; label: string; phaseId: string }>
}

export function FileManager({ projectId, phases = [], revisions = [] }: FileManagerProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [uploadContext, setUploadContext] = useState({
    phaseId: '',
    revisionId: ''
  })

  useEffect(() => {
    fetchAttachments()
  }, [projectId])

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/attachments`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data)
      }
    } catch (error) {
      console.error("Failed to fetch attachments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', file)
    if (uploadContext.phaseId) formData.append('phaseId', uploadContext.phaseId)
    if (uploadContext.revisionId) formData.append('revisionId', uploadContext.revisionId)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch(`/api/projects/${projectId}/upload`, {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const newAttachment = await response.json()
        setAttachments(prev => [newAttachment, ...prev])
      }

      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 500)
    } catch (error) {
      console.error("Failed to upload file:", error)
      setUploading(false)
      setUploadProgress(0)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await fetch(attachment.path)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = attachment.originalName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Failed to download file:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const response = await fetch(`/api/attachments/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAttachments(prev => prev.filter(a => a.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete attachment:", error)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-8 w-8 text-green-500" />
    if (mimeType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-8 w-8 text-yellow-500" />
    return <File className="h-8 w-8 text-blue-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFilteredRevisions = () => {
    if (!uploadContext.phaseId) return []
    return revisions.filter(r => r.phaseId === uploadContext.phaseId)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">File Management</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload File</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {phases.length > 0 && (
                <div>
                  <Label htmlFor="phase">Phase (Optional)</Label>
                  <Select value={uploadContext.phaseId} onValueChange={(value) => setUploadContext(prev => ({ ...prev, phaseId: value, revisionId: '' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No phase</SelectItem>
                      {phases.map((phase) => (
                        <SelectItem key={phase.id} value={phase.id}>
                          {phase.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {getFilteredRevisions().length > 0 && (
                <div>
                  <Label htmlFor="revision">Revision (Optional)</Label>
                  <Select value={uploadContext.revisionId} onValueChange={(value) => setUploadContext(prev => ({ ...prev, revisionId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select revision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No revision</SelectItem>
                      {getFilteredRevisions().map((revision) => (
                        <SelectItem key={revision.id} value={revision.id}>
                          {revision.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="file">File *</Label>
                <Input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.dwg,.dxf"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum file size: 25MB. Allowed formats: Images, PDF, Office documents, ZIP, CAD files
                </p>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {attachments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No files uploaded yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first file to get started with document management.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload File</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="file">File *</Label>
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attachments.map((attachment) => (
                  <TableRow key={attachment.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {getFileIcon(attachment.mimeType)}
                        <div>
                          <p className="font-medium">{attachment.originalName}</p>
                          <p className="text-sm text-muted-foreground">{attachment.filename}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(attachment.size)}</TableCell>
                    <TableCell>
                      <span className="text-sm bg-muted px-2 py-1 rounded">
                        {attachment.mimeType.split('/')[1]?.toUpperCase() || 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(attachment.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(attachment)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(attachment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}