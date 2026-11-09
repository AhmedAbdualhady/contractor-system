"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useUser } from "@/components/dashboard/UserContext";

const empty = { name: "", phone: "", email: "", address: "", notes: "" };

export default function ClientsPage() {
  const user = useUser();
  const canEdit = user.role === "admin";
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  const [form, setForm] = useState(null); // null = النموذج مغلق
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [portal, setPortal] = useState(null); // { client, email, password }

  const load = useCallback(() => api("/clients").then((d) => setRows(d.clients)).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const openNew = () => { setEditId(null); setForm(empty); setErr(""); };
  const openEdit = (c) => {
    setEditId(c.id); setErr("");
    setForm({ name: c.name, phone: c.phone || "", email: c.email || "", address: c.address || "", notes: c.notes || "" });
  };

  async function save(e) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      await api(editId ? `/clients/${editId}` : "/clients", { method: editId ? "PATCH" : "POST", body: form });
      setForm(null);
      await load();
    } catch (e2) { setErr(e2.message); } finally { setSaving(false); }
  }

  async function remove(c) {
    if (!confirm(`حذف العميل "${c.name}"؟`)) return;
    setErr("");
    try { await api(`/clients/${c.id}`, { method: "DELETE" }); await load(); } catch (e2) { setErr(e2.message); }
  }

  const openPortal = (c) => { setForm(null); setErr(""); setPortal({ client: c, email: c.email || "", password: "" }); };
  async function savePortal(e) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      const { client, email, password } = portal;
      if (client.user_id) await api(`/portal/accounts/${client.id}/password`, { method: "PATCH", body: { password } });
      else await api("/portal/accounts", { method: "POST", body: { client_id: client.id, email, password } });
      setPortal(null);
      await load();
    } catch (e2) { setErr(e2.message); } finally { setSaving(false); }
  }

  return (
    <>
      <div className="page-head">
        <h1>العملاء</h1>
        {canEdit && !form && <button className="btn btn-solid btn-sm" onClick={openNew}>عميل جديد</button>}
      </div>

      {err && <div className="alert">{err}</div>}

      {portal && (
        <form className="panel" onSubmit={savePortal}>
          <p className="muted" style={{ marginTop: 0 }}>
            {portal.client.user_id ? `تغيير كلمة مرور بوابة "${portal.client.name}"` : `إنشاء حساب بوابة للعميل "${portal.client.name}"`}
          </p>
          <div className="form-grid">
            {!portal.client.user_id && (
              <label className="field"><span>البريد الإلكتروني للدخول</span>
                <input type="email" dir="ltr" required value={portal.email} onChange={(e) => setPortal({ ...portal, email: e.target.value })} />
              </label>
            )}
            <label className="field"><span>كلمة المرور (8 أحرف على الأقل)</span>
              <input dir="ltr" required minLength={8} value={portal.password} onChange={(e) => setPortal({ ...portal, password: e.target.value })} />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-solid btn-sm" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</button>
            <button type="button" className="btn btn-line btn-sm" onClick={() => setPortal(null)}>إلغاء</button>
          </div>
        </form>
      )}

      {form && (
        <form className="panel" onSubmit={save}>
          <div className="form-grid">
            <label className="field"><span>الاسم</span><input value={form.name} onChange={set("name")} required /></label>
            <label className="field"><span>الهاتف</span><input dir="ltr" value={form.phone} onChange={set("phone")} /></label>
            <label className="field"><span>البريد الإلكتروني</span><input type="email" dir="ltr" value={form.email} onChange={set("email")} /></label>
            <label className="field"><span>العنوان</span><input value={form.address} onChange={set("address")} /></label>
            <label className="field full"><span>ملاحظات</span><textarea rows="3" value={form.notes} onChange={set("notes")} /></label>
          </div>
          <div className="actions">
            <button className="btn btn-solid btn-sm" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</button>
            <button type="button" className="btn btn-line btn-sm" onClick={() => setForm(null)}>إلغاء</button>
          </div>
        </form>
      )}

      {rows === null ? <p className="muted">جاري التحميل...</p> : rows.length === 0 ? (
        <p className="muted">لا يوجد عملاء بعد.</p>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>الاسم</th><th>الهاتف</th><th>البريد</th><th>المشاريع</th>{canEdit && <th />}</tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td dir="ltr" className="al-s">{c.phone || "-"}</td>
                  <td dir="ltr" className="al-s">{c.email || "-"}</td>
                  <td>{c.projects_count}</td>
                  {canEdit && (
                    <td className="acts">
                      <button className="textlink" onClick={() => openPortal(c)}>{c.user_id ? "كلمة مرور البوابة" : "حساب بوابة"}</button>
                      <button className="textlink" onClick={() => openEdit(c)}>تعديل</button>
                      <button className="textlink danger" onClick={() => remove(c)}>حذف</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
