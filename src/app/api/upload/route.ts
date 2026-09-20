import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

/**
 * POST /api/upload — handles file uploads (images, PDFs, docs)
 * Saves to /public/uploads/ and returns the URL
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // 10MB max
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Validate type
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-zip-compressed',
      'video/mp4', 'audio/mpeg', 'audio/mp3',
    ]
    if (!allowed.includes(file.type) && !file.type.startsWith('image/')) {
      return NextResponse.json({ error: `File type "${file.type}" not supported` }, { status: 400 })
    }

    // Ensure dir exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Sanitize filename and generate unique name
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const safeName = `${randomUUID()}.${ext}`
    const filePath = path.join(uploadDir, safeName)
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const url = `/uploads/${safeName}`
    return NextResponse.json({
      ok: true,
      url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })
  } catch (e: any) {
    console.error('Upload failed:', e)
    return NextResponse.json({ error: 'Upload failed: ' + e.message }, { status: 500 })
  }
}
