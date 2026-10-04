"use client";
import { useCallback, useEffect, useRef, useState } from "react";
type Props = {
  user: { id: string; name: string; role: string; groupName?: string | null };
  fixedType?: "BOOK" | "AUDIO";
};
type Item = {
  id: string;
  title: string;
  description: string;
  type: "BOOK" | "AUDIO";
  mediaUrl: string;
  coverImageUrl?: string | null;
  author?: string | null;
  pageCount?: number | null;
  duration?: string | null;
  category: { name: string };
  progress: { status: string }[];
};
function CustomSelect({ value, onChange, options, placeholder }: any) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o: any) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target as Element).closest(".custom-select-container")) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div
      className="relative min-w-[200px] custom-select-container"
      style={{ zIndex: 10 }}
    >
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between cursor-pointer"
        style={{
          border: open ? "1px solid #ab8050" : "1px solid var(--line)",
          boxShadow: open ? "0 0 0 3px #d9bb9233" : "none",
          background: "#fffdfa",
          borderRadius: "10px",
          padding: "12px 14px",
          color: "var(--ink)",
          transition: "all 0.2s",
          height: "100%",
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {open && (
        <div
          className="absolute w-full mt-2"
          style={{
            background: "#fffdfa",
            border: "1px solid var(--line)",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(36, 51, 47, 0.08)",
            overflow: "hidden",
            maxHeight: "260px",
            overflowY: "auto",
          }}
        >
          <div
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="cursor-pointer transition-colors"
            style={{
              padding: "12px 16px",
              backgroundColor: value === "" ? "#f3ebdc" : "transparent",
              fontSize: "14px",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor =
                value === "" ? "#f3ebdc" : "#faf7f2")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor =
                value === "" ? "#f3ebdc" : "transparent")
            }
          >
            {placeholder}
          </div>
          {options.map((o: any) => (
            <div
              key={o.value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className="cursor-pointer transition-colors"
              style={{
                padding: "12px 16px",
                backgroundColor: value === o.value ? "#f3ebdc" : "transparent",
                borderTop: "1px solid var(--line)",
                fontSize: "14px",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor =
                  value === o.value ? "#f3ebdc" : "#faf7f2")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor =
                  value === o.value ? "#f3ebdc" : "transparent")
              }
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Library({ user, fixedType }: Props) {
  const [items, setItems] = useState<Item[]>([]),
    [cats, setCats] = useState<any[]>([]),
    [q, setQ] = useState(""),
    [cat, setCat] = useState(""),
    [selected, setSelected] = useState<Item | null>(null),
    [progress, setProgress] = useState<any[]>([]),
    [comments, setComments] = useState<any[]>([]),
    [text, setText] = useState(""),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(false);
  const loadId = useRef(0);
  const load = useCallback(async () => {
    const id = ++loadId.current;
    setLoading(true);
    setLoadError(false);
    try {
      const r = await fetch(
        `/api/content?q=${encodeURIComponent(q)}&type=${fixedType || ""}&category=${cat}`,
      );
      if (!r.ok) throw new Error("Content request failed");
      const d = await r.json();
      if (!Array.isArray(d.items) || !Array.isArray(d.categories)) {
        throw new Error("Invalid content response");
      }
      if (id !== loadId.current) return;
      setItems(d.items);
      setCats(d.categories);
    } catch {
      if (id === loadId.current) setLoadError(true);
      return;
    } finally {
      if (id === loadId.current) setLoading(false);
    }
    try {
      const p = await fetch("/api/progress");
      if (!p.ok) return;
      const data = await p.json();
      if (id === loadId.current && Array.isArray(data)) setProgress(data);
    } catch {
      // Progress availability must not change the content loading state.
    }
  }, [q, cat, fixedType]);
  useEffect(() => {
    load();
    return () => {
      loadId.current++;
    };
  }, [load]);
  async function open(i: Item) {
    setSelected(i);
    const r = await fetch("/api/comments");
    const all = await r.json();
    setComments(all.filter((c: any) => c.contentId === i.id));
  }
  async function request() {
    if (!selected) return;
    const r = await fetch("/api/progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contentId: selected.id }),
    });
    if (!r.ok) {
      const d = await r.json();
      alert(d.error || "تعذر إرسال الطلب");
      return;
    }
    await load();
    setSelected({ ...selected, progress: [{ status: "PENDING" }] });
  }
  async function cancel(id: string) {
    if (!id) return;
    const r = await fetch("/api/progress?id=" + id, { method: "DELETE" });
    if (!r.ok) {
      const d = await r.json();
      alert(d.error || "تعذر إلغاء الطلب");
      return;
    }
    await load();
    setSelected(null);
  }
  async function addComment() {
    if (!selected || !text.trim()) return;
    await fetch("/api/comments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contentId: selected.id, text }),
    });
    setText("");
    open(selected);
  }
  async function deleteComment(id: string) {
    await fetch("/api/comments?id=" + id, { method: "DELETE" });
    if (selected) open(selected);
  }
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    location.href = "/login";
  }
  return (
    <div className="shell">
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-mark">م</span>
            <span className="brand">مَعين</span>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--line)' }}></div>
          <img src="/bader-logo.svg" alt="فريق بادر" style={{ height: '28px', objectFit: 'contain' }} title="مبادرة من فريق بادر" />
        </div>
        <nav>
          <a href="/books">المقروءات</a>
          <a href="/audio">المسموعات</a>
          <span>|</span>
          <span>مرحباً، {user.name}</span>
          {user.role === "ADMIN" && <a href="/admin">الإدارة</a>}
          {(user.role === "SUPERVISOR" ||
            (user.role === "ADMIN" && user.groupName)) && (
            <a href="/supervisor">مجموعتي</a>
          )}
          <a href="/progress">إنجازي</a>
          <button onClick={logout}>خروج</button>
        </nav>
      </header>
      <section className="hero">
        <p className="eyebrow">
          {fixedType === "BOOK"
            ? "المكتبة"
            : fixedType === "AUDIO"
              ? "الصوتيات"
              : "مجموعتك الخاصة"}
        </p>
        <h1>
          {fixedType === "BOOK"
            ? "اقرأ ما يترك أثراً"
            : fixedType === "AUDIO"
              ? "استمع لما يترك أثراً"
              : "اقرأ واستمع"}
        </h1>
        <p>مختارات هادئة في مكان واحد.</p>
      </section>
      <div className="toolbar">
        <input
          placeholder="ابحث عن عنوان..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <CustomSelect
          value={cat}
          onChange={(val: string) => setCat(val)}
          options={cats.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="كل التصنيفات"
        />
      </div>
      <main className="grid" aria-busy={loading}>
        {loading ? (
          <div className="empty" role="status">جاري تحميل المواد…</div>
        ) : loadError ? (
          <div className="empty" role="alert">
            <p>تعذر تحميل المواد. حاول مرة أخرى.</p>
            <button onClick={() => load()}>إعادة المحاولة</button>
          </div>
        ) : items.map((i) => (
          <article className="card" key={i.id} onClick={() => open(i)}>
            <div
              className={"cover " + i.type.toLowerCase()}
              style={{
                backgroundImage: `url(${i.coverImageUrl || "/assets/placeholder.svg"})`,
              }}
            >
              {i.type === "AUDIO" && <span className="play">▶</span>}
            </div>
            <div className="card-body">
              <span className="tag">{i.category.name}</span>
              <h2>{i.title}</h2>
              <p>{i.author}</p>
            </div>
          </article>
        ))}
        {!loading && !loadError && !items.length && (
          <div className="empty">لا توجد مواد مطابقة حالياً.</div>
        )}
      </main>
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)}>
              ×
            </button>
            <div
              className={
                "detail-cover cover " +
                (selected.type === "AUDIO" ? "audio" : "")
              }
              style={{
                backgroundImage: `url(${selected.coverImageUrl || "/assets/placeholder.svg"})`,
              }}
            />
            <span className="tag">{selected.category.name}</span>
            <h2>{selected.title}</h2>
            <div
              style={{ margin: "10px 0", color: "#637068", fontSize: "14px" }}
            >
              {selected.author && (
                <div>
                  <b>{selected.type === "BOOK" ? "المؤلف: " : "المتحدث: "}</b>
                  {selected.author}
                </div>
              )}
              {selected.type === "BOOK" && selected.pageCount && (
                <div>
                  <b>الصفحات: </b>
                  {selected.pageCount}
                </div>
              )}
              {selected.type === "AUDIO" && selected.duration && (
                <div>
                  <b>المدة: </b>
                  {selected.duration}
                </div>
              )}
            </div>
            <p>{selected.description}</p>
            <div className="actions">
              <a
                target="_blank"
                rel="noreferrer"
                href={selected.mediaUrl}
                className="primary"
              >
                {selected.type === "BOOK" ? "فتح الكتاب ↗" : "فتح المقطع ↗"}
              </a>
              {selected.progress?.[0]?.status === "PENDING" ? (
                <button
                  onClick={() =>
                    cancel(
                      progress.find(
                        (p) =>
                          p.contentId === selected.id && p.userId === user.id,
                      )?.id,
                    )
                  }
                  className="secondary"
                >
                  إلغاء الطلب
                </button>
              ) : selected.progress?.[0]?.status === "APPROVED" ? (
                <span className="success">مكتملة ✓</span>
              ) : (
                <button onClick={request} className="secondary">
                  طلب تسجيل الإنجاز
                </button>
              )}
            </div>
            <h3>التعليقات</h3>
            <div className="comments">
              {comments.map((c) => (
                <div
                  className="comment"
                  key={c.id}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <b>{c.user.name}</b>
                    <span>{c.text}</span>
                  </div>
                  {(user.role === "ADMIN" || c.userId === user.id) && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      style={{
                        color: "#a44437",
                        background: "transparent",
                        fontSize: "12px",
                      }}
                    >
                      حذف
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="comment-box">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="أضف تعليقاً..."
                maxLength={1000}
              />
              <button onClick={addComment}>إرسال</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




