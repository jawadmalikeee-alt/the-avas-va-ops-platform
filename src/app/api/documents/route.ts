import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/documents — list documents (tenant-scoped)
 *   - CLIENT: only own client's documents
 *   - VA: only documents for assigned clients
 *   - ADMIN: all documents
 *
 * POST /api/documents — upload a new document
 *   body: { title, category, fileName, fileUrl, fileSize, isSensitive, clientId? }
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let where: any = {}
  if (user.role === 'CLIENT') where.clientId = user.client?.id
  if (user.role === 'VA') {
    const assignments = await db.assignment.findMany({
      where: { vaId: user.vaProfile?.id, status: 'Active' },
      select: { clientId: true },
    })
    where.clientId = { in: assignments.map((a) => a.clientId) }
  }

  const items = await db.document.findMany({
    where,
    orderBy: { uploadedAt: 'desc' },
    take: 100,
    include: { client: true },
  })

  return NextResponse.json({
    items: items.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      client: d.client?.companyName ?? 'Internal',
      clientId: d.clientId,
      fileName: d.fileName,
      fileUrl: d.fileUrl,
      fileSize: d.fileSize,
      isSensitive: d.isSensitive,
      uploadedAt: d.uploadedAt,
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await req.json()
  const { title, category, fileName, fileUrl, fileSize, isSensitive, clientId } = body

  if (!title || !category || !fileUrl) {
    return NextResponse.json({ error: 'title, category, and fileUrl are required' }, { status: 400 })
  }

  // Determine clientId:
  // - Admin can specify clientId
  // - Client uses their own clientId
  // - VA must specify clientId (from assigned clients)
  let targetClientId = clientId
  if (user.role === 'CLIENT') {
    targetClientId = user.client?.id
  } else if (user.role === 'VA') {
    if (!targetClientId) return NextResponse.json({ error: 'clientId required for VA uploads' }, { status: 400 })
    // Verify VA is assigned to this client
    const assigned = await db.assignment.findFirst({
      where: { vaId: user.vaProfile?.id, clientId: targetClientId, status: 'Active' },
    })
    if (!assigned) return NextResponse.json({ error: 'You are not assigned to this client' }, { status: 403 })
  }

  const doc = await db.document.create({
    data: {
      title,
      category,
      fileName: fileName ?? 'file',
      fileUrl,
      fileSize: fileSize ?? 0,
      isSensitive: isSensitive ?? false,
      encrypted: isSensitive ?? false,
      clientId: targetClientId,
      uploadedById: user.id,
    },
  })

  // Audit log
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'Document',
      entityId: doc.id,
      after: `${title} (${category})`,
    },
  })

  return NextResponse.json({ ok: true, document: doc })
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const doc = await db.document.findUnique({ where: { id } })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Tenant guard
  if (user.role === 'CLIENT' && doc.clientId !== user.client?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.document.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
