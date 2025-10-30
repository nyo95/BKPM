"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Download, Upload, Edit, Trash2, ExternalLink } from "lucide-react"

interface MaterialItem {
  id: string
  code: string
  name: string
  category: string
  vendor?: string
  url?: string
  price?: number
  status: 'sampled' | 'approved' | 'replaced' | 'obsolete'
  notes?: string
  createdAt: string
}

interface MaterialsManagerProps {
  projectId: string
}

const categories = ['PT', 'PL', 'GL', 'MT', 'FT', 'WP', 'OT'] // Paint, Laminate, Glass, Material, Fabric, Wallpaper, Other

export function MaterialsManager({ projectId }: MaterialsManagerProps) {
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null)
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    vendor: '',
    url: '',
    price: '',
    status: 'sampled' as const,
    notes: ''
  })

  useEffect(() => {
    fetchMaterials()
  }, [projectId])

  const fetchMaterials = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/materials`)
      if (response.ok) {
        const data = await response.json()
        setMaterials(data)
      }
    } catch (error) {
      console.error("Failed to fetch materials:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMaterial = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : undefined
        })
      })

      if (response.ok) {
        const createdMaterial = await response.json()
        setMaterials(prev => [createdMaterial, ...prev])
        setIsCreateDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("Failed to create material:", error)
    }
  }

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return

    try {
      const response = await fetch(`/api/materials/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMaterials(prev => prev.filter(m => m.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete material:", error)
    }
  }

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`/api/projects/${projectId}/materials/import`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setImportResult(result)
        fetchMaterials() // Refresh the list
      }
    } catch (error) {
      console.error("Failed to import materials:", error)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/materials/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `materials-${projectId}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Failed to export materials:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      category: '',
      vendor: '',
      url: '',
      price: '',
      status: 'sampled',
      notes: ''
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500'
      case 'sampled':
        return 'bg-blue-500'
      case 'replaced':
        return 'bg-yellow-500'
      case 'obsolete':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
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
        <h3 className="text-lg font-semibold">Materials Management</h3>
        <div className="flex space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={materials.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="e.g., PT-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Cat Putih Dove"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendor">Vendor</Label>
                    <Input
                      id="vendor"
                      value={formData.vendor}
                      onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                      placeholder="e.g., Dulux"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com/product"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sampled">Sampled</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="replaced">Replaced</SelectItem>
                      <SelectItem value="obsolete">Obsolete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateMaterial} disabled={!formData.code || !formData.name || !formData.category}>
                    Create Material
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {importResult && (
        <Alert>
          <AlertDescription>
            Import completed: {importResult.success} successful, {importResult.failed} failed.
            {importResult.errors.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer">View errors</summary>
                <ul className="mt-2 text-sm">
                  {importResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )}

      {materials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No materials yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first material or import from CSV to get started.
              </p>
              <div className="space-x-2">
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-mono">{material.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{material.name}</p>
                        {material.url && (
                          <a
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Product
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{material.category}</Badge>
                    </TableCell>
                    <TableCell>{material.vendor || '-'}</TableCell>
                    <TableCell>{material.price ? `$${material.price.toFixed(2)}` : '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${getStatusColor(material.status)} text-white`}>
                        {material.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(material)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMaterial(material.id)}
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

  function openEditDialog(material: MaterialItem) {
    setEditingMaterial(material)
    setFormData({
      code: material.code,
      name: material.name,
      category: material.category,
      vendor: material.vendor || '',
      url: material.url || '',
      price: material.price?.toString() || '',
      status: material.status,
      notes: material.notes || ''
    })
  }
}