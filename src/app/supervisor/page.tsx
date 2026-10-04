import { redirect } from 'next/navigation';
import { getSession, prisma } from '@/lib/auth';
import ReportExport from '@/components/ReportExport';
import AchievementAdjustment from '@/components/AchievementAdjustment';

export default async function SupervisorPage() {
  const supervisor = await getSession();
  if (!supervisor) redirect('/login');
  if (supervisor.role !== 'SUPERVISOR' && supervisor.role !== 'ADMIN') redirect('/books');

  const students = await prisma.user.findMany({
    where: { supervisorId: supervisor.id, role: 'USER' },
    select: {
      id: true,
      name: true,
      isActive: true,
      progress: {
        select: {
          id: true,
          status: true,
          requestedAt: true,
          completedAt: true,
          content: { select: { title: true, type: true } },
        },
        orderBy: { requestedAt: 'desc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  const allProgress = students.flatMap((student) => student.progress);
  const approved = allProgress.filter((entry) => entry.status === 'APPROVED');
  const pending = allProgress.filter((entry) => entry.status === 'PENDING');

  return (
    <div className="shell">
      <header>
        <a href="/books" className="brand">منصة البرامج الذاتيه</a>
        <nav><a href="/books">المكتبة</a><a href="/progress">إنجازي</a><a href="/achievements">لوحة الإنجاز</a></nav>
      </header>
      <section className="hero compact">
        <p className="eyebrow">متابعة المجموعة</p>
        <h1>{supervisor.groupName || 'مجموعتي'}</h1>
        <p>إنجازات الأعضاء وطلباتهم في مكان واحد.</p>
      </section>
      <section className="stats" aria-label="ملخص المجموعة">
        <div><strong>{students.length}</strong><span>أعضاء المجموعة</span></div>
        <div><strong>{approved.filter((entry) => entry.content.type === 'BOOK').length}</strong><span>كتب مكتملة</span></div>
        <div><strong>{approved.filter((entry) => entry.content.type === 'AUDIO').length}</strong><span>مواد مسموعة مكتملة</span></div>
        <div><strong>{pending.length}</strong><span>طلبات معلقة</span></div>
      </section>
      <ReportExport role="SUPERVISOR" userId={supervisor.id} users={students.map((student) => ({ id: student.id, name: student.name, role: 'USER' }))} />
      <main className="supervisor-list">
        <h2>أعضاء المجموعة</h2>
        {students.length === 0 && <p className="supervisor-empty">لا يوجد أعضاء مرتبطون بحسابك حاليًا.</p>}
        {students.map((student) => {
          const completed = student.progress.filter((entry) => entry.status === 'APPROVED');
          const waiting = student.progress.filter((entry) => entry.status === 'PENDING');
          return (
            <details className="supervisor-member" key={student.id}>
              <summary>
                <span className="supervisor-member-name">{student.name}{!student.isActive && <small> · حساب معطّل</small>}</span>
                <span className="supervisor-member-counts">
                  {completed.filter((entry) => entry.content.type === 'BOOK').length} كتب · {' '}
                  {completed.filter((entry) => entry.content.type === 'AUDIO').length} صوتيات · {' '}
                  {waiting.length} معلّق
                </span>
              </summary>
              <div className="supervisor-member-detail">
                {student.progress.length === 0 && <p className="supervisor-empty">لم تُسجّل لهذا العضو طلبات أو إنجازات بعد.</p>}
                {student.progress.map((entry) => (
                  <div className="supervisor-progress" key={entry.id}>
                    <div>
                      <b>{entry.content.title}</b>
                      <small>
                        {entry.content.type === 'BOOK' ? 'كتاب' : 'مادة مسموعة'} · {' '}
                        {new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium' }).format(entry.completedAt || entry.requestedAt)}
                      </small>
                    </div>
                    <span className={`status ${entry.status}`}>
                      {entry.status === 'APPROVED' ? 'مكتمل' : entry.status === 'PENDING' ? 'قيد المراجعة' : 'مرفوض'}
                    </span>
                  </div>
                ))}
              </div>
            
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>زيادة أو خصم يدوي</h4>
                  <AchievementAdjustment students={[{ id: student.id, name: student.name }]} />
                </div>
              </details>
          );
        })}
      </main>
    </div>
  );
}
