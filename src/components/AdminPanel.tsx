"use client";
import { useEffect, useState } from "react";
import ReportExport from "./ReportExport";
export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]),
    [items, setItems] = useState<any[]>([]),
    [cats, setCats] = useState<any[]>([]),
    [requests, setRequests] = useState<any[]>([]),
    [name, setName] = useState(""),
    [role, setRole] = useState("USER"),
    [groupName, setGroupName] = useState(""),
    [supervisorId, setSupervisorId] = useState(""),
    [catName, setCatName] = useState(""),
    [form, setForm] = useState<any>({
      title: "",
      description: "",
      type: "BOOK",
      mediaUrl: "",
      categoryId: "",
      coverImageUrl: "",
      author: "",
      pageCount: "",
      duration: "",
    }),
    [manualUserId, setManualUserId] = useState(""),
    [manualContentId, setManualContentId] = useState(""),
    [isUploading, setIsUploading] = useState(false),
    [viewingUser, setViewingUser] = useState<any>(null);
  async function load() {
    let r = await fetch("/api/users");
    setUsers(await r.json());
    r = await fetch("/api/content?admin=true");
    const d = await r.json();
    setItems(d.items || []);
    setCats(d.categories || []);
    r = await fetch("/api/progress");
    const p = await r.json();
    setRequests(p.filter((x: any) => x.status === "PENDING"));
  }
  useEffect(() => {
    load();
  }, []);
  async function userCreate() {
    await fetch("/api/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, role, groupName, supervisorId }),
    });
    setName("");
    setGroupName("");
    load();
  }
  async function act(id: string, action: string) {
    const response = await fetch("/api/progress", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    if (!response.ok) {
      const data = await response.json();
      alert(data.error || "تعذر تحديث الطلب");
    }
    load();
  }
  async function manualAct(action: string) {
    if (!manualUserId || !manualContentId) return;
    const response = await fetch("/api/progress", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action,
        userId: manualUserId,
        contentId: manualContentId,
      }),
    });
    if (!response.ok) {
      const data = await response.json();
      alert(data.error || "تعذر تسجيل الإنجاز");
      return;
    }
    setManualUserId("");
    setManualContentId("");
    load();
  }
  async function saveContent() {
    const response = await fetch("/api/content", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    if (!response.ok) {
      alert(result.error || "تعذر حفظ المادة");
      return;
    }
    if (
      (result.type === "BOOK" && !result.pageCount) ||
      (result.type === "AUDIO" && !result.duration)
    )
      alert(
        "حُفظت المادة وتحتاج بيانات المصدر. افتح لوحة الإنجاز لاستكمال عدد الصفحات أو المدة.",
      );
    setForm({
      ...form,
      title: "",
      description: "",
      mediaUrl: "",
      author: "",
      pageCount: "",
      duration: "",
    });
    load();
  }
  async function removeItem(id: string) {
    await fetch("/api/content?id=" + id, { method: "DELETE" });
    load();
  }
  return (
    <div className="shell">
      <header>
        <a href="/" className="brand">
          منصة معين · الإدارة
        </a>
        <nav>
          <a href="/achievements">لوحة الإنجاز</a>
          <a href="/books">العودة للمكتبة</a>
        </nav>
      </header>
      <section className="hero compact">
        <p className="eyebrow">لوحة الإدارة</p>
        <h1>إدارة المكتبة</h1>
        <p>تذكير: اجعل ملفات Drive متاحة لأي شخص يملك الرابط.</p>
      </section>
      <ReportExport role="ADMIN" users={users} />
      <div className="admin-grid">
        <section className="panel">
          <h2>إدارة الأعضاء</h2>
          <div className="inline" style={{ flexWrap: "wrap" }}>
            <input
              placeholder="اسم العضو"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="USER">طالب</option>
              <option value="SUPERVISOR">مشرف</option>
              <option value="ADMIN">مدير</option>
            </select>
            <input
              placeholder="المجموعة (اختياري)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <select
              value={supervisorId}
              onChange={(e) => setSupervisorId(e.target.value)}
            >
              <option value="">بدون مشرف</option>
              {users
                .filter((u) => u.role === "SUPERVISOR")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
            <button onClick={userCreate}>إضافة عضو</button>
          </div>
          {users.map((u) => (
            <div className="admin-row" key={u.id}>
              <div>
                <b>
                  {u.name} {!u.isActive && "(معطل)"}
                </b>
                <small>
                  الدور:{" "}
                  {u.role === "ADMIN"
                    ? "مدير"
                    : u.role === "SUPERVISOR"
                      ? "مشرف"
                      : "طالب"}{" "}
                  · {u.groupName ? `المجموعة: ${u.groupName} · ` : ""}
                  الرمز: {u.accessCode} ·{" "}
                  {u.progress?.filter((p: any) => p.content.type === "BOOK")
                    .length || 0}{" "}
                  كتب /{" "}
                  {u.progress?.filter((p: any) => p.content.type === "AUDIO")
                    .length || 0}{" "}
                  صوتيات
                </small>
              </div>
              <select
      value={u.maxAllowedLevel || 1}
      onChange={async (e) => {
        await fetch("/api/users", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: u.id, action: "setLevel", level: parseInt(e.target.value) })
        });
        load();
      }}
      style={{ padding: "8px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: "0.9rem" }}
    >
      <option value="1">المستوى الأول</option>
      <option value="2">المستوى الثاني</option>
      <option value="3">المستوى الثالث</option>
    </select>
    <button onClick={() => setViewingUser(u)}>عرض الإنجازات</button>
              <button
                onClick={async () => {
                  await fetch("/api/users", {
                    method: "PATCH",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ id: u.id, action: "regenerate" }),
                  });
                  load();
                }}
              >
                تجديد الرمز
              </button>
              <button
                onClick={async () => {
                  await fetch("/api/users", {
                    method: "PATCH",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      id: u.id,
                      action: u.isActive ? "deactivate" : "activate",
                    }),
                  });
                  load();
                }}
              >
                {u.isActive ? "تعطيل" : "تفعيل"}
              </button>
              <button
                onClick={async () => {
                  const newGroup = prompt(
                    "اكتب اسم المجموعة الجديد (أو اتركه فارغاً للإلغاء):",
                    u.groupName || "",
                  );
                  if (newGroup === null) return;
                  await fetch("/api/users", {
                    method: "PATCH",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      id: u.id,
                      action: "update_profile",
                      groupName: newGroup,
                      role: u.role,
                      supervisorId: u.supervisorId,
                    }),
                  });
                  load();
                }}
              >
                تعديل المجموعة
              </button>
              <button
                className="danger"
                onClick={async () => {
                  if (!confirm("هل أنت متأكد من الحذف؟")) return;
                  const res = await fetch("/api/users?id=" + u.id, {
                    method: "DELETE",
                  });
                  if (!res.ok) {
                    const err = await res.json();
                    alert(
                      err.error ||
                        "لا يمكن حذف هذا العضو لوجود إنجازات مرتبطة به. قم بتعطيله بدلاً من ذلك.",
                    );
                  }
                  load();
                }}
              >
                حذف
              </button>
            </div>
          ))}
        </section>
        <section className="panel" style={{ gridColumn: "1 / -1" }}>
          <h2>قائمة الإنجازات (الترتيب)</h2>
          <div style={{ display: "grid", gap: "10px" }}>
            {[...users]
              .sort(
                (a, b) =>
                  (b.progress?.filter((p: any) => p.status === "APPROVED")
                    .length || 0) -
                  (a.progress?.filter((p: any) => p.status === "APPROVED")
                    .length || 0),
              )
              .map((u, i) => {
                const approved =
                  u.progress?.filter((p: any) => p.status === "APPROVED") || [];
                const books = approved.filter(
                  (p: any) => p.content.type === "BOOK",
                ).length;
                const audio = approved.filter(
                  (p: any) => p.content.type === "AUDIO",
                ).length;
                if (approved.length === 0) return null;
                return (
                  <div className="admin-row" key={u.id}>
                    <div>
                      <b style={{ fontSize: "1.1rem" }}>
                        {i + 1}. {u.name}
                      </b>
                      <small style={{ marginTop: "4px" }}>
                        إجمالي الإنجازات: {approved.length} ( {books} كتب،{" "}
                        {audio} صوتيات )
                      </small>
                    </div>
                    <button onClick={() => setViewingUser(u)}>
                      عرض التفاصيل
                    </button>
                  </div>
                );
              })}
            {users.every(
              (u) =>
                (u.progress?.filter((p: any) => p.status === "APPROVED")
                  .length || 0) === 0,
            ) && (
              <p style={{ color: "#7b837c" }}>
                لا يوجد إنجازات معتمدة حتى الآن.
              </p>
            )}
          </div>
        </section>
        <section className="panel">
          <h2>طلبات الإنجاز ({requests.length})</h2>
          {requests.map((r) => (
            <div className="admin-row" key={r.id}>
              <div>
                <b>{r.user.name}</b>
                <small>{r.content.title}</small>
              </div>
              <button onClick={() => act(r.id, "approve")}>قبول</button>
              <button className="danger" onClick={() => act(r.id, "reject")}>
                رفض
              </button>
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>التسجيل اليدوي للإنجاز</h2>
          <select
            value={manualUserId}
            onChange={(e) => setManualUserId(e.target.value)}
          >
            <option value="">اختر العضو</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <select
            value={manualContentId}
            onChange={(e) => setManualContentId(e.target.value)}
          >
            <option value="">اختر المادة</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title}
              </option>
            ))}
          </select>
          <div className="inline">
            <button onClick={() => manualAct("add")}>إضافة كـ مكتمل</button>
            <button className="danger" onClick={() => manualAct("remove")}>
              إزالة الإنجاز
            </button>
          </div>
        </section>
        <section className="panel">
          <h2>إضافة مادة</h2>
          <input
            placeholder="العنوان"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            placeholder="المؤلف / المتحدث"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
          />
          <textarea
            placeholder="الوصف"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="BOOK">كتاب</option>
            <option value="AUDIO">صوتيات</option>
          </select>
          {form.type === "BOOK" ? (
            <p>
              يُستخرج عدد الصفحات تلقائيًا من PDF. للملفات الخاصة، ارفع نسخة
              مطابقة من لوحة الإنجاز بعد حفظ الكتاب.
            </p>
          ) : (
            <input
              placeholder="المدة: 1:30:00 أو دقائق (تُستخرج تلقائيًا إن تركتها فارغة)"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          )}
          <input
            placeholder="رابط Drive أو YouTube"
            value={form.mediaUrl}
            onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
          />
          <div
            className="upload-group"
            style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
          >
            <input
              placeholder="رابط صورة الغلاف (اختياري)"
              value={form.coverImageUrl}
              onChange={(e) =>
                setForm({ ...form, coverImageUrl: e.target.value })
              }
              style={{ flex: 1, margin: 0 }}
            />
            <span style={{ fontSize: "0.9rem", color: "#666" }}>أو</span>
            <label
              style={{
                cursor: "pointer",
                padding: "0.6rem 1rem",
                background: "#f1f5f9",
                borderRadius: "8px",
                fontSize: "0.9rem",
                border: "1px solid #e2e8f0",
                whiteSpace: "nowrap",
              }}
            >
              {isUploading ? "جاري الرفع..." : "رفع صورة"}
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                disabled={isUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsUploading(true);
                  try {
                    const fd = new FormData();
                    fd.append("file", file);
                    const res = await fetch("/api/upload", {
                      method: "POST",
                      body: fd,
                    });
                    const data = await res.json();
                    if (data.url) {
                      setForm({ ...form, coverImageUrl: data.url });
                    } else {
                      alert(
                        "فشل رفع الصورة: " + (data.error || "خطأ غير معروف"),
                      );
                    }
                  } catch (err) {
                    alert("حدث خطأ أثناء الاتصال بالخادم لرفع الصورة.");
                  } finally {
                    setIsUploading(false);
                  }
                }}
              />
            </label>
          </div>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">التصنيف</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button onClick={saveContent}>حفظ المادة</button>
          {items.map((i) => (
            <div className="admin-row" key={i.id}>
              <span>{i.title}</span>
              <button className="danger" onClick={() => removeItem(i.id)}>
                حذف
              </button>
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>التصنيفات</h2>
          <div className="inline">
            <input
              placeholder="تصنيف جديد"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
            <button
              onClick={async () => {
                await fetch("/api/categories", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ name: catName }),
                });
                setCatName("");
                load();
              }}
            >
              إضافة
            </button>
          </div>
          {cats.map((c) => (
            <div className="admin-row" key={c.id}>
              {c.name}
              <button
                className="danger"
                onClick={async () => {
                  await fetch("/api/categories?id=" + c.id, {
                    method: "DELETE",
                  });
                  load();
                }}
              >
                حذف
              </button>
            </div>
          ))}
        </section>
      </div>

      {viewingUser && (
        <div className="modal-backdrop" onClick={() => setViewingUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setViewingUser(null)}>
              &times;
            </button>
            <h2>إنجازات {viewingUser.name}</h2>
            {viewingUser.progress?.length === 0 ? (
              <p>لا يوجد إنجازات معتمدة بعد.</p>
            ) : (
              <div style={{ marginTop: "1rem" }}>
                {viewingUser.progress?.map((p: any) => (
                  <div
                    key={p.id}
                    className="admin-row"
                    style={{ marginBottom: "0.5rem" }}
                  >
                    <div>
                      <b>{p.content.title}</b>
                      <small>
                        {p.content.type === "BOOK" ? "كتاب" : "مادة صوتية"} ·{" "}
                        {new Date(
                          p.completedAt || p.requestedAt,
                        ).toLocaleDateString("ar-SA")}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
