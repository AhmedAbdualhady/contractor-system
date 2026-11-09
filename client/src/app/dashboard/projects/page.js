"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { types } from "@/lib/labels";
import { useUser } from "@/components/dashboard/UserContext";
import StatusChip from "@/components/dashboard/StatusChip";

const empty = { title: "", client_id: "", type: "residential", location: "", budget: "", currency: "SDG", start_date: "", end_date: "" };

export default function ProjectsPage() {
  const router = useRouter();
  const user = useUser();
  const canEdit = user.role === "admin";
  const [rows, setRows] = useState(null);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/projects").then((d) => setRows(d.projects)).catch((e) => setErr(e.message));
    api("/clients").then((d) => setClients(d.clients)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      const body = { ...form, client_id: form.client_id ? Number(form.client_id) : null, budget: form.budget || 0 };
      const r = await api("/projects", { method: "POST", body });
      router.push(`/dashboard/projects/${r.id}`);
    } catch (e2) { setErr(e2.message); setSaving(false); }
  }

  return (
    <>
      <div className="page-head">
        <h1>المشاريع</h1>
        {canEdit && !form && <button className="btn btn-solid btn-sm" onClick={() => { setForm(empty); setErr(""); }}>مشروع جديد</button>}
      </div>

      {err && <div className="alert">{err}</div>}

      {form && (
        <form className="panel" onSubmit={save}>
          <div className="form-grid">
            <label className="field full"><span>اسم المشروع</span><input value={form.title} onChange={set("title")} required /></label>
            <label className="field"><span>العميل</span>
              <select value={form.client_id} onChange={set("client_id")}>
                <option value="">بدون عميل</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="field"><span>النوع</span>
              <select value={form.type} onChange={set("type")}>
                {Object.entries(types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="field"><span>الموقع</span><input value={form.location} onChange={set("location")} /></label>
            <label className="field"><span>الميزانية</span>
              <div className="inline">
                <input type="number" min="0" dir="ltr" value={form.budget} onChange={set("budget")} />
                <select value={form.currency} onChange={set("currency")}><option value="SDG">ج.س</option><option value="USD">$</option></select>
              </div>
            </label>
            <label className="field"><span>تاريخ البدء</span><input type="date" dir="ltr" value={form.start_date} onChange={set("start_date")} /></label>
            <label className="field"><span>تاريخ التسليم المتوقع</span><input type="date" dir="ltr" value={form.end_date} onChange={set("end_date")} /></label>
          </div>
          <p className="muted sm">تُنشأ المراحل الأساسية تلقائياً (الأساسات، الهيكل، التشطيبات، التسليم) وتقدر تعدّلها بعد الحفظ.</p>
          <div className="actions">
            <button className="btn btn-solid btn-sm" disabled={saving}>{saving ? "جاري الحفظ..." : "إنشاء المشروع"}</button>
            <button type="button" className="btn btn-line btn-sm" onClick={() => setForm(null)}>إلغاء</button>
          </div>
        </form>
      )}

      {rows === null ? <p className="muted">جاري التحميل...</p> : rows.length === 0 ? (
        <p className="muted">لا توجد مشاريع بعد.</p>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>المشروع</th><th>النوع</th><th>الحالة</th><th>الميزانية</th><th>الإنجاز</th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td><Link href={`/dashboard/projects/${p.id}`} className="textlink">{p.title}</Link><div className="muted sm">{p.client_name || "بدون عميل"}</div></td>
                  <td>{types[p.type]}</td>
                  <td><StatusChip status={p.status} /></td>
                  <td>{money(p.budget, p.currency)}</td>
                  <td className="w-prog"><div className="bar"><span style={{ width: `${p.progress}%` }} /></div><div className="muted sm" dir="ltr">{p.progress}%</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
