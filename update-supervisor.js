const fs = require('fs');
const p = 'src/app/supervisor/page.tsx';
let c = fs.readFileSync(p, 'utf8');

if (!c.includes('addAchievement')) {
  c = c.replace(/import ReportExport from '@\/components\/ReportExport';/, 
    "import ReportExport from '@/components/ReportExport';\nimport { addAchievement } from '@/app/actions/achievements';");

  c = c.replace(/<\/details>/g, `
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>إضافة إنجاز</h4>
                  <form action={addAchievement} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="hidden" name="userId" value={student.id} />
                    <select name="type" required style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #ccc' }}>
                      <option value="LISTENING">سماع المقاطع (دقائق)</option>
                      <option value="READING">قراءة (صفحات)</option>
                    </select>
                    <input type="number" name="amount" placeholder="الكمية" required style={{ width: '80px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ccc' }} />
                    <button type="submit" style={{ padding: '0.25rem 0.75rem', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>إضافة</button>
                  </form>
                </div>
              </details>`);
  fs.writeFileSync(p, c);
}
