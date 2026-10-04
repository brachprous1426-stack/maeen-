'use server';

import { getSession, prisma } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { canAdjust } from '@/lib/achievement-totals';

export async function saveAdjustment(_previous: { message: string; ok: boolean }, formData: FormData) {
  try {
    const actor = await getSession();
    if (!actor || !['ADMIN', 'SUPERVISOR'].includes(actor.role)) return { ok: false, message: 'غير مصرح بالتعديل' };
    const userId = String(formData.get('userId') || '');
    const type = String(formData.get('type') || '');
    const raw = String(formData.get('amount') || '');
    const amount = Number(raw);
    if (!['READING', 'LISTENING'].includes(type) || !/^-?\d+$/.test(raw) || !Number.isSafeInteger(amount) || amount === 0 || Math.abs(amount) > 1000000) {
      return { ok: false, message: 'أدخل عددًا صحيحًا غير صفر، من −١٬٠٠٠٬٠٠٠ إلى ١٬٠٠٠٬٠٠٠' };
    }
    const student = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, supervisorId: true } });
    if (!student || !canAdjust(actor, student)) return { ok: false, message: 'يمكنك تعديل طلاب مجموعتك فقط' };
    await prisma.achievement.create({ data: { userId, type: type as 'READING' | 'LISTENING', amount } });
    revalidatePath('/supervisor');
    revalidatePath('/achievements');
    return { ok: true, message: 'حُفظ التعديل وتحدّث الترتيب' };
  } catch { return { ok: false, message: 'تعذر حفظ التعديل، حاول مرة أخرى' }; }
}

export async function addAchievement(formData: FormData) {
  const result = await saveAdjustment({ message: '', ok: false }, formData);
  if (!result.ok) throw new Error(result.message);
}
