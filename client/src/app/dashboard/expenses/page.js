"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useUser } from "@/components/dashboard/UserContext";
import { money, day } from "@/components/docs/kinds";
import "@/components/docs/docs.css";

const cats = { materials: "مواد", labor: "أجور", equipment: "معدات", transport: "نقل", other: "أخرى" };
const init = () => ({ project_id: "", category: "materials", description: "", amount: "", currency: "SDG", spent_at: new Date().toISOString().slice(0, 10) });

export default function ExpensesPage() {
  const user = useUser();
  const canDelete = ["admin", "accountant"].includes(user.role);
  const [rows, setRows] = useState(null);
  const [totals, setTotals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [fp, setFp] = useState("");
  const [fc, setFc] = useState("");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(init());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { api("/projects").then((d) => setProjects(d.projects)).catch((e) => setErr(e.message)); }, []);

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (fp) q.set("project_id", fp);
    if (fc) q.set("category", fc);
    try {
      const d = await api(`/expenses?${q}`);
      setRows(d.expenses); setTotals(d.totals);
    } catch (e) { setErr(e.message); }
  }, [fp, fc]);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const pickProject = (e) => {
    const p = projects.find((x) => String(x.id) === e.target.value);
    setF((s) => ({ ...s, project_id: e.target.value, currency: p?.currency || s.currency }));
  };

  async function save(e) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      await api("/expenses", { method: "POST", body: { ...f, project_id: f.project_id ? Number(f.project_id) : null, amount: Number(f.amount) } });
      setF(init()); setOpen(false); await load();
    } catch (e2) { setErr(e2.message); } finally { setSaving(false); }
  }
  async function remove(r) {
    if (!confirm(`حذف مصروف "${r.description}"؟`)) return;
    setErr("");
    try { await api(`/expenses/${r.id}`, { method: "DELETE" }); await load(); } catch (e) { setErr(e.message); }
  }

  return (
    <>
      <div className="page-head">
        <h1>المصروفات</h1>
        {!open && <button className="btn btn-solid btn-sm" onClick={() => setOpen(true)}>تسجيل مصروف</button>}
      </div>
      {err && <div className="alert">{err}</div>}

      {open && (
        <form className="panel" onSubmit={save}>
          <div className="form-grid">
            <label className="field"><span>المشروع</span>
              <select value={f.project_id} onChange={pickProject}>
                <option value="">مصروف عام (بدون مشروع)</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </label>
            <label className="field"><span>التصنيف</span>
              <select value={f.category} onChange={set("category")}>{Object.entries(cats).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </label>
            <label className="field"><span>الوصف</span><input required value={f.description} onChange={set("description")} placeholder="مثال: أسمنت 50 كيس" /></label>
            <label className="field"><span>المبلغ</span><input type="number" min="0" step="any" dir="ltr" required value={f.amount} onChange={set("amount")} /></label>
            <label className="field"><span>العملة</span>
              <select value={f.currency} onChange={set("currency")}><option value="SDG">جنيه سوداني</option><option value="USD">دولار</option></select>
            </label>
            <label className="field"><span>التاريخ</span><input type="date" dir="ltr" required value={f.spent_at} onChange={set("spent_at")} /></label>
          </div>
          <div className="actions">
            <button className="btn btn-solid btn-sm" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ المصروف"}</button>
            <button type="button" className="btn btn-line btn-sm" onClick={() => setOpen(false)}>إلغاء</button>
          </div>
        </form>
      )}

      <div className="dc-bar">
        <select className="sel-sm" value={fp} onChange={(e) => setFp(e.target.value)}>
          <option value="">كل المشاريع</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <select className="sel-sm" value={fc} onChange={(e) => setFc(e.target.value)}>
          <option value="">كل التصنيفات</option>
          {Object.entries(cats).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {totals.length > 0 && <span className="muted">الإجمالي: {totals.map((t) => money(t.total, t.currency)).join("  ·  ")}</span>}
      </div>

      {rows === null ? <p className="muted">جاري التحميل...</p> : rows.length === 0 ? <p className="muted">لا توجد مصروفات.</p> : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>التاريخ</th><th>الوصف</th><th>المشروع</th><th>التصنيف</th><th>المبلغ</th>{canDelete && <th />}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{day(r.spent_at)}</td><td>{r.description}</td><td className="muted">{r.project_title || "عام"}</td>
                  <td>{cats[r.category]}</td><td>{money(r.amount, r.currency)}</td>
                  {canDelete && <td className="acts"><button className="textlink danger" onClick={() => remove(r)}>حذف</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
