import Link from 'next/link';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const user = await getSession();

  return (
    <div className="shell">
      {/* Header */}
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            
            <div className="brand">منصة معين</div>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--line)' }}></div>
          <img src="/bader-logo.svg" alt="فريق بادر" style={{ height: '32px', objectFit: 'contain' }} title="مبادرة من فريق بادر" />
        </div>
        <nav>
          {user ? (
            <>
              <Link href="/books" className="primary">المكتبة</Link>
              <Link href="/achievements" className="secondary" style={{ marginLeft: '10px' }}>لوحة الإنجاز</Link>
            </>
          ) : (
            <>
              <Link href="/login?redirect=/books" className="primary">دخول للمكتبة</Link>
              <Link href="/achievements" className="secondary" style={{ marginLeft: '10px' }}>لوحة الإنجاز</Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <div className="hero">
        <div className="eyebrow">منصتك المعرفية والإيمانية</div>
        <h1>وجهتك الأولى <br /> للزاد العلمي والإيماني والدعوي</h1>
        <p>منصة معين هي مورد لمن أراد الإرتواء من الزاد العلمي والإيماني والدعوي، توفر بيئة قراءة تفاعلية وخاصة للارتقاء بتجربتك وتسهيل وصولك لأمهات الكتب والمصادر القيمة.</p>
        
        <div style={{ marginTop: '24px' }}>
          {user ? (
            <Link href="/books" className="primary" style={{ background: 'var(--sand)', color: 'var(--pine)', display: 'inline-block' }}>
              تصفح الكتب
            </Link>
          ) : (
            <Link href="/login?redirect=/books" className="primary" style={{ background: 'var(--sand)', color: 'var(--pine)', display: 'inline-block' }}>
              ابدأ رحلتك الآن
            </Link>
          )}
        </div>
      </div>

      {/* About Section */}
      <div className="panel" style={{ margin: '40px 0' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>نبذة عن المنصة</h2>
        <p style={{ color: 'var(--muted)', lineHeight: '1.8', fontSize: '15px', marginBottom: '20px' }}>
          <strong>منصة معين</strong> هي مورد لمن أراد الإرتواء من الزاد العلمي والإيماني والدعوي، وتهدف إلى إعادة إحياء شغف المطالعة وتسهيل الوصول إلى المحتوى العربي الأصيل. 
          نحن نؤمن بأن القراءة ليست مجرد هواية، بل هي أسلوب حياة وأداة أساسية لتطوير الذات والمجتمعات. لذلك، صممنا هذه المنصة لتكون واحتك الخاصة التي تجد فيها المعرفة المنظمة، وأدوات المتابعة المتقدمة التي تساعدك على الاستمرارية.
        </p>

        <div style={{ background: '#fffdfa', padding: '24px', borderRadius: '12px', border: '1px solid var(--line)', position: 'relative' }}>
          <p style={{ fontSize: '18px', color: 'var(--pine)', fontStyle: 'italic', lineHeight: '1.7', margin: '0' }}>
            "الكتاب هو الجليس الذي لا يطريك، والصديق الذي لا يغريك، والرفيق الذي لا يملك، والجار الذي لا يستبطئك."
          </p>
          <small style={{ display: 'block', marginTop: '12px', color: 'var(--muted)', fontWeight: 'bold' }}>- الجاحظ</small>
        </div>
      </div>

      {/* Importance Section */}
      <div style={{ margin: '60px 0 40px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>لماذا منصة معين؟</h2>
        
        <div className="grid">
          {/* Feature 1 */}
          <div className="card">
            <div className="card-body">
              <h2 style={{ color: 'var(--pine)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📚</span> محتوى منتقى بعناية
              </h2>
              <p style={{ marginTop: '8px' }}>
                نحرص على توفير أفضل الكتب والمصادر الموثوقة التي تثري العقل وتساهم في بناء ثقافة قوية ومتزنة للمشتركين.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="card">
            <div className="card-body">
              <h2 style={{ color: 'var(--pine)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📈</span> تتبع الإنجازات
              </h2>
              <p style={{ marginTop: '8px' }}>
                أدوات متقدمة لتتبع تقدمك في القراءة، تسجيل ملاحظاتك، وتحفيزك المستمر لتحقيق أهدافك المعرفية.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="card">
            <div className="card-body">
              <h2 style={{ color: 'var(--pine)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔒</span> بيئة خاصة وآمنة
              </h2>
              <p style={{ marginTop: '8px' }}>
                منصة مخصصة لك تركز على توفير تجربة قراءة خالية من المشتتات، مع الحفاظ على خصوصية بياناتك وتفضيلاتك.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '40px 0 0', borderTop: '1px solid var(--line)', color: 'var(--muted)', fontSize: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
          
          <strong style={{ color: 'var(--pine)', fontSize: '16px' }}>منصة معين</strong>
        </div>
        <p style={{ marginBottom: '16px' }}>موردك الدائم للزاد العلمي والإيماني والدعوي.</p>
        <p>&copy; {new Date().getFullYear()} منصة معين. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}






