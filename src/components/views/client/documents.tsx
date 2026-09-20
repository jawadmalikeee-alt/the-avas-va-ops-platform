'use client'

import { useEffect, useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pill, EmptyState, LoadingSkeleton } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/shared'
import { formatRelative } from '@/lib/format'
import { Upload, FolderOpen, Lock, FileText, FileImage, FileSpreadsheet, Download, Trash2, X, File as FileIcon } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const CATS = ['All', 'Contracts', 'SOPs', 'Brand Assets', 'Credentials', 'Reports', 'Deliverables', 'Training']
const UPLOAD_CATS = ['Contracts', 'SOPs', 'Brand Assets', 'Credentials', 'Reports', 'Deliverables', 'Training']

export function ClientDocuments() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('All')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'Reports', isSensitive: false })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/documents', { cache: 'no-store' })
      const data = await res.json()
      setItems(data.items ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = cat === 'All' ? items : items.filter((i) => i.category === cat)

  const openUpload = () => {
    setForm({ title: '', category: 'Reports', isSensitive: false })
    setSelectedFile(null)
    setUploadOpen(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setSelectedFile(f)
      if (!form.title) {
        setForm({ ...form, title: f.name.replace(/\.[^/.]+$/, '') })
      }
    }
  }

  const submitUpload = async () => {
    if (!selectedFile) { toast('Please select a file', 'error'); return }
    if (!form.title.trim()) { toast('Please enter a title', 'error'); return }

    setUploading(true)
    try {
      // Step 1: Upload the file
      const formData = new FormData()
      formData.append('file', selectedFile)
      const upRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const upData = await upRes.json()
      if (!upRes.ok) { toast(upData.error ?? 'Upload failed', 'error'); return }

      // Step 2: Create document record
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.category,
          fileName: selectedFile.name,
          fileUrl: upData.url,
          fileSize: selectedFile.size,
          isSensitive: form.isSensitive,
        }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed to save document', 'error'); return }

      toast('Document uploaded successfully', 'success')
      setUploadOpen(false)
      load()
    } catch (e: any) {
      toast('Upload failed: ' + e.message, 'error')
    } finally { setUploading(false) }
  }

  const downloadFile = (item: any) => {
    if (item.fileUrl) {
      window.open(item.fileUrl, '_blank')
    } else {
      toast('File not available', 'error')
    }
  }

  const deleteDoc = async (id: string) => {
    if (!confirm('Delete this document? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' })
      if (!res.ok) { toast('Failed to delete', 'error'); return }
      toast('Document deleted', 'success')
      load()
    } catch {
      toast('Failed to delete', 'error')
    }
  }

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header
        title="Documents"
        subtitle="Your shared documents with The AVAS team"
        action={<Button size="sm" className="bg-avas-blue hover:bg-avas-blue-light" onClick={openUpload}><Upload className="h-4 w-4 mr-1.5" />Upload</Button>}
      />
      <div className="flex items-center gap-1.5 flex-wrap">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${cat === c ? 'bg-avas-blue text-white' : 'bg-muted text-foreground/70 hover:bg-muted/70'}`}>{c}</button>
        ))}
      </div>
      <Card className="rounded-2xl border-border shadow-apple p-0 overflow-hidden">
        {loading ? <div className="p-4"><LoadingSkeleton /></div> :
          filtered.length === 0 ? <EmptyState icon={FolderOpen} title="No documents" description="Upload your first document or your AVAS team will add documents as needed." action={<Button size="sm" className="bg-avas-blue hover:bg-avas-blue-light" onClick={openUpload}><Upload className="h-4 w-4 mr-1.5" />Upload</Button>} /> :
          <div className="divide-y divide-border/50">
            {filtered.map((d) => (
              <div key={d.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 group">
                <FileIconComponent name={d.fileName} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground truncate flex items-center gap-1.5">
                    {d.title}
                    {d.isSensitive && <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                  </div>
                  <div className="text-xs text-foreground/60 mt-0.5 truncate font-medium">
                    {d.fileName} · {Math.round((d.fileSize ?? 0) / 1024)} KB · {formatRelative(d.uploadedAt)}
                  </div>
                </div>
                <Pill tone="muted">{d.category}</Pill>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="rounded-full hover:bg-avas-blue/10" onClick={() => downloadFile(d)} title="Download">
                    <Download className="h-[18px] w-[18px] text-avas-blue" />
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-full hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteDoc(d.id)} title="Delete">
                    <Trash2 className="h-[18px] w-[18px] text-rose-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        }
      </Card>
      <div className="text-xs text-foreground/60 flex items-center gap-1.5 px-1 font-medium">
        <Lock className="h-3.5 w-3.5" />
        Sensitive credentials are stored encrypted and only accessible to authorized AVAS personnel.
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-avas-blue" />Upload Document</DialogTitle>
            <DialogDescription>Upload a document to share with your AVAS team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[11px] text-foreground/60 font-bold">Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Document title" className="mt-1.5 h-10 text-sm" />
            </div>
            <div>
              <Label className="text-[11px] text-foreground/60 font-bold">Category *</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1.5 h-10 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UPLOAD_CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-foreground/60 font-bold">File *</Label>
              <button
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'mt-1.5 w-full rounded-xl border-2 border-dashed p-6 text-center hover:bg-muted/50 transition-colors',
                  selectedFile ? 'border-avas-blue/40 bg-avas-blue/5' : 'border-border'
                )}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileIcon className="h-5 w-5 text-avas-blue" />
                    <span className="text-sm font-semibold text-foreground">{selectedFile.name}</span>
                    <span className="text-xs text-foreground/60">({Math.round(selectedFile.size / 1024)} KB)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="h-6 w-6 text-foreground/40" />
                    <span className="text-sm font-medium text-foreground/70">Click to select a file</span>
                    <span className="text-[11px] text-foreground/50">PDF, DOC, XLS, Images · Max 10MB</span>
                  </div>
                )}
              </button>
              <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={form.isSensitive}
                onChange={(e) => setForm({ ...form, isSensitive: e.target.checked })}
                className="rounded accent-avas-blue"
              />
              Mark as sensitive (credentials, contracts, etc.)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={submitUpload} disabled={uploading || !selectedFile} className="bg-avas-blue hover:bg-avas-blue-light">
              <Upload className="h-4 w-4 mr-1.5" />
              {uploading ? 'Uploading…' : 'Upload Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FileIconComponent({ name }: { name: string }) {
  const ext = name?.split('.').pop()?.toLowerCase()
  const Icon = ext === 'pdf' ? FileText : ext === 'xls' || ext === 'xlsx' || ext === 'csv' ? FileSpreadsheet : ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' ? FileImage : FileText
  return <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0"><Icon className="h-5 w-5 text-foreground/60" /></div>
}
