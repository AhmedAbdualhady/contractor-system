"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useUser } from "@/components/dashboard/UserContext";
import { money, day } from "@/components/docs/kinds";
import "@/components/docs/docs.css";

const methods = { cash: "نقداً", bank: "إيداع بنكي", transfer: "تحويل", mobile_money: "دفع إلكتروني" };
const init = () => ({ project_id: "", invoice_id: "", amount: "", currency: "SDG", method: "cash", paid_at: new Date().toISOString().slice(0, 10), reference: "", notes: "" });

export default function PaymentsPage() {
  const user = useUser();
  const [rows, setRows] = useState(null);
  const [totals, setTotals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(init());
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, pr, inv] = await Promise.all([api("/payments"), api("/projects"), api("/invoices")]);
      setRows(p.payments); setTotals(p.totals); setProjects(pr.projects); setInvoices(inv.rows);
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const openInvoices = invoices.filter((i) => String(i.project_id) === f.project_id && i.status !== "paid");

  const pickProject = (e) => {
    const p = projects.find((x) => String(x.id) === e.target.value);
    setF((s) => ({ ...s, project_id: e.target.value, invoice_id: "", currency: p?.currency || s.currency }));
  };
  const pickInvoice = (e) => {
    const inv = invoices.find((x) => String(x.id) === e.target.value);
    setF((s) => ({ ...s, invoice_id: e.target.value, ...(inv ? { currency: inv.currency, amount: s.amount || String(Math.max(inv.total - inv.paid, 0)) } : {}) }));
  };

  async function save(e) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      await api("/payments", { method: "POST", body: { ...f, project_id: Number(f.project_id) || 0, invoice_id: f.invoice_id ? Number(f.invoice_id) : null, amount: Number(f.amount) } });
      setF(init()); setOpen(false); await load();
    } catch (e2) { setErr(e2.message); } finally { setSaving(false); }
  }

  async function remove(r) {
    if (!confirm(`حذف دفعة ${money(r.amount, r.currency)}؟`)) return;
    setErr("");
    try { await api(`/payments/${r.id}`, { method: "DELETE" }); await load(); } catch (e) { setErr(e.message); }
  }

  return (
    <>
      <div className="page-head">
        <h1>المدفوعات</h1>
        {!open && <button className="btn btn-solid btn-sm" onClick={() => setOpen(true)}>تسجيل دفعة</button>}
      </div>
      {totals.length > 0 && <p className="muted">إجمالي المقبوض: {totals.map((t) => money(t.total, t.currency)).join("  ·  ")}</p>}
      {err && <div className="alert">{err}</div>}

      {open && (
        <form className="panel" onSubmit={save}>
          <div className="form-grid">
            <label className="field"><span>المشروع</span>
              <select value={f.project_id} onChange={pickProject} required>
                <option value="">اختر المشروع</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title}{p.client_name ? ` (${p.client_name})` : ""}</option>)}
              </select>
            </label>
            <label className="field"><span>الفاتورة (اختياري)</span>
              <select value={f.invoice_id} onChange={pickInvoice} disabled={!f.project_id}>
                <option value="">دفعة بدون فاتورة</option>
                {openInvoices.map((i) => <option key={i.id} value={i.id}>{i.number} · {money(i.total, i.currency)}</option>)}
              </select>
            </label>
            <label className="field"><span>المبلغ</span><input type="number" min="0" step="any" dir="ltr" required value={f.amount} onChange={set("amount")} /></label>
            <label className="field"><span>العملة</span>
              <select value={f.currency} onChange={set("currency")} disabled={!!f.invoice_id}><option value="SDG">جنيه سوداني</option><option value="USD">دولار</option></select>
            </label>
            <label className="field"><span>طريقة الدفع</span>
              <select value={f.method} onChange={set("method")}>{Object.entries(methods).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </label>
            <label className="field"><span>التاريخ</span><input type="date" dir="ltr" required value={f.paid_at} onChange={set("paid_at")} /></label>
            <label className="field"><span>رقم المرجع / الإشعار</span><input dir="ltr" value={f.reference} onChange={set("reference")} /></label>
            <label className="field"><span>ملاحظة</span><input value={f.notes} onChange={set("notes")} /></label>
          </div>
          <div className="actions">
            <button className="btn btn-solid btn-sm" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ الدفعة"}</button>
            <button type="button" className="btn btn-line btn-sm" onClick={() => setOpen(false)}>إلغاء</button>
          </div>
        </form>
      )}

      {rows === null ? <p className="muted">جاري التحميل...</p> : rows.length === 0 ? <p className="muted">لا توجد دفعات مسجلة.</p> : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>التاريخ</th><th>المشروع</th><th>المبلغ</th><th>الطريقة</th><th>الفاتورة</th>{user.role === "admin" && <th />}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{day(r.paid_at)}</td>
                  <td>{r.project_title}<div className="muted">{r.client_name}</div></td>
                  <td>{money(r.amount, r.currency)}</td>
                  <td>{methods[r.method]}{r.reference ? <div className="muted" dir="ltr">{r.reference}</div> : null}</td>
                  <td dir="ltr" className="al-s">{r.invoice_number || "-"}</td>
                  {user.role === "admin" && <td className="acts"><button className="textlink danger" onClick={() => remove(r)}>حذف</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
