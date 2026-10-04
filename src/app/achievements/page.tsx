import { redirect } from 'next/navigation';
import { getSession, prisma } from '@/lib/auth';
import { achievementTotals, canAdjust, durationSeconds } from '@/lib/achievement-totals';
import AchievementBoard from '@/components/AchievementBoard';
import AchievementAdjustment from '@/components/AchievementAdjustment';
import MetadataSync from '@/components/MetadataSync';

export const dynamic = 'force-dynamic';
export default async function AchievementsPage() {
  const actor = await getSession();
  const [students, contents] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true, name: true, groupName: true, role: true, supervisorId: true,
        supervisor: { select: { groupName: true } },
        achievements: { select: { id: true, type: true, amount: true, createdAt: true }, orderBy: { createdAt: 'desc' } },
        progress: { where: { status: 'APPROVED' }, select: { status: true, content: { select: { title: true, type: true, pageCount: true, duration: true } } } },
      }, orderBy: { name: 'asc' },
    }),
    actor?.role === 'ADMIN' ? prisma.content.findMany({ select: { id: true, title: true, type: true, pageCount: true, duration: true } }) : Promise.resolve([]),
  ]);
  const editable = actor ? students.filter(student => canAdjust(actor, student)) : [];
  const stats = students.map(student => ({ id: student.id, name: student.name, group: student.groupName || student.supervisor?.groupName || 'بدون مجموعة', ...achievementTotals(student) }));
  const history = editable.flatMap(student => student.achievements.map(a => ({ ...a, name: student.name }))).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 30);
  return <div className="shell achievements-shell">
    <header>
      <a href="/" className="brand">منصة البرامج الذاتيه</a>
      <nav>
        <a href="/books">المكتبة</a>
        {actor && <a href="/progress">إنجازي</a>}
        {actor?.role === 'ADMIN' && <a href="/admin">الإدارة</a>}
        {actor?.role === 'SUPERVISOR' && <a href="/supervisor">مجموعتي</a>}
        {!actor && <a href="/login">تسجيل الدخول</a>}
      </nav>
    </header>
    <section className="hero achievement-hero"><div><p className="eyebrow">كل صفحة أثر · وكل دقيقة معرفة</p><h1>ميدان الإنجاز</h1><p>خطوات صغيرة، حصيلة تستحق الفخر. هنا نجتمع على القراءة وحسن الاستماع.</p></div><span className="achievement-emblem" aria-hidden="true">✦</span></section>
    <AchievementBoard students={stats} currentUserId={actor?.id || ''} />
    {actor && ['ADMIN', 'SUPERVISOR'].includes(actor.role) && <section className="panel adjustment-panel"><p className="eyebrow">إدارة الإنجاز</p><h2>زيادة أو خصم يدوي</h2><AchievementAdjustment students={editable.map(({ id, name }) => ({ id, name }))} />
      <details className="adjustment-history"><summary>سجل التعديلات اليدوية · آخر ٣٠ تعديلًا</summary>{history.length ? history.map(a => <div key={a.id}><b>{a.name}</b><span dir="ltr">{a.amount > 0 ? '+' : ''}{a.amount}</span><span>{a.type === 'READING' ? 'صفحة' : 'دقيقة'}</span><time>{new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(a.createdAt)}</time></div>) : <p>لا توجد تعديلات يدوية بعد.</p>}</details>
    </section>}
    {actor?.role === 'ADMIN' && <MetadataSync items={contents.filter(c => c.type === 'BOOK' ? !c.pageCount : durationSeconds(c.duration) === null).map(({ id, title, type }) => ({ id, title, type }))} />}
  </div>;
}
