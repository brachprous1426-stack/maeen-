import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      name: true,
      role: true,
      accessCode: true,
      groupName: true,
      supervisor: { select: { name: true } }
    },
    orderBy: [
      { role: 'asc' },
      { name: 'asc' }
    ]
  });

  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
