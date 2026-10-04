'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function MetadataSync({ items }: { items: { id: string; title: string; type: string }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [errors, setErrors] = useState<string[]>([]);
  async function upload(form: HTMLFormElement) {
    setBusy(true); setMessage('جارٍ عد صفحات الملف…');
    try {
      const response = await fetch('/api/content/metadata', { method: 'POST', body: new FormData(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(`حُفظ عدد الصفحات: ${result.pageCount}`); form.reset(); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'تعذر قراءة الملف'); }
    finally { setBusy(false); }
  }
  async function sync() {
    setBusy(true); setErrors([]);
    let done = 0, failed = 0;
    for (const item of items) {
      setMessage(`قراءة ${done + 1} من ${items.length}: ${item.title}`);
      try {
        const response = await fetch('/api/content/metadata', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: item.id }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
      } catch (error) { failed++; setErrors(previous => [...previous, `${item.title}: ${error instanceof Error ? error.message : 'تعذر الاتصال'}`]); }
      done++;
    }
    setMessage(`تم تحديث ${done - failed} مادة${failed ? `، وتعذرت قراءة ${failed} مادة` : ''}.`);
    setBusy(false); router.refresh();
  }
  return <section className="metadata-sync"><h3>اكتمال بيانات المكتبة</h3><p>{items.length ? `${items.length} مادة تحتاج عدد صفحات أو مدة للسماع. استخرج البيانات من روابط المصادر قبل اعتماد النتائج النهائية.` : 'بيانات الصفحات والمدد مكتملة لجميع مواد المكتبة.'}</p>
    {!!items.length && <button className="secondary" disabled={busy} onClick={sync}>{busy ? 'جارٍ قراءة المصادر…' : 'استخراج البيانات الناقصة'}</button>}
    {items.some(i => i.type === 'BOOK') && <details><summary>حساب صفحات كتاب من نسخة PDF</summary><p>اختر نسخة مطابقة للكتاب المرتبط. يُحفظ عدد الصفحات فقط.</p><form onSubmit={e => { e.preventDefault(); void upload(e.currentTarget); }} className="achievement-adjustment"><label>الكتاب<select name="id" required>{items.filter(i => i.type === 'BOOK').map(i => <option key={i.id} value={i.id}>{i.title}</option>)}</select></label><label>ملف الكتاب<input type="file" name="file" accept="application/pdf,.pdf" required /></label><button className="secondary" disabled={busy}>حساب الصفحات وحفظها</button></form></details>}
    <p role="status">{message}</p>{!!errors.length && <details><summary>المواد التي تحتاج مراجعة ({errors.length})</summary><ul>{errors.map((error, i) => <li key={i}>{error}</li>)}</ul></details>}
  </section>;
}
