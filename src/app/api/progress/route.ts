import { NextResponse } from 'next/server';
import { prisma, requireAdmin, requireUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role === 'ADMIN') {
      return NextResponse.json(await prisma.progressTracker.findMany({
        include: { user: true, content: true },
        orderBy: { requestedAt: 'desc' },
      }));
    }
    return NextResponse.json(await prisma.progressTracker.findMany({
      where: { userId: user.id },
      include: { content: true },
    }));
  } catch {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { contentId } = await req.json();
    if (typeof contentId !== 'string' || !contentId) {
      return NextResponse.json({ error: 'اختر المادة' }, { status: 400 });
    }
    const existing = await prisma.progressTracker.findUnique({
      where: { userId_contentId: { userId: user.id, contentId } },
    });
    if (existing?.status === 'REJECTED') {
      return NextResponse.json(await prisma.progressTracker.update({
        where: { id: existing.id },
        data: { status: 'PENDING', requestedAt: new Date(), completedAt: null, createdBy: 'SELF' },
      }));
    }
    if (existing) return NextResponse.json({ error: 'يوجد طلب مسبق' }, { status: 400 });
    return NextResponse.json(await prisma.progressTracker.create({
      data: { userId: user.id, contentId, status: 'PENDING', createdBy: 'SELF' },
    }));
  } catch {
    return NextResponse.json({ error: 'تعذر إرسال الطلب' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 400 });
    const result = await prisma.progressTracker.deleteMany({
      where: { id, userId: user.id, status: 'PENDING' },
    });
    if (result.count === 0) return NextResponse.json({ error: 'غير مسموح' }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'تعذر إلغاء الطلب' }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const { id, action, userId, contentId } = await req.json();
    if (action === 'approve' || action === 'reject') {
      if (typeof id !== 'string' || !id) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 400 });
      const result = await prisma.progressTracker.updateMany({
        where: { id, status: 'PENDING' },
        data: action === 'approve'
          ? { status: 'APPROVED', completedAt: new Date() }
          : { status: 'REJECTED', completedAt: null },
      });
      if (result.count === 0) return NextResponse.json({ error: 'الطلب غير معلّق' }, { status: 409 });
      return NextResponse.json(await prisma.progressTracker.findUnique({ where: { id } }));
    }
    if (action === 'add') {
      if (typeof userId !== 'string' || typeof contentId !== 'string' || !userId || !contentId) {
        return NextResponse.json({ error: 'اختر العضو والمادة' }, { status: 400 });
      }
      const existing = await prisma.progressTracker.findUnique({
        where: { userId_contentId: { userId, contentId } },
      });
      if (existing?.status === 'APPROVED') {
        return NextResponse.json(existing);
      }
      const completedAt = new Date();
      return NextResponse.json(await prisma.progressTracker.upsert({
        where: { userId_contentId: { userId, contentId } },
        create: { userId, contentId, status: 'APPROVED', createdBy: 'ADMIN', completedAt },
        update: { status: 'APPROVED', createdBy: 'ADMIN', completedAt },
      }));
    }
    if (action === 'remove') {
      if (typeof userId !== 'string' || typeof contentId !== 'string' || !userId || !contentId) {
        return NextResponse.json({ error: 'اختر العضو والمادة' }, { status: 400 });
      }
      await prisma.progressTracker.deleteMany({ where: { userId, contentId } });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'عملية غير معروفة' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'تعذر التنفيذ' }, { status: 400 });
  }
}
