"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useUser } from "@/components/dashboard/UserContext";
import { day } from "@/components/docs/kinds";
import "@/components/docs/docs.css";

const roles = { admin: "مدير", accountant: "محاسب", site_engineer: "مهندس موقع" };
const hints = {
  admin: "كل الصلاحيات، بما فيها إدارة المستخدمين والحذف.",
  accountant: "العملاء، عروض الأسعار، الفواتير، المدفوعات، المصروفات، دفع الأجور، والتقارير.",
  site_engineer: "تحديث المشاريع، رفع الصور، الحضور اليومي، وتسجيل المصروفات.",
};
const CHARS = "abcdefghjkmnpqrstuvwxyz23456789"; // من غير حروف متشابهة
const gen = () => Array.from(crypto.getRandomValues(new Uint32Array(10)), (n) => CHARS[n % CHARS.length]).join("");
const blank = () => ({ name: "", email: "", password: gen(), role: "accountant" });

export default function UsersPage() {
  const me = useUser();
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState(null); // { id?, name, email, password, role }
  const [pw, setPw] = useState(null); // { user, password }
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState("");

  const load = useCallback(() => api("/users").then((d) => setRows(d.users)).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true); setErr(""); setDone("");
    try {
      if (form.id) await api(`/users/${form.id}`, { method: "PATCH", body: { name: form.name, role: form.role } });
      else {
        await api("/users", { method: "POST", body: { name: form.name, email: form.email, password: form.password, role: form.role } });
        setDone(`تم إنشاء الحساب. سلّم الموظف: البريد ${form.email} وكلمة المرور ${form.password}`);
      }
      setForm(null); await load();
    } catch (e2) { setErr(e2.message); } finally { setSaving(false); }
  }

  async function toggle(u) {
    setErr(""); setDone("");
    try { await api(`/users/${u.id}`, { method: "PATCH", body: { is_active: !u.is_active } }); await load(); } catch (e) { setErr(e.message); }
  }

  async function resetPw(e) {
    e.preventDefault();
    setSaving(true); setErr(""); setDone("");
    try {
      await api(`/users/${pw.user.id}/password`, { method: "POST", body: { password: pw.password } });
      setDone(`تم تغيير كلمة مرور ${pw.user.name}. الجديدة: ${pw.password}`);
      setPw(null);
    } catch (e2) { setErr(e2.message); } finally { setSaving(false); }
  }

  return (
    <>
      <div className="page-head">
        <h1>المستخدمون</h1>
        {!form && !pw && <button className="btn btn-solid btn-sm" onClick={() => { setDone(""); setForm(blank()); }}>إضافة موظف</button>}
      </div>
      <p className="muted">حسابات فريق العمل. حسابات العملاء بتتفتح من صفحة العملاء. كل موظف بحساب لوحدو عشان الصلاحيات ومعرفة من سجّل شنو.</p>
      {err && <div className="alert">{err}</div>}
      {done && <div className="panel" style={{ borderColor: "rgba(224,165,38,.5)" }}>{done}<div className="muted" style={{ marginTop: "0.4rem" }}>الباسورد بيظهر لك هنا مرة واحدة، فانسخو وسلّمو للموظف.</div></div>}

      {form && (
        <form className="panel" onSubmit={save}>
          <div className="form-grid">
            <label className="field"><span>الاسم</span><input required value={form.name} onChange={set("name")} /></label>
            <label className="field"><span>البريد الإلكتروني (للدخول)</span>
              <input type="email" dir="ltr" required disabled={!!form.id} value={form.email} onChange={set("email")} />
            </label>
            {!form.id && (
              <label className="field"><span>كلمة المرور (8 أحرف على الأقل)</span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input dir="ltr" required minLength={8} value={form.password} onChange={set("password")} />
                  <button type="button" className="btn btn-line btn-sm" onClick={() => setForm((s) => ({ ...s, password: gen() }))}>توليد</button>
                </div>
              </label>
            )}
            <label className="field"><span>الدور</span>
              <select value={form.role} onChange={set("role")} disabled={form.id === me.id}>
                {Object.entries(roles).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
          </div>
          <p className="muted" style={{ margin: "0.8rem 0 0" }}>{hints[form.role]}</p>
          <div className="actions">
            <button className="btn btn-solid btn-sm" disabled={saving}>{saving ? "جاري الحفظ..." : form.id ? "حفظ التعديل" : "إنشاء الحساب"}</button>
            <button type="button" className="btn btn-line btn-sm" onClick={() => setForm(null)}>إلغاء</button>
          </div>
        </form>
      )}

      {pw && (
        <form className="panel" onSubmit={resetPw}>
          <p style={{ marginTop: 0 }}>تغيير كلمة مرور <b>{pw.user.name}</b></p>
          <div style={{ display: "flex", gap: "0.5rem", maxWidth: 420 }}>
            <input dir="ltr" required minLength={8} value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })}
              style={{ flex: 1, background: "rgba(14,34,54,.9)", border: "1px solid var(--line)", color: "var(--paper)", padding: "0.7rem 0.9rem", font: "inherit" }} />
            <button type="button" className="btn btn-line btn-sm" onClick={() => setPw({ ...pw, password: gen() })}>توليد</button>
          </div>
          <div className="actions">
            <button className="btn btn-solid btn-sm" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ كلمة المرور"}</button>
            <button type="button" className="btn btn-line btn-sm" onClick={() => setPw(null)}>إلغاء</button>
          </div>
        </form>
      )}

      {rows === null ? <p className="muted">جاري التحميل...</p> : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>الموظف</th><th>الدور</th><th>الحالة</th><th>أُنشئ في</th><th /></tr></thead>
            <tbody>
              {rows.map((u) => {
                const self = u.id === me.id;
                return (
                  <tr key={u.id} style={u.is_active ? undefined : { opacity: 0.55 }}>
                    <td><b>{u.name}</b>{self && <span className="muted"> (أنت)</span>}<div className="muted" dir="ltr" style={{ textAlign: "start" }}>{u.email}</div></td>
                    <td>{roles[u.role]}</td>
                    <td>{u.is_active ? "نشط" : "معطّل"}</td>
                    <td>{day(u.created_at)}</td>
                    <td className="acts">
                      <button className="textlink" onClick={() => { setDone(""); setPw(null); setForm({ id: u.id, name: u.name, email: u.email, password: "", role: u.role }); }}>تعديل</button>
                      <button className="textlink" onClick={() => { setDone(""); setForm(null); setPw({ user: u, password: gen() }); }}>كلمة المرور</button>
                      {!self && <button className={`textlink ${u.is_active ? "danger" : ""}`} onClick={() => toggle(u)}>{u.is_active ? "تعطيل" : "تفعيل"}</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
