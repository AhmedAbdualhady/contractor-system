"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useUser } from "@/components/dashboard/UserContext";
import { money } from "@/components/docs/kinds";
import "@/components/docs/docs.css";

const blank = { name: "", phone: "", trade: "", daily_wage: "", currency: "SDG", is_active: true };

export default function WorkersPage() {
  const user = useUser();
  const isAdmin = user.role === "admin";
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState(null); // { id?, ...fields }
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(() => api("/workers").then((d) => setRows(d.workers)).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true); setErr("");
    const body = { name: form.name, phone: form.phone || "", trade: form.trade || "", daily_wage: Number(form.daily_wage) || 0, currency: form.currency, is_active: !!form.is_active };
    try {
      await api(form.id ? `/workers/${form.id}` : "/workers", { method: form.id ? "PUT" : "POST", body });
      setForm(null); await load();
    } catch (e2) { setErr(e2.message); } finally { setSaving(false); }
  }
  async function pay(w) {
    if (!confirm(`دفع أجور ${w.name} (${w.unpaid_days} يوم = ${money(w.unpaid_amount, w.currency)})؟ بيتسجل كمصروف أجور على مشاريعو.`)) return;
    setErr("");
    try { await api(`/workers/${w.id}/pay-dues`, { method: "POST", body: { date: new Date().toISOString().slice(0, 10) } }); await load(); } catch (e) { setErr(e.message); }
  }
  async function remove(w) {
    if (!confirm(`حذف العامل "${w.name}"؟`)) return;
    setErr("");
    try { await api(`/workers/${w.id}`, { method: "DELETE" }); await load(); } catch (e) { setErr(e.message); }
  }

  return (
    <>
      <div className="page-head">
        <h1>العمال والأجور</h1>
        {isAdmin && !form && <button className="btn btn-solid btn-sm" onClick={() => setForm({ ...blank })}>عامل جديد</button>}
      </div>
      <p className="muted">الحضور بيتسجل من صفحة "الحضور اليومي". هنا بتشوف المستحق لكل عامل وتدفعو.</p>
      {err && <div className="alert">{err}</div>}

      {form && (
        <form className="panel" onSubmit={save}>
          <div className="form-grid">
            <label className="field"><span>الاسم</span><input required value={form.name} onChange={set("name")} /></label>
            <label className="field"><span>المهنة</span><input value={form.trade} onChange={set("trade")} placeholder="بنّاء، كهربائي، نجار..." /></label>
            <label className="field"><span>الهاتف</span><input dir="ltr" value={form.phone} onChange={set("phone")} /></label>
            <label className="field"><span>الأجر اليومي</span><input type="number" min="0" step="any" dir="ltr" required value={form.daily_wage} onChange={set("daily_wage")} /></label>
            <label className="field"><span>العملة</span>
              <select value={form.currency} onChange={set("currency")}><option value="SDG">جنيه سوداني</option><option value="USD">دولار</option></select>
            </label>
            <label className="field"><span>الحالة</span>
              <select value={form.is_active ? "1" : "0"} onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.value === "1" }))}><option value="1">يعمل معنا</option><option value="0">متوقف</option></select>
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-solid btn-sm" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</button>
            <button type="button" className="btn btn-line btn-sm" onClick={() => setForm(null)}>إلغاء</button>
          </div>
        </form>
      )}

      {rows === null ? <p className="muted">جاري التحميل...</p> : rows.length === 0 ? <p className="muted">لا يوجد عمال بعد.</p> : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>العامل</th><th>الأجر اليومي</th><th>المستحق</th><th /></tr></thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id} style={w.is_active ? undefined : { opacity: 0.55 }}>
                  <td><b>{w.name}</b><div className="muted">{[w.trade, w.is_active ? "" : "متوقف"].filter(Boolean).join(" · ")}</div>{w.phone && <div dir="ltr" className="muted" style={{ textAlign: "start" }}>{w.phone}</div>}</td>
                  <td>{money(w.daily_wage, w.currency)}</td>
                  <td>{w.unpaid_days > 0 ? <>{money(w.unpaid_amount, w.currency)}<div className="muted">{w.unpaid_days} يوم</div></> : <span className="muted">لا يوجد</span>}</td>
                  <td className="acts">
                    {w.unpaid_days > 0 && <button className="textlink" onClick={() => pay(w)}>دفع الأجور</button>}
                    {isAdmin && <button className="textlink" onClick={() => setForm({ ...w, phone: w.phone || "", trade: w.trade || "", is_active: !!w.is_active })}>تعديل</button>}
                    {isAdmin && <button className="textlink danger" onClick={() => remove(w)}>حذف</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
