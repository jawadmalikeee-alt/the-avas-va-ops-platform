/**
 * The AVAS — Seed Database
 * Creates demo accounts for 3 roles + realistic operations data
 *
 * Run with: bun run db:seed
 */
import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const db = new PrismaClient()

// Simple deterministic hash — DO NOT use in production
function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex')
}

async function main() {
  console.log('Clearing existing data...')
  await db.notification.deleteMany()
  await db.message.deleteMany()
  await db.ticket.deleteMany()
  await db.feedback.deleteMany()
  await db.qAReview.deleteMany()
  await db.workSubmission.deleteMany()
  await db.deliverable.deleteMany()
  await db.taskComment.deleteMany()
  await db.task.deleteMany()
  await db.project.deleteMany()
  await db.timeEntry.deleteMany()
  await db.attendance.deleteMany()
  await db.sOPAssignment.deleteMany()
  await db.sOP.deleteMany()
  await db.document.deleteMany()
  await db.clientKPI.deleteMany()
  await db.kPI.deleteMany()
  await db.clientService.deleteMany()
  await db.service.deleteMany()
  await db.assignment.deleteMany()
  await db.auditLog.deleteMany()
  await db.report.deleteMany()
  await db.vA.deleteMany()
  await db.client.deleteMany()
  await db.user.deleteMany()

  console.log('Creating ADMIN user...')
  const adminUser = await db.user.create({
    data: {
      email: 'jawad@theavas.com',
      passwordHash: hashPassword('admin123'),
      name: 'Jawad Malik',
      role: 'ADMIN',
      timezone: 'Asia/Karachi',
      phone: '+92 300 1234567',
      jobTitle: 'Operations Director',
    },
  })

  const qaManager = await db.user.create({
    data: {
      email: 'qa@theavas.com',
      passwordHash: hashPassword('admin123'),
      name: 'Ayesha Khan',
      role: 'QA_MANAGER',
      timezone: 'Asia/Karachi',
      jobTitle: 'QA Manager',
    },
  })

  console.log('Creating VA users...')
  const vaUserDefs = [
    { name: 'Sarah Johnson', email: 'sarah@theavas.com', spec: 'Real Estate Virtual Assistant' },
    { name: 'Ahmed Raza', email: 'ahmed@theavas.com', spec: 'Lead Management Specialist' },
    { name: 'Maria Santos', email: 'maria@theavas.com', spec: 'CRM & Data Entry Specialist' },
    { name: 'David Chen', email: 'david@theavas.com', spec: 'Cold Calling & ISA' },
    { name: 'Fatima Ali', email: 'fatima@theavas.com', spec: 'Social Media & Content' },
    { name: 'John Reyes', email: 'john@theavas.com', spec: 'Transaction Coordinator' },
    { name: 'Hina Tariq', email: 'hina@theavas.com', spec: 'Email & Calendar Management' },
    { name: 'Omar Sheikh', email: 'omar@theavas.com', spec: 'CMA & Research Specialist' },
  ]
  const vaUserRecords = await Promise.all(
    vaUserDefs.map((u) =>
      db.user.create({
        data: {
          email: u.email,
          passwordHash: hashPassword('va123'),
          name: u.name,
          role: 'VA',
          timezone: 'Asia/Karachi',
          jobTitle: u.spec,
        },
      })
    )
  )

  console.log('Creating VA profiles...')
  const vaRecords = await Promise.all(
    vaUserRecords.map((u, i) =>
      db.vA.create({
        data: {
          userId: u.id,
          specialization: vaUserDefs[i].spec,
          skills: ['CRM', 'Lead Gen', 'Cold Calling', 'Data Entry', 'Social Media', 'Email Management'][i % 6],
          hireDate: new Date(Date.now() - (90 + i * 30) * 24 * 60 * 60 * 1000),
          employmentType: 'Full-Time',
          monthlySalary: 1200 + i * 100,
          status: 'Active',
          currentStatus: i < 4 ? 'Working' : i < 6 ? 'Break' : 'Offline',
          shiftStartedAt: i < 6 ? new Date(Date.now() - (3 + i) * 60 * 60 * 1000) : null,
          performanceScore: 85 + (i * 2) % 12,
          qualityScore: 90 + (i * 1) % 8,
          attendanceScore: 92 + (i * 1) % 6,
        },
      })
    )
  )

  console.log('Creating CLIENT users + tenant records...')
  const clientDefs = [
    { company: 'ABC Realty', contact: 'Michael Stevens', email: 'michael@abcrealty.com', tz: 'America/New_York', country: 'United States', package: 'Real Estate VA — 40 Hours/Week', hours: 160, brand: '#0F172A', industry: 'Real Estate Brokerage' },
    { company: 'Sunset Properties', contact: 'Jennifer Lee', email: 'jennifer@sunsetprops.com', tz: 'America/Los_Angeles', country: 'United States', package: 'Real Estate VA — 40 Hours/Week', hours: 160, brand: '#1E40AF', industry: 'Luxury Real Estate' },
    { company: 'Metro Homes Group', contact: 'Robert Chen', email: 'robert@metrohomes.com', tz: 'America/Chicago', country: 'United States', package: 'Real Estate VA — 20 Hours/Week', hours: 80, brand: '#7C3AED', industry: 'Property Management' },
    { company: 'Coastal Realty', contact: 'Emma Wilson', email: 'emma@coastalrealty.com', tz: 'America/Denver', country: 'United States', package: 'Premium VA — 60 Hours/Week', hours: 240, brand: '#0E7490', industry: 'Vacation Rentals' },
  ]

  const clientUsers = await Promise.all(
    clientDefs.map((c) =>
      db.user.create({
        data: {
          email: c.email,
          passwordHash: hashPassword('client123'),
          name: c.contact,
          role: 'CLIENT',
          timezone: c.tz,
          phone: '+1 555 0100',
          jobTitle: 'Account Owner',
        },
      })
    )
  )

  const clientRecords = await Promise.all(
    clientDefs.map((c, i) =>
      db.client.create({
        data: {
          userId: clientUsers[i].id,
          companyName: c.company,
          contactPerson: c.contact,
          email: c.email,
          phone: '+1 555 0100',
          country: c.country,
          timezone: c.tz,
          industry: c.industry,
          package: c.package,
          contractedHours: c.hours,
          billingCycle: 'Monthly',
          startDate: new Date(Date.now() - (60 + i * 30) * 24 * 60 * 60 * 1000),
          contractStatus: 'Active',
          brandColor: c.brand,
          workingHours: String(Math.floor(c.hours / 4)),
        },
      })
    )
  )

  console.log('Creating Assignments (multi-client VA support)...')
  const assignmentDefs: Array<{ vaIdx: number; clientIdx: number; role: string; hours: number; schedule: string }> = [
    { vaIdx: 0, clientIdx: 0, role: 'Lead Management VA', hours: 40, schedule: 'Mon-Fri 9:00 AM - 6:00 PM PKT' },
    { vaIdx: 1, clientIdx: 0, role: 'Lead Management VA', hours: 20, schedule: 'Mon-Fri 9:00 AM - 1:00 PM PKT' },
    { vaIdx: 1, clientIdx: 1, role: 'Lead Follow-Up VA', hours: 20, schedule: 'Mon-Fri 2:00 PM - 6:00 PM PKT' },
    { vaIdx: 2, clientIdx: 1, role: 'CRM Management VA', hours: 40, schedule: 'Mon-Fri 9:00 AM - 6:00 PM PKT' },
    { vaIdx: 3, clientIdx: 0, role: 'Cold Calling VA', hours: 40, schedule: 'Mon-Fri 6:00 PM - 3:00 AM PKT' },
    { vaIdx: 4, clientIdx: 3, role: 'Social Media VA', hours: 30, schedule: 'Mon-Fri 9:00 AM - 4:00 PM PKT' },
    { vaIdx: 4, clientIdx: 2, role: 'Social Media VA', hours: 10, schedule: 'Mon, Wed, Fri 4:00 PM - 6:00 PM PKT' },
    { vaIdx: 5, clientIdx: 3, role: 'Transaction Coordinator', hours: 40, schedule: 'Mon-Fri 9:00 AM - 6:00 PM PKT' },
    { vaIdx: 6, clientIdx: 2, role: 'Email & Calendar VA', hours: 20, schedule: 'Mon-Fri 9:00 AM - 1:00 PM PKT' },
    { vaIdx: 7, clientIdx: 0, role: 'CMA & Research VA', hours: 10, schedule: 'Tue, Thu 1:00 PM - 6:00 PM PKT' },
    { vaIdx: 7, clientIdx: 3, role: 'CMA & Research VA', hours: 10, schedule: 'Mon, Wed 9:00 AM - 2:00 PM PKT' },
  ]

  await Promise.all(
    assignmentDefs.map((a) =>
      db.assignment.create({
        data: {
          clientId: clientRecords[a.clientIdx].id,
          vaId: vaRecords[a.vaIdx].id,
          userId: vaUserRecords[a.vaIdx].id,
          role: a.role,
          weeklyHours: a.hours,
          schedule: a.schedule,
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          status: 'Active',
        },
      })
    )
  )

  console.log('Creating Services...')
  const serviceDefs = [
    { name: 'Lead Management', category: 'Real Estate' },
    { name: 'Lead Follow-Up', category: 'Real Estate' },
    { name: 'CRM Management', category: 'Real Estate' },
    { name: 'MLS Data Entry', category: 'Real Estate' },
    { name: 'Social Media Management', category: 'Marketing' },
    { name: 'CMA Preparation', category: 'Real Estate' },
    { name: 'Email Management', category: 'Administrative' },
    { name: 'Inbox Management', category: 'Administrative' },
    { name: 'Cold Calling', category: 'Sales' },
    { name: 'Appointment Setting', category: 'Sales' },
    { name: 'Data Entry', category: 'Administrative' },
    { name: 'Research', category: 'Administrative' },
    { name: 'Transaction Coordination', category: 'Real Estate' },
    { name: 'Administrative Support', category: 'Administrative' },
  ]
  const serviceRecords = await Promise.all(
    serviceDefs.map((s) => db.service.create({ data: s }))
  )

  // Enable all services for all clients
  await Promise.all(
    clientRecords.flatMap((c) =>
      serviceRecords.map((s) =>
        db.clientService.create({
          data: { clientId: c.id, serviceId: s.id, enabled: true },
        })
      )
    )
  )

  console.log('Creating KPIs...')
  const kpiDefs = [
    { serviceName: 'Lead Management', kpis: ['Leads Processed', 'Leads Verified', 'Leads Assigned', 'Leads Followed Up', 'Response Rate'] },
    { serviceName: 'Cold Calling', kpis: ['Calls Made', 'Connected Calls', 'Talk Time', 'Conversations', 'Appointments', 'Follow-Ups'] },
    { serviceName: 'CRM Management', kpis: ['Records Updated', 'Records Added', 'Records Cleaned', 'Duplicates Removed'] },
    { serviceName: 'Social Media Management', kpis: ['Posts Created', 'Posts Published', 'Engagement', 'Content Calendar Completion'] },
    { serviceName: 'Email Management', kpis: ['Emails Processed', 'Emails Replied', 'Emails Forwarded', 'Response Time'] },
  ]
  const kpiRecords: { id: string; name: string; serviceName: string }[] = []
  for (const def of kpiDefs) {
    const svc = serviceRecords.find((s) => s.name === def.serviceName)
    if (!svc) continue
    for (const kpiName of def.kpis) {
      const k = await db.kPI.create({
        data: {
          serviceId: svc.id,
          name: kpiName,
          unit: kpiName.includes('Rate') || kpiName.includes('Engagement') || kpiName.includes('Completion') ? '%' : 'count',
          target: 100,
          weight: 1.0,
        },
      })
      kpiRecords.push({ id: k.id, name: kpiName, serviceName: def.serviceName })
    }
  }

  console.log('Seeding Client KPI results for current week...')
  const weekKey = new Date().toISOString().slice(0, 8) + '-W' + getWeekNumber()
  await Promise.all(
    clientRecords.flatMap((c, ci) =>
      kpiRecords.map((k, ki) =>
        db.clientKPI.create({
          data: {
            clientId: c.id,
            kpiId: k.id,
            period: weekKey,
            value: Math.floor(50 + ((ci * 7 + ki * 13) % 250)),
            target: 100,
          },
        })
      )
    )
  )

  console.log('Creating Tasks...')
  const taskTitles = [
    'Update CRM Leads', 'Follow-up with new leads', 'Cold call list - batch 4',
    'Schedule social media posts', 'Email inbox triage', 'MLS listing update',
    'CMA preparation - 123 Main St', 'Transaction coordination - Johnson file',
    'Clean CRM duplicates', 'Research comparable properties',
    'Lead verification - 50 records', 'Property data entry', 'Appointment confirmation calls',
    'Update contact lists', 'Social media calendar review',
    'CRM hygiene check', 'Lead nurture sequence setup', 'Inbox zero achievement',
    'Weekly report preparation', 'Client onboarding documentation',
    'Update listing photos', 'Draft email campaigns', 'Phone tag follow-ups',
    'Database cleanup', 'Comps research - Sunset Blvd area',
  ]

  const statuses = ['To Do', 'In Progress', 'Review', 'Completed', 'Completed', 'Completed', 'Completed']
  const priorities = ['Low', 'Medium', 'Medium', 'High', 'Urgent']

  for (let i = 0; i < taskTitles.length; i++) {
    const client = clientRecords[i % clientRecords.length]
    const va = vaRecords[i % vaRecords.length]
    const status = statuses[i % statuses.length]
    const priority = priorities[i % priorities.length]
    const createdAt = new Date(Date.now() - (i * 4 + 1) * 60 * 60 * 1000)
    const dueDate = new Date(Date.now() + (i - 10) * 24 * 60 * 60 * 1000)
    const completed = status === 'Completed'
    await db.task.create({
      data: {
        title: taskTitles[i],
        description: `Task description for: ${taskTitles[i]}. Following the standard operating procedure.`,
        clientId: client.id,
        vaId: va.id,
        service: serviceRecords[i % serviceRecords.length].name,
        priority,
        status,
        dueDate,
        createdAt,
        startedAt: status === 'In Progress' || completed ? new Date(createdAt.getTime() + 60 * 60 * 1000) : null,
        completedAt: completed ? new Date(createdAt.getTime() + 3 * 60 * 60 * 1000) : null,
        progress: status === 'Completed' ? 100 : status === 'Review' ? 90 : status === 'In Progress' ? (40 + i * 7) % 100 : 0,
        timeSpentMs: completed ? (1 + (i % 4)) * 60 * 60 * 1000 : status === 'In Progress' ? (45 + i) * 60 * 1000 : 0,
        qaStatus: completed ? (i % 5 === 0 ? 'Pending' : 'Pass') : null,
        createdById: adminUser.id,
        sourceRequest: i % 3 === 0 ? 'ClientRequest' : 'Admin',
      },
    })
  }

  console.log('Creating Time Entries & Attendance (last 14 days)...')
  for (let d = 14; d >= 0; d--) {
    const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000)
    for (let v = 0; v < vaRecords.length; v++) {
      const va = vaRecords[v]
      const user = vaUserRecords[v]
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      if (isWeekend && v % 3 !== 0) continue
      if (d > 0 && v % 11 === 0) continue // absent

      const clockIn = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9 + (v % 2), v * 7 % 60)
      const isToday = d === 0
      const clockOut = isToday ? null : new Date(clockIn.getTime() + 8 * 60 * 60 * 1000 + (v % 3) * 30 * 60 * 1000)
      const workedMs = isToday ? (3 + v % 4) * 60 * 60 * 1000 : 8 * 60 * 60 * 1000

      await db.timeEntry.create({
        data: {
          userId: user.id,
          vaId: va.id,
          clientId: clientRecords[v % clientRecords.length].id,
          clockIn,
          clockOut,
          breakMs: 60 * 60 * 1000,
          status: isToday ? 'Active' : 'Ended',
        },
      })

      await db.attendance.create({
        data: {
          vaId: va.id,
          date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          scheduled: '09:00-18:00',
          clockIn,
          clockOut,
          breakMs: 60 * 60 * 1000,
          workedMs,
          status: isWeekend ? 'Holiday' : (clockIn.getHours() > 9 ? 'Late' : 'Present'),
        },
      })
    }
  }

  console.log('Creating Deliverables...')
  const deliverableTitles = [
    'CRM Update Report - Sept 15', 'Lead Follow-up Summary', 'Cold Calling Results - Week 38',
    'Social Media Calendar - October', 'Inbox Management Report', 'MLS Listing Update Summary',
    'CMA Report - 123 Main St', 'Transaction File - Johnson Closing',
    'CRM Cleanup Report', 'Property Research - Sunset Area',
  ]
  for (let i = 0; i < deliverableTitles.length; i++) {
    const client = clientRecords[i % clientRecords.length]
    const va = vaRecords[i % vaRecords.length]
    const status = i < 6 ? 'Approved' : i < 8 ? 'Under Review' : 'Submitted'
    await db.deliverable.create({
      data: {
        title: deliverableTitles[i],
        clientId: client.id,
        vaId: va.id,
        service: serviceRecords[i % serviceRecords.length].name,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        status,
        fileUrl: null,
        fileName: `${deliverableTitles[i].replace(/\s+/g, '_')}.pdf`,
        notes: 'Deliverable prepared as per SOP. Please review and confirm.',
        approvedAt: status === 'Approved' ? new Date(Date.now() - i * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000) : null,
        approvedById: status === 'Approved' ? clientUsers[i % clientUsers.length].id : null,
      },
    })
  }

  console.log('Creating QA Reviews...')
  for (let i = 0; i < 15; i++) {
    const va = vaRecords[i % vaRecords.length]
    const client = clientRecords[i % clientRecords.length]
    const accuracy = 90 + (i * 3) % 11
    const completeness = 88 + (i * 5) % 12
    const sop = 92 + (i * 7) % 9
    const comm = 90 + (i * 11) % 10
    const timeliness = 85 + (i * 13) % 14
    const prof = 92 + (i * 17) % 8
    const score = Math.round((accuracy * 0.25 + completeness * 0.2 + sop * 0.2 + comm * 0.15 + timeliness * 0.1 + prof * 0.1) * 10) / 10
    await db.qAReview.create({
      data: {
        evaluatorId: qaManager.id,
        vaId: va.id,
        clientId: client.id,
        date: new Date(Date.now() - i * 12 * 60 * 60 * 1000),
        accuracy, completeness, sopAdherence: sop, communication: comm, timeliness, professionalism: prof,
        score,
        mistakes: i % 4 === 0 ? 'Minor CRM field errors' : null,
        feedback: i % 3 === 0 ? 'Excellent work — keep up the SOP adherence.' : i % 3 === 1 ? 'Good overall, minor improvements needed in response time.' : 'Solid performance across all metrics.',
        correctiveAction: i % 5 === 0 ? 'Review SOP section 4.2' : null,
        weight: '25,20,20,15,10,10',
      },
    })
  }

  console.log('Creating SOPs and assigning to VAs...')
  const sopDefs = [
    { title: 'Lead Follow-Up SOP', category: 'Sales', version: 'v2.1', content: '1. Receive lead\n2. Verify contact info\n3. Initial outreach within 15 min\n4. Log in CRM\n5. Set follow-up cadence' },
    { title: 'CRM Data Entry SOP', category: 'CRM', version: 'v3.0', content: '1. Check for duplicates\n2. Validate fields\n3. Update contact info\n4. Tag appropriately\n5. Save & log' },
    { title: 'Cold Calling SOP', category: 'Sales', version: 'v1.5', content: '1. Open dialer\n2. Load list\n3. Use approved script\n4. Log disposition\n5. Schedule follow-up' },
    { title: 'Social Media Posting SOP', category: 'Marketing', version: 'v2.0', content: '1. Review content calendar\n2. Approve graphics\n3. Schedule posts\n4. Track engagement\n5. Weekly report' },
    { title: 'CMA Preparation SOP', category: 'Real Estate', version: 'v1.8', content: '1. Gather property data\n2. Pull comps from MLS\n3. Adjust for differences\n4. Generate report\n5. Submit for review' },
  ]
  const sopRecords = await Promise.all(
    sopDefs.map((s, i) =>
      db.sOP.create({
        data: {
          ...s,
          clientId: clientRecords[i % clientRecords.length].id,
          lastUpdated: new Date(Date.now() - (10 + i) * 24 * 60 * 60 * 1000),
        },
      })
    )
  )

  await Promise.all(
    sopRecords.map((s, i) =>
      db.sOPAssignment.create({
        data: { sopId: s.id, vaId: vaRecords[i % vaRecords.length].id },
      })
    )
  )

  console.log('Creating Documents...')
  const docCats = ['Contracts', 'SOPs', 'Brand Assets', 'Credentials', 'Reports', 'Deliverables', 'Training']
  for (let i = 0; i < 20; i++) {
    const client = clientRecords[i % clientRecords.length]
    const va = vaRecords[i % vaRecords.length]
    const cat = docCats[i % docCats.length]
    await db.document.create({
      data: {
        clientId: client.id,
        vaId: i % 3 === 0 ? va.id : null,
        title: `${cat} - ${client.companyName} - ${i + 1}`,
        category: cat,
        fileName: `${cat.toLowerCase()}_${i + 1}.pdf`,
        fileSize: 1024 * (50 + i * 30),
        isSensitive: cat === 'Credentials',
        encrypted: cat === 'Credentials',
        uploadedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        uploadedById: adminUser.id,
      },
    })
  }

  console.log('Creating Tickets (Client Requests)...')
  const ticketDefs = [
    { client: 0, title: 'Update CRM with today\'s new leads', type: 'Task Request', priority: 'High', status: 'In Progress' },
    { client: 0, title: 'Need CMA for property at 456 Oak Ave', type: 'Task Request', priority: 'Medium', status: 'Open' },
    { client: 1, title: 'Schedule Instagram posts for next week', type: 'Task Request', priority: 'Low', status: 'Open' },
    { client: 1, title: 'Issue: Wrong contact in CRM', type: 'Issue', priority: 'High', status: 'Waiting' },
    { client: 2, title: 'Change request: Update email signature', type: 'Change Request', priority: 'Medium', status: 'Resolved' },
    { client: 3, title: 'Question: How are KPIs calculated?', type: 'Question', priority: 'Low', status: 'Resolved' },
    { client: 0, title: 'Urgent: Missing leads in CRM', type: 'Urgent Request', priority: 'Urgent', status: 'In Progress' },
  ]
  for (let i = 0; i < ticketDefs.length; i++) {
    const t = ticketDefs[i]
    await db.ticket.create({
      data: {
        ticketId: `TKT-00${i + 1}`,
        clientId: clientRecords[t.client].id,
        title: t.title,
        description: `${t.title}\n\nDetails: This request was created by the client through the AVAS Client Portal. Please assign and process accordingly.`,
        type: t.type,
        priority: t.priority,
        status: t.status,
        assignedToId: t.status === 'Open' ? null : adminUser.id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000),
      },
    })
  }

  console.log('Creating Notifications...')
  const notifDefs = [
    { userId: adminUser.id, type: 'task_completed', title: 'Sarah completed "Update CRM Leads"', body: '12 records updated successfully', link: '/admin/tasks' },
    { userId: adminUser.id, type: 'qa_completed', title: 'QA Review completed for Ahmed', body: 'Score: 94%', link: '/admin/qa' },
    { userId: adminUser.id, type: 'late_attendance', title: 'Maria was late today', body: 'Clocked in at 9:42 AM (scheduled 9:00 AM)', link: '/admin/attendance' },
    { userId: adminUser.id, type: 'client_request', title: 'New client request from ABC Realty', body: 'Urgent: Missing leads in CRM', link: '/admin/requests' },
    { userId: adminUser.id, type: 'deliverable_submitted', title: 'David submitted cold calling report', body: 'Awaiting client approval', link: '/admin/deliverables' },
    { userId: clientUsers[0].id, type: 'task_completed', title: 'Sarah completed your task', body: 'CRM leads updated successfully', link: '/client/tasks' },
    { userId: clientUsers[0].id, type: 'report_generated', title: 'Weekly report ready', body: 'Sept 14-20 performance report is ready', link: '/client/reports' },
    { userId: clientUsers[1].id, type: 'deliverable_submitted', title: 'Maria submitted a deliverable', body: 'CRM Update Report ready for review', link: '/client/deliverables' },
    { userId: vaUserRecords[0].id, type: 'task_assigned', title: 'New task assigned', body: 'Update CRM Leads — due today', link: '/va/tasks' },
    { userId: vaUserRecords[0].id, type: 'qa_completed', title: 'QA Review: 96%', body: 'Great work on lead verification!', link: '/va/feedback' },
    { userId: vaUserRecords[1].id, type: 'task_assigned', title: 'New task assigned', body: 'Follow-up with new leads — due tomorrow', link: '/va/tasks' },
  ]
  for (const n of notifDefs) {
    await db.notification.create({
      data: { ...n, read: false, createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) },
    })
  }

  console.log('Creating Feedback (client satisfaction)...')
  for (let i = 0; i < 8; i++) {
    await db.feedback.create({
      data: {
        clientId: clientRecords[i % clientRecords.length].id,
        vaId: vaRecords[i % vaRecords.length].id,
        userId: clientUsers[i % clientUsers.length].id,
        rating: 4 + (i % 2),
        comment: i % 2 === 0 ? 'Excellent work — Sarah is always reliable.' : 'Good overall, would recommend.',
        period: 'Weekly',
      },
    })
  }

  console.log('Creating Audit Logs...')
  const auditDefs = [
    { action: 'VA_ASSIGNMENT_CREATED', entity: 'Assignment', before: null, after: 'ABC Realty -> Sarah (40h)' },
    { action: 'TIME_ADJUSTED', entity: 'TimeEntry', before: 'Clock-out: null', after: 'Clock-out: 6:04 PM (Adjusted by Admin — VA forgot to clock out)' },
    { action: 'CLIENT_CREATED', entity: 'Client', before: null, after: 'Coastal Realty' },
    { action: 'QA_REVIEW_COMPLETED', entity: 'QAReview', before: null, after: 'Score: 96% for Sarah' },
    { action: 'PERMISSION_UPDATED', entity: 'User', before: 'role=VA', after: 'role=TEAM_LEAD' },
  ]
  for (let i = 0; i < auditDefs.length; i++) {
    const a = auditDefs[i]
    await db.auditLog.create({
      data: {
        actorId: adminUser.id,
        action: a.action,
        entityType: a.entity,
        before: a.before,
        after: a.after,
        createdAt: new Date(Date.now() - i * 6 * 60 * 60 * 1000),
      },
    })
  }

  console.log('Creating Messages...')
  await db.message.create({
    data: {
      senderId: clientUsers[0].id,
      receiverId: adminUser.id,
      body: 'Hi Jawad, can we get a status update on Sarah\'s work this week?',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      read: true,
    },
  })
  await db.message.create({
    data: {
      senderId: adminUser.id,
      receiverId: clientUsers[0].id,
      body: 'Hi Michael, sure! Sarah has logged 21.5 hours this week and completed 12 tasks. QA score is 96%. You can check the full report in the Reports section.',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: false,
    },
  })
  await db.message.create({
    data: {
      senderId: clientUsers[0].id,
      receiverId: adminUser.id,
      body: 'Perfect, thank you! Could we set up an additional 10 hours next week for cold calling support?',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
    },
  })

  await db.message.create({
    data: {
      senderId: adminUser.id,
      receiverId: vaUserRecords[0].id,
      body: 'Hi Sarah, please prioritize the ABC Realty lead updates today.',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      read: true,
    },
  })
  await db.message.create({
    data: {
      senderId: vaUserRecords[0].id,
      receiverId: adminUser.id,
      body: 'Got it, Jawad. Already on it — should finish by 2 PM.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
    },
  })

  console.log('\n✅ Seed complete!\n')
  console.log('Demo accounts:')
  console.log('  ADMIN:   jawad@theavas.com   / admin123')
  console.log('  CLIENT:  michael@abcrealty.com / client123')
  console.log('  VA:      sarah@theavas.com   / va123')
}

function getWeekNumber(): number {
  const d = new Date()
  const oneJan = new Date(d.getFullYear(), 0, 1)
  const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000))
  return Math.ceil((d.getDay() + 1 + numberOfDays) / 7)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
