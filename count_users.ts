import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); prisma.user.count().then(c => console.log('USER COUNT: ' + c)).finally(() => prisma.$disconnect());
