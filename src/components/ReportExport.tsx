'use client';

import { useState } from 'react';

type UserOption = { id: string; name: string; role: string; groupName?: string | null };
type Props = { role: 'ADMIN' | 'SUPERVISOR'; userId?: string; users: UserOption[] };

export default function ReportExport({ role, userId, users }: Props) {
  const [scope, setScope] = useState<'all' | 'group' | 'student'>(role === 'ADMIN' ? 'all' : 'group');
  const [selectedId, setSelectedId] = useState('');
  const groups = users.filter((user) => user.groupName && (user.role === 'SUPERVISOR' || user.role === 'ADMIN'));
  const students = users.filter((user) => user.role === 'USER');
  const id = role === 'SUPERVISOR' && scope === 'group' ? userId : selectedId;
  const ready = scope === 'all' || !!id;
  const params = new URLSearchParams({ scope });
  if (id) params.set('id', id);
  const reportUrl = (format: 'xlsx' | 'pptx') => `/api/reports/progress?${params.toString()}&format=${format}`;

  return (
    <section className="panel report-export">
      <h2>تصدير قوائم المتابعة</h2>
      <p>حمّل تقريرًا محدّثًا من بيانات الموقع وقت التنزيل. تُحسب الإنجازات المعتمدة فقط ضمن الإجمالي.</p>
      <div className="report-controls">
        <label>
          نوع التقرير
          <select value={scope} onChange={(event) => { setScope(event.target.value as typeof scope); setSelectedId(''); }}>
            {role === 'ADMIN' && <option value="all">الإنجاز العام</option>}
            <option value="group">مجموعة</option>
            <option value="student">طالب</option>
          </select>
        </label>
        {scope === 'group' && role === 'ADMIN' && (
          <label>
            المجموعة
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              <option value="">اختر المجموعة</option>
              {groups.map((group) => <option key={group.id} value={group.id}>{group.groupName} · {group.name}</option>)}
            </select>
          </label>
        )}
        {scope === 'student' && (
          <label>
            الطالب
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              <option value="">اختر الطالب</option>
              {students.map((student) => <option key={student.id} value={student.id}>{student.name}{role === 'ADMIN' && student.groupName ? ` · ${student.groupName}` : ''}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="report-actions">
        {ready ? (
          <>
            <a href={reportUrl('xlsx')}>تنزيل Excel</a>
            <a href={reportUrl('pptx')}>تنزيل PowerPoint</a>
          </>
        ) : <span>اختر {scope === 'group' ? 'المجموعة' : 'الطالب'} أولًا.</span>}
      </div>
    </section>
  );
}
