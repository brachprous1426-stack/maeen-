'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { achievementTotals } from '@/lib/achievement-totals';
type Student = ReturnType<typeof achievementTotals> & { id: string; name: string; group: string };
const number = (n: number) => new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 1 }).format(n);

export default function AchievementBoard({ students, currentUserId }: { students: Student[]; currentUserId: string }) {
  const [search, setSearch] = useState(''), [group, setGroup] = useState('');
  const router = useRouter();
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') router.refresh(); };
    const interval = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [router]);
  const filtered = students.filter(s => !group || s.group === group);
  const missing = students.reduce((n, s) => n + s.missingAudio + s.missingBooks, 0);
  const groups = [...new Set(students.map(s => s.group))].sort((a, b) => a.localeCompare(b, 'ar'));
  return <main>
    <section className="achievement-stats" aria-label="حصيلة الإنجاز"><div><span>حصيلة القراءة</span><strong>{number(filtered.reduce((n, s) => n + s.readingTotal, 0))}<small>صفحة</small></strong><small>من الكتب والتعديلات اليدوية</small></div><div><span>حصيلة السماع</span><strong>{number(filtered.reduce((n, s) => n + s.listeningTotal, 0))}<small>دقيقة</small></strong><small>من المقاطع والتعديلات اليدوية</small></div></section>
    {!!missing && <p className="achievement-notice" role="status">هناك {number(missing)} إنجازًا معتمدًا بانتظار بيانات الصفحات أو المدة. تُضاف قيمته تلقائيًا فور استكمال بيانات المصدر.</p>}
    <div className="leaderboard-grid">{(['reading', 'listening'] as const).map(kind => {
      const reading = kind === 'reading';
      const totalKey = reading ? 'readingTotal' : 'listeningTotal';
      const ranked = [...filtered].sort((a, b) => b[totalKey] - a[totalKey] || a.name.localeCompare(b.name, 'ar') || a.id.localeCompare(b.id));
      let rank = 0;
      const rows = ranked.map((student, i) => { if (i === 0 || student[totalKey] !== ranked[i - 1][totalKey]) rank = i + 1; return { student, rank }; });
      const visible = rows.filter(({ student }) => student.name.includes(search.trim()));
      const max = ranked[0]?.[totalKey] || 1;
      return <section className={`leaderboard ${kind}`} key={kind}><div className="leaderboard-heading"><span className="board-icon" aria-hidden="true">{reading ? '▤' : '♫'}</span><div><p>{reading ? 'رحلة بين الصفحات' : 'معرفة تُنصت لها'}</p><h2>{reading ? 'صدارة القراءة' : 'صدارة السماع'}</h2></div><span className="board-unit">{reading ? 'صفحة' : 'دقيقة'}</span></div>
        <div className="leaderboard-columns"><span>المركز / الطالب</span><span>الإجمالي</span></div>
        <ol className="leaderboard-list">{visible.map(({ student: s, rank }) => <li key={s.id} className={`${rank <= 3 && s[totalKey] > 0 ? 'leading' : ''} ${s.id === currentUserId ? 'is-me' : ''}`}><details><summary><span className="rank">{s[totalKey] > 0 ? number(rank) : '—'}</span><span className="student-name"><b>{s.name}{s.id === currentUserId && <em>أنت</em>}</b><small>{s.group} · {number(reading ? s.books : s.audio)} {reading ? 'كتاب مكتمل' : 'مقطع مكتمل'}</small><span className="score-track"><span style={{ width: `${Math.max(0, s[totalKey] / max * 100)}%` }} /></span></span><strong className="student-score">{number(s[totalKey])}<small>{reading ? 'صفحة' : 'دقيقة'}</small></strong></summary><div className="score-detail"><span>من المواد المعتمدة: <b>{number(reading ? s.readingAuto : s.listeningAuto)}</b></span><span>صافي التعديلات اليدوية: <b>{number(reading ? s.readingManual : s.listeningManual)}</b></span>{!!(reading ? s.missingBooks : s.missingAudio) && <span className="PENDING">بانتظار بيانات {number(reading ? s.missingBooks : s.missingAudio)} مادة</span>}</div></details></li>)}</ol>
        {!visible.length && <p className="board-empty">{students.length ? 'لا توجد أسماء مطابقة للبحث.' : 'لم يُضف طلاب إلى المكتبة بعد.'}</p>}
      </section>;
    })}</div>
    <p className="leaderboard-note">تُحتسب المواد المعتمدة مرة واحدة. صفحات القراءة هي جميع صفحات ملف PDF، والسماع بالدقائق مع احتساب الثواني. يتشارك المتساوون المركز نفسه، والبحث بالاسم يحافظ على المركز. تتجدد النتائج كل ٣٠ ثانية.</p>
  </main>;
}
