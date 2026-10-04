'use client';
import { useActionState } from 'react';
import { saveAdjustment } from '@/app/actions/achievements';

export default function AchievementAdjustment({ students }: { students: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(saveAdjustment, { message: '', ok: false });
  return <form action={action} className="achievement-adjustment">
    <label>الطالب<select name="userId" required defaultValue=""><option value="" disabled>اختر الطالب</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <label>نوع الإنجاز<select name="type"><option value="READING">قراءة · صفحات</option><option value="LISTENING">سماع · دقائق</option></select></label>
    <label>مقدار التعديل<input name="amount" type="number" step="1" min="-1000000" max="1000000" required placeholder="مثال: 20 أو -10" /></label>
    <button className="primary" disabled={pending || !students.length}>{pending ? 'جارٍ الحفظ…' : 'حفظ التعديل'}</button>
    <p className="adjustment-help">رقم موجب للزيادة وسالب للنقصان. يُضاف التعديل إلى الإنجاز التلقائي، ولا يظهر الإجمالي أقل من صفر.</p>
    {state.message && <p role="status" className={state.ok ? 'success' : 'REJECTED'}>{state.message}</p>}
  </form>;
}
