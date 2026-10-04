'use client';

import { useState } from 'react';

export default function LoginForm() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const d = await r.json();

      if (r.ok) {
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get('redirect') || '/books';
        window.location.href = redirectUrl;
      } else {
        setError(d.error || 'تعذر الدخول');
      }
    } catch {
      setError('حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login">
      <div className="login-art">
        <span className="seal">م</span>
        <h1>منصة البرامج الذاتيه</h1>
        <p>مساحة هادئة للقراءة والمعرفة</p>
        <div
          style={{
            marginTop: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            opacity: 0.8,
          }}
        >
          <span style={{ fontSize: '13px', color: '#d2ddd4' }}>إحدى مبادرات</span>
          <img
            src="/bader-logo.svg"
            alt="فريق بادر"
            style={{ height: '35px' }}
          />
        </div>
      </div>
      <form onSubmit={submit} className="login-form">
        <label htmlFor="code">رمز الدخول</label>
        <input
          id="code"
          autoFocus
          autoComplete="one-time-code"
          dir="ltr"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="أدخل رمز الدخول"
          disabled={loading}
          required
        />
        <button disabled={loading}>
          {loading ? 'جاري التحقق...' : 'دخول إلى المكتبة'}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  );
}
