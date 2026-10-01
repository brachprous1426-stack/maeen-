import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const data = {
  admin: {
    name: 'سلمان الشبانات',
    role: 'ADMIN',
    accessCode: '839104',
  },
  groups: [
    {
      groupName: 'العطاء',
      supervisor: { name: 'إبراهيم الغريبي', accessCode: '392018' },
      students: [
        { name: 'بدر الباز', accessCode: '193847' },
        { name: 'عبدالله الفضلي', accessCode: '847291' },
        { name: 'عمر العقيلي', accessCode: '293845' },
        { name: 'محمد ال عبدالله', accessCode: '581023' },
        { name: 'محمد الهويمل', accessCode: '682910' },
        { name: 'سعد الصفار', accessCode: '401928' },
        { name: 'عمر العيدان', accessCode: '748291' },
      ],
    },
    {
      groupName: 'العزم',
      supervisor: { name: 'ياسر الجوهر', accessCode: '582910', role: 'ADMIN' },
      students: [
        { name: 'اسامة المبدل', accessCode: '104928' },
        { name: 'عبدالله يعرب العوشن', accessCode: '948102' },
        { name: 'عبدالرحمن العبيد', accessCode: '384910' },
        { name: 'محمد العيد', accessCode: '849201' },
        { name: 'عبدالله آل عبدالله', accessCode: '203948' },
        { name: 'محمد الغنام', accessCode: '673829' },
      ],
    },
    {
      groupName: 'القيم',
      supervisor: { name: 'إبراهيم الدوسري', accessCode: '492018' },
      students: [
        { name: 'عبدالعزيز آل حسين', accessCode: '748192' },
        { name: 'فهد العسكر', accessCode: '283910' },
        { name: 'عبدالرحمن الشهري', accessCode: '682019' },
        { name: 'عبدالله الصفار', accessCode: '192837' },
        { name: 'عبدالله آل الشيخ', accessCode: '948271' },
        { name: 'محمد بن المنيع', accessCode: '384710' },
      ],
    },
    {
      groupName: 'الضياء',
      supervisor: { name: 'مشعل الغنام', accessCode: '281930' },
      students: [
        { name: 'عبدالعزيز القشيش', accessCode: '582930' },
        { name: 'عبدالعزيز الجنيدل', accessCode: '839201' },
        { name: 'راشد الدباس', accessCode: '102938' },
        { name: 'عبدالعزيز الشهري', accessCode: '482910' },
        { name: 'سعيد الصفار', accessCode: '672819' },
        { name: 'بتال العوشن', accessCode: '384920' },
      ],
    },
    {
      groupName: 'النور',
      supervisor: { name: 'عبدالرحمن العثمان', accessCode: '748201' },
      students: [
        { name: 'ريان الخميس', accessCode: '192038' },
        { name: 'فراس الجسار', accessCode: '583920' },
        { name: 'صالح آل عبدالسلام', accessCode: '829103' },
        { name: 'حمد آل عبدالله', accessCode: '382910' },
        { name: 'عبدالملك النصار', accessCode: '481920' },
        { name: 'ريان الخميس (الثاني)', accessCode: '682930' },
      ],
    },
  ],
}

async function main() {
  console.log('Starting seed...')
  
  // 1. Create General Admin
  await prisma.user.upsert({
    where: { accessCode: data.admin.accessCode },
    update: {},
    create: {
      name: data.admin.name,
      accessCode: data.admin.accessCode,
      role: 'ADMIN',
    },
  })
  console.log(`Created admin: ${data.admin.name}`)

  // 2. Create Supervisors and Students
  for (const group of data.groups) {
    const supervisorRole = 'role' in group.supervisor && group.supervisor.role === 'ADMIN' ? 'ADMIN' : 'SUPERVISOR'
    const supervisor = await prisma.user.upsert({
      where: { accessCode: group.supervisor.accessCode },
      update: { role: supervisorRole, groupName: group.groupName },
      create: {
        name: group.supervisor.name,
        accessCode: group.supervisor.accessCode,
        role: supervisorRole,
        groupName: group.groupName,
      },
    })
    console.log(`Created supervisor: ${supervisor.name} for group ${group.groupName}`)

    for (const student of group.students) {
      await prisma.user.upsert({
        where: { accessCode: student.accessCode },
        update: { supervisorId: supervisor.id, groupName: group.groupName, role: 'USER' },
        create: {
          name: student.name,
          accessCode: student.accessCode,
          role: 'USER',
          groupName: group.groupName,
          supervisorId: supervisor.id,
        },
      })
    }
    console.log(`Created ${group.students.length} students for group ${group.groupName}`)
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
