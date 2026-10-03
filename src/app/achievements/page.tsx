import { redirect } from 'next/navigation';
import { getSession, prisma } from '@/lib/auth';

export default async function AchievementsPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    select: {
      id: true,
      name: true,
      achievements: true,
    },
    orderBy: { name: 'asc' },
  });

  // Calculate totals for each user
  const stats = users.map(u => {
    let listeningTotal = 0;
    let readingTotal = 0;
    
    for (const ach of u.achievements) {
      if (ach.type === 'LISTENING') listeningTotal += ach.amount;
      if (ach.type === 'READING') readingTotal += ach.amount;
    }
    
    return {
      ...u,
      listeningTotal,
      readingTotal
    };
  });

  // Sort for listening board (highest first)
  const listeningBoard = [...stats].sort((a, b) => b.listeningTotal - a.listeningTotal);
  
  // Sort for reading board (highest first)
  const readingBoard = [...stats].sort((a, b) => b.readingTotal - a.readingTotal);

  return (
    <div className="shell">
      <header>
        <a href="/books" className="brand">ثاتي</a>
        <nav>
          <a href="/books">المكتبة</a>
          <a href="/progress">متابعتي</a>
          <a href="/achievements">لوحة الإنجاز</a>
        </nav>
      </header>
      <section className="hero compact">
        <p className="eyebrow">المنافسة</p>
        <h1>لوحة الإنجاز</h1>
        <p>متابعة الإنجازات لجميع الطلاب في الاستماع والقراءة.</p>
      </section>

      <main style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', padding: '2rem 0' }}>
        
        {/* Listening Board */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h2 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#111' }}>
            🎧 لوحة السماع للمقاطع
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '0.75rem' }}>المركز</th>
                <th style={{ padding: '0.75rem' }}>الاسم</th>
                <th style={{ padding: '0.75rem' }}>الدقائق</th>
              </tr>
            </thead>
            <tbody>
              {listeningBoard.map((s, index) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                  <td style={{ padding: '0.75rem' }}>{index + 1}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{s.name}</td>
                  <td style={{ padding: '0.75rem', color: '#0070f3' }}>{s.listeningTotal} دقيقة</td>
                </tr>
              ))}
              {listeningBoard.length === 0 && (
                <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center' }}>لا يوجد بيانات</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Reading Board */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h2 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#111' }}>
            📖 لوحة القراءة
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '0.75rem' }}>المركز</th>
                <th style={{ padding: '0.75rem' }}>الاسم</th>
                <th style={{ padding: '0.75rem' }}>الصفحات</th>
              </tr>
            </thead>
            <tbody>
              {readingBoard.map((s, index) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                  <td style={{ padding: '0.75rem' }}>{index + 1}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{s.name}</td>
                  <td style={{ padding: '0.75rem', color: '#0070f3' }}>{s.readingTotal} صفحة</td>
                </tr>
              ))}
              {readingBoard.length === 0 && (
                <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center' }}>لا يوجد بيانات</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}
