import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create organization
  let organization = await prisma.organization.findFirst({
    where: { name: 'RAD Design Studio' }
  })

  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: 'RAD Design Studio'
      }
    })
  }

  console.log(`✅ Created organization: ${organization.name}`)

  // Create users
  const adminPassword = await bcrypt.hash('Admin123!', 10)
  const pmPassword = await bcrypt.hash('Pm123!', 10)
  const designerPassword = await bcrypt.hash('Designer123!', 10)
  const clientPassword = await bcrypt.hash('Client123!', 10)

  let admin = await prisma.user.findFirst({
    where: { email: 'admin@rad.example' }
  })

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin@rad.example',
        name: 'Admin User',
        passwordHash: adminPassword,
        role: 'admin',
        organizationId: organization.id
      }
    })
  }

  let pm = await prisma.user.findFirst({
    where: { email: 'pm@rad.example' }
  })

  if (!pm) {
    pm = await prisma.user.create({
      data: {
        email: 'pm@rad.example',
        name: 'Project Manager',
        passwordHash: pmPassword,
        role: 'pm',
        organizationId: organization.id
      }
    })
  }

  let designer = await prisma.user.findFirst({
    where: { email: 'designer@rad.example' }
  })

  if (!designer) {
    designer = await prisma.user.create({
      data: {
        email: 'designer@rad.example',
        name: 'Senior Designer',
        passwordHash: designerPassword,
        role: 'designer',
        organizationId: organization.id
      }
    })
  }

  let client = await prisma.user.findFirst({
    where: { email: 'client@rad.example' }
  })

  if (!client) {
    client = await prisma.user.create({
      data: {
        email: 'client@rad.example',
        name: 'John Client',
        passwordHash: clientPassword,
        role: 'client',
        organizationId: organization.id
      }
    })
  }

  console.log(`✅ Created users: admin, pm, designer, client`)

  // Create sample project
  let project = await prisma.project.findFirst({
    where: { code: '202505-INT-BED01' }
  })

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Interior Rumah Tinggal – Kamar Tidur Minimalis',
        code: '202505-INT-BED01',
        clientName: 'Bapak John Doe',
        startDate: new Date('2025-05-12'),
        endDate: new Date('2025-06-30'),
        description: 'Complete interior design and renovation for master bedroom with minimalist concept.',
        createdBy: admin.id,
        organizationId: organization.id
      }
    })
  }

  console.log(`✅ Created project: ${project.name}`)

  // Create default phases with weights
  const phasesData = [
    { key: 'moodboard', name: 'Moodboard', order: 1, weight: 10 },
    { key: 'layout', name: 'Layout', order: 2, weight: 20 },
    { key: 'design', name: 'Design', order: 3, weight: 25 },
    { key: 'material_scheduler', name: 'Material Scheduler', order: 4, weight: 15 },
    { key: 'construction_drawing', name: 'Construction Drawing', order: 5, weight: 20 },
    { key: 'supervision', name: 'Supervision', order: 6, weight: 10 }
  ]

  const phases = []
  for (const phaseData of phasesData) {
    let phase = await prisma.phase.findFirst({
      where: { 
        projectId: project.id,
        key: phaseData.key
      }
    })

    if (!phase) {
      phase = await prisma.phase.create({
        data: {
          projectId: project.id,
          key: phaseData.key,
          name: phaseData.name,
          order: phaseData.order,
          weight: phaseData.weight,
          startDate: new Date('2025-05-12'),
          dueDate: new Date('2025-06-30')
        }
      })
    }
    phases.push(phase)
  }

  console.log(`✅ Created ${phases.length} phases`)

  // Create sample tasks
  const tasksData = [
    // Moodboard tasks
    { phaseKey: 'moodboard', title: 'Research minimalist bedroom concepts', status: 'done', progress: 100 },
    { phaseKey: 'moodboard', title: 'Create color palette', status: 'done', progress: 100 },
    { phaseKey: 'moodboard', title: 'Select furniture styles', status: 'in_progress', progress: 75 },
    
    // Layout tasks
    { phaseKey: 'layout', title: 'Measure room dimensions', status: 'done', progress: 100 },
    { phaseKey: 'layout', title: 'Create initial layout', status: 'in_progress', progress: 60 },
    { phaseKey: 'layout', title: 'Review layout with client', status: 'backlog', progress: 0 },
    
    // Design tasks
    { phaseKey: 'design', title: 'Develop 3D renderings', status: 'in_progress', progress: 40 },
    { phaseKey: 'design', title: 'Create material board', status: 'backlog', progress: 0 },
    { phaseKey: 'design', title: 'Design custom furniture', status: 'backlog', progress: 0 },
    
    // Material Scheduler tasks
    { phaseKey: 'material_scheduler', title: 'Source materials', status: 'backlog', progress: 0 },
    { phaseKey: 'material_scheduler', title: 'Get samples', status: 'backlog', progress: 0 },
    
    // Construction Drawing tasks
    { phaseKey: 'construction_drawing', title: 'Create technical drawings', status: 'backlog', progress: 0 },
    { phaseKey: 'construction_drawing', title: 'Prepare electrical plan', status: 'backlog', progress: 0 },
    
    // Supervision tasks
    { phaseKey: 'supervision', title: 'Site supervision', status: 'backlog', progress: 0 },
    { phaseKey: 'supervision', title: 'Quality control', status: 'backlog', progress: 0 }
  ]

  let taskOrder = 1
  for (const taskData of tasksData) {
    const phase = phases.find(p => p.key === taskData.phaseKey)
    if (phase) {
      await prisma.task.create({
        data: {
          projectId: project.id,
          phaseId: phase.id,
          title: taskData.title,
          status: taskData.status,
          progress: taskData.progress,
          assigneeId: taskData.status === 'done' ? designer.id : taskData.status === 'in_progress' ? designer.id : null,
          order: taskOrder++
        }
      })
    }
  }

  console.log(`✅ Created ${tasksData.length} tasks`)

  // Create sample revisions for design phase
  const designPhase = phases.find(p => p.key === 'design')
  if (designPhase) {
    const revision1 = await prisma.revision.create({
      data: {
        phaseId: designPhase.id,
        label: 'D1',
        notes: 'Initial design concept with minimalist approach',
        status: 'submitted',
        submittedAt: new Date(),
        createdBy: designer.id
      }
    })

    const revision2 = await prisma.revision.create({
      data: {
        phaseId: designPhase.id,
        label: 'D2',
        notes: 'Revised design based on client feedback',
        status: 'approved',
        submittedAt: new Date(),
        decidedAt: new Date(),
        createdBy: designer.id
      }
    })

    console.log(`✅ Created 2 revisions for design phase`)
  }

  // Create sample materials
  const materialsData = [
    { code: 'PT-1', name: 'Cat Putih Dove', category: 'PT', vendor: 'Dulux', price: 150000, status: 'approved' },
    { code: 'PL-1', name: 'Laminates Oak Natural', category: 'PL', vendor: 'MKT', price: 250000, status: 'approved' },
    { code: 'GL-1', name: 'Kaca Tempered 8mm', category: 'GL', vendor: 'Asahimas', price: 450000, status: 'sampled' },
    { code: 'MT-1', name: 'Handle Brushed SS', category: 'MT', vendor: 'Hafele', price: 75000, status: 'approved' },
    { code: 'FT-1', name: 'Fabric Linen Beige', category: 'FT', vendor: 'Kris', price: 180000, status: 'sampled' }
  ]

  for (const materialData of materialsData) {
    await prisma.materialItem.create({
      data: {
        projectId: project.id,
        ...materialData
      }
    })
  }

  console.log(`✅ Created ${materialsData.length} materials`)

  // Create sample activity logs
  const activitiesData = [
    { action: 'CREATE_PROJECT', payload: { projectName: project.name } },
    { action: 'CREATE_TASK', payload: { taskTitle: 'Research minimalist bedroom concepts' } },
    { action: 'UPDATE_TASK', payload: { taskStatus: 'done' } },
    { action: 'CREATE_REVISION', payload: { revisionLabel: 'D1' } },
    { action: 'CREATE_MATERIAL', payload: { materialCode: 'PT-1' } }
  ]

  for (const activityData of activitiesData) {
    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        actorId: admin.id,
        ...activityData
      }
    })
  }

  console.log(`✅ Created ${activitiesData.length} activity logs`)

  // Update phase progress based on tasks
  for (const phase of phases) {
    const tasks = await prisma.task.findMany({
      where: { phaseId: phase.id }
    })
    
    const progress = tasks.length > 0 
      ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)
      : 0
    
    await prisma.phase.update({
      where: { id: phase.id },
      data: { progress }
    })
  }

  console.log(`✅ Updated phase progress`)

  console.log('🎉 Database seeding completed successfully!')
  console.log('')
  console.log('📧 Login credentials:')
  console.log('   Admin: admin@rad.example / Admin123!')
  console.log('   PM: pm@rad.example / Pm123!')
  console.log('   Designer: designer@rad.example / Designer123!')
  console.log('   Client: client@rad.example / Client123!')
  console.log('')
  console.log('🏠 Sample project: 202505-INT-BED01')
  console.log('   Interior Rumah Tinggal – Kamar Tidur Minimalis')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })