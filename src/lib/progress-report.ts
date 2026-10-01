import { prisma } from '@/lib/auth';

export type ReportScope = 'all' | 'group' | 'student';
export type ReportFormat = 'xlsx' | 'pptx';

type Requester = {
  id: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'USER';
};

export class ReportAccessError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function getProgressReport(requester: Requester, scope: ReportScope, id?: string) {
  let title = 'الإنجاز العام';
  let where: { role: 'USER'; supervisorId?: string; id?: string } = { role: 'USER' };

  if (scope === 'all') {
    if (requester.role !== 'ADMIN') throw new ReportAccessError(403, 'غير مسموح');
  } else if (scope === 'group') {
    if (!id) throw new ReportAccessError(400, 'اختر المجموعة');
    const supervisor = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, groupName: true, role: true },
    });
    if (!supervisor?.groupName || !['ADMIN', 'SUPERVISOR'].includes(supervisor.role)) {
      throw new ReportAccessError(404, 'المجموعة غير موجودة');
    }
    if (requester.role !== 'ADMIN' && (requester.role !== 'SUPERVISOR' || requester.id !== id)) {
      throw new ReportAccessError(403, 'غير مسموح');
    }
    title = `مجموعة ${supervisor.groupName}`;
    where = { role: 'USER', supervisorId: id };
  } else if (scope === 'student') {
    if (!id) throw new ReportAccessError(400, 'اختر الطالب');
    const student = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, role: true, supervisorId: true },
    });
    if (!student || student.role !== 'USER') throw new ReportAccessError(404, 'الطالب غير موجود');
    if (
      requester.role !== 'ADMIN' &&
      !(requester.role === 'SUPERVISOR' && student.supervisorId === requester.id) &&
      !(requester.role === 'USER' && student.id === requester.id)
    ) {
      throw new ReportAccessError(403, 'غير مسموح');
    }
    title = `إنجاز ${student.name}`;
    where = { role: 'USER', id };
  } else {
    throw new ReportAccessError(400, 'نوع التقرير غير معروف');
  }

  const members = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      groupName: true,
      progress: {
        select: {
          id: true,
          status: true,
          requestedAt: true,
          completedAt: true,
          createdBy: true,
          content: {
            select: { title: true, type: true, category: { select: { name: true } } },
          },
        },
        orderBy: { requestedAt: 'desc' },
      },
    },
    orderBy: [{ groupName: 'asc' }, { name: 'asc' }],
  });

  const counts = (rows: typeof members) => {
    const progress = rows.flatMap((member) => member.progress);
    return {
      members: rows.length,
      books: progress.filter((item) => item.status === 'APPROVED' && item.content.type === 'BOOK').length,
      audio: progress.filter((item) => item.status === 'APPROVED' && item.content.type === 'AUDIO').length,
      pending: progress.filter((item) => item.status === 'PENDING').length,
      rejected: progress.filter((item) => item.status === 'REJECTED').length,
    };
  };

  const groups = Array.from(new Set(members.map((member) => member.groupName || 'بلا مجموعة')))
    .sort((a, b) => a.localeCompare(b, 'ar'))
    .map((name) => ({ name, ...counts(members.filter((member) => (member.groupName || 'بلا مجموعة') === name)) }));

  return { scope, title, generatedAt: new Date(), members, groups, summary: counts(members) };
}

export type ProgressReport = Awaited<ReturnType<typeof getProgressReport>>;
