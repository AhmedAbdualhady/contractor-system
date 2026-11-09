"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { money } from "@/components/docs/kinds";
import "@/components/docs/docs.css";
import "../work.css";

const today = () => new Date().toISOString().slice(0, 10);
const dayOpts = [["0.5", "نصف يوم"], ["1", "يوم"], ["1.5", "يوم ونصف"], ["2", "يومين"]];

export default function AttendancePage() {
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [date, setDate] = useState(today());
  const [pid, setPid] = useState("");
  const [sel, setSel] = useState({}); // worker_id -> { on, days, paid }
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([api("/workers"), api("/projects")])
      .then(([w, p]) => { setWorkers(w.workers.filter((x) => x.is_active)); setProjects(p.projects); })
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    if (!pid) { setSel({}); return; }
    api(`/attendance?date=${date}`).then((d) => {
      const m = {};
      d.records.filter((r) => String(r.project_id) === pid).forEach((r) => { m[r.worker_id] = { on: true, days: String(r.days), paid: !!r.expense_id }; });
      setSel(m);
    }).catch((e) => setErr(e.message));
  }, [date, pid]);

  const row = (id) => sel[id] || { on: false, days: "1", paid: false };
  const upd = (id, patch) => setSel((s) => ({ ...s, [id]: { ...row(id), ...patch } }));

  async function save() {
    setBusy(true); setErr(""); setMsg("");
    const entries = workers.filter((w) => row(w.id).on).map((w) => ({ worker_id: w.id, days: Number(row(w.id).days) }));
    try {
      await api("/attendance", { method: "POST", body: { date, project_id: Number(pid), entries } });
      setMsg(`تم حفظ الحضور (${entries.length} عامل)`);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <>
      <div className="page-head"><h1>الحضور اليومي</h1></div>
      <p className="muted">اختار التاريخ والمشروع، وعلّم العمال الحاضرين. الأجر بيتحسب بأجرهم اليومي.</p>
      {err && <div className="alert">{err}</div>}
      {msg && <p className="rp-pos">{msg}</p>}

      <div className="panel">
        <div className="form-grid">
          <label className="field"><span>التاريخ</span><input type="date" dir="ltr" value={date} onChange={(e) => { setDate(e.target.value); setMsg(""); }} /></label>
          <label className="field"><span>المشروع</span>
            <select value={pid} onChange={(e) => { setPid(e.target.value); setMsg(""); }}>
              <option value="">اختر المشروع</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </label>
        </div>
      </div>

      {pid && (workers.length === 0 ? <p className="muted">أضف عمالاً أولاً من صفحة "العمال والأجور".</p> : (
        <>
          <div className="at-list">
            {workers.map((w) => {
              const r = row(w.id);
              return (
                <div key={w.id} className={`at-row ${r.paid ? "paid" : ""}`}>
                  <label>
                    <input type="checkbox" checked={r.on} disabled={r.paid} onChange={(e) => upd(w.id, { on: e.target.checked })} />
                    <span><b>{w.name}</b> <span className="muted">{w.trade || ""} · {money(w.daily_wage, w.currency)}</span></span>
                  </label>
                  {r.paid ? <span className="muted">مدفوع</span> : (
                    <select className="sel-sm" value={r.days} disabled={!r.on} onChange={(e) => upd(w.id, { days: e.target.value })}>
                      {dayOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
          <button className="btn btn-solid" onClick={save} disabled={busy}>{busy ? "جاري الحفظ..." : "حفظ الحضور"}</button>
        </>
      ))}
    </>
  );
}
