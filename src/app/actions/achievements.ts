'use server';

import { getSession, prisma } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function addAchievement(formData: FormData) {
  const supervisor = await getSession();
  if (!supervisor || (supervisor.role !== 'SUPERVISOR' && supervisor.role !== 'ADMIN')) {
    throw new Error('Unauthorized');
  }

  const userId = formData.get('userId') as string;
  const type = formData.get('type') as 'LISTENING' | 'READING';
  const amount = parseInt(formData.get('amount') as string, 10);

  if (!userId || !type || isNaN(amount) || amount <= 0) {
    throw new Error('Invalid input');
  }

  await prisma.achievement.create({
    data: {
      userId,
      type,
      amount,
    },
  });

  revalidatePath('/supervisor');
  revalidatePath('/achievements');
}
