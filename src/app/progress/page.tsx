import { redirect } from 'next/navigation';
import { getSession, prisma } from '@/lib/auth';

export default async function Progress() {
  const user = await getSession();
  if (!user) redirect('/login');
  const rows = await prisma.progressTracker.findMany({
    where: { userId: user.id },
    include: { content: true },
    orderBy: { requestedAt: 'desc' },
  });
  const approved = rows.filter((row) => row.status === 'APPROVED');
  const date = new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium' });

  return (
    <div className="shell">
      <header><a href="/books" className="brand">مَعين</a><a href="/books">العودة للمكتبة</a></header>
      <section className="hero compact">
        <p className="eyebrow">مساحتي</p>
        <h1>إنجازي</h1>
        <p>طلباتك والمواد التي أُنجزت بعد اعتمادها.</p>
      </section>
      <div className="stats">
        <div><strong>{approved.filter((row) => row.content.type === 'BOOK').length}</strong><span>كتب مقروءة</span></div>
        <div><strong>{approved.filter((row) => row.content.type === 'AUDIO').length}</strong><span>صوتيات مستمعة</span></div>
        <div><strong>{rows.filter((row) => row.status === 'PENDING').length}</strong><span>طلبات معلقة</span></div>
      </div>
      <main className="progress-list">
        {rows.length === 0 && <p className="supervisor-empty">لم تطلب تسجيل إنجاز بعد.</p>}
        {rows.map((row) => (
          <div className="progress-row" key={row.id}>
            <div>
              <b>{row.content.title}</b>
              <small>
                {row.status === 'APPROVED' && row.completedAt ? 'اكتمل في ' : 'طُلب في '}
                {date.format(row.status === 'APPROVED' && row.completedAt ? row.completedAt : row.requestedAt)}
              </small>
            </div>
            <span className={`status ${row.status}`}>
              {row.status === 'APPROVED' ? 'مكتمل' : row.status === 'PENDING' ? 'قيد المراجعة' : 'مرفوض'}
            </span>
          </div>
        ))}
      </main>
    </div>
  );
}


