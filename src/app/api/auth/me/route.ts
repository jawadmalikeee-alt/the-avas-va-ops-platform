import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ user: null }, { status: 200 })
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      timezone: user.timezone,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      jobTitle: user.jobTitle,
      clientId: user.client?.id ?? null,
      client: user.client ? {
        id: user.client.id,
        companyName: user.client.companyName,
        contactPerson: user.client.contactPerson,
        email: user.client.email,
        phone: user.client.phone,
        country: user.client.country,
        industry: user.client.industry,
        package: user.client.package,
        contractedHours: user.client.contractedHours,
        billingCycle: user.client.billingCycle,
        brandColor: user.client.brandColor,
        timezone: user.client.timezone,
        canSeeHours: user.client.canSeeHours,
        canSeeQA: user.client.canSeeQA,
        canSeeActivity: user.client.canSeeActivity,
        canSeeTaskDetails: user.client.canSeeTaskDetails,
        canMessageVA: user.client.canMessageVA,
        canApproveDeliverable: user.client.canApproveDeliverable,
        canSeePerformance: user.client.canSeePerformance,
      } : null,
      vaId: user.vaProfile?.id ?? null,
      va: user.vaProfile ? {
        id: user.vaProfile.id,
        specialization: user.vaProfile.specialization,
        currentStatus: user.vaProfile.currentStatus,
        shiftStartedAt: user.vaProfile.shiftStartedAt,
        performanceScore: user.vaProfile.performanceScore,
        qualityScore: user.vaProfile.qualityScore,
        attendanceScore: user.vaProfile.attendanceScore,
      } : null,
    },
  })
}
