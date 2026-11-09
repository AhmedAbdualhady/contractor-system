"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { statuses, types } from "@/lib/labels";
import { useUser } from "@/components/dashboard/UserContext";

export default function ProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = useUser();
  const isAdmin = user.role === "admin";
  const canPhase = isAdmin || user.role === "site_engineer";

  const [p, setP] = useState(null);
  const [phases, setPhases] = useState([]);
  const [newPhase, setNewPhase] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(
    () => api(`/projects/${id}`).then((d) => { setP(d.project); setPhases(d.phases); }).catch((e) => setErr(e.message)),
    [id]
  );
  useEffect(() => { load(); }, [load]);

  const run = async (fn) => { setErr(""); try { await fn(); await load(); } catch (e) { setErr(e.message); } };

  const slide = (pid, v) => setPhases((ps) => ps.map((x) => (x.id === pid ? { ...x, progress: v } : x)));
  const commit = (ph) => run(() => api(`/projects/${id}/phases/${ph.id}`, { method: "PATCH", body: { progress: ph.progress } }));
  const addPhase = (e) => {
    e.preventDefault();
    if (!newPhase.trim()) return;
    run(async () => { await api(`/projects/${id}/phases`, { method: "POST", body: { title: newPhase } }); setNewPhase(""); });
  };
  const delPhase = (ph) => confirm(`حذف المرحلة "${ph.title}"؟`) && run(() => api(`/projects/${id}/phases/${ph.id}`, { method: "DELETE" }));
  const setStatus = (e) => run(() => api(`/projects/${id}`, { method: "PATCH", body: { status: e.target.value } }));
  async function delProject() {
    if (!confirm("حذف المشروع نهائياً مع كل مراحله؟")) return;
    try { await api(`/projects/${id}`, { method: "DELETE" }); router.push("/dashboard/projects"); } catch (e) { setErr(e.message); }
  }

  if (!p) return err ? <div className="alert">{err}</div> : <p className="muted">جاري التحميل...</p>;

  return (
    <>
      <Link href="/dashboard/projects" className="textlink sm">المشاريع</Link>
      <div className="page-head" style={{ marginTop: "0.6rem" }}>
        <h1>{p.title}</h1>
        {isAdmin && (
          <select className="sel-sm" value={p.status} onChange={setStatus} aria-label="حالة المشروع">
            {Object.entries(statuses).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        )}
      </div>

      {err && <div className="alert">{err}</div>}

      <div className="kpis three">
        <div><b dir="ltr">{p.progress}%</b><span>نسبة الإنجاز</span></div>
        <div><b className="md">{money(p.budget, p.currency)}</b><span>الميزانية</span></div>
        <div><b className="md">{p.client_name || "-"}</b><span>العميل</span></div>
      </div>
      <div className="bar big"><span style={{ width: `${p.progress}%` }} /></div>

      <p className="muted sm meta">
        {types[p.type]}{p.location ? ` · ${p.location}` : ""}{p.start_date ? ` · من ${p.start_date}` : ""}{p.end_date ? ` إلى ${p.end_date}` : ""}
      </p>

      <section className="block">
        <h2>مراحل التنفيذ</h2>
        {phases.length === 0 && <p className="muted">لا توجد مراحل. أضف أول مرحلة.</p>}
        {phases.map((ph) => (
          <div className="phase" key={ph.id}>
            <span>{ph.title}</span>
            <input type="range" min="0" max="100" step="5" value={ph.progress} disabled={!canPhase}
              onChange={(e) => slide(ph.id, Number(e.target.value))}
              onPointerUp={() => commit(ph)} onKeyUp={() => commit(ph)} aria-label={`تقدم ${ph.title}`} />
            <b dir="ltr">{ph.progress}%</b>
            {canPhase ? <button className="textlink danger" onClick={() => delPhase(ph)} aria-label="حذف المرحلة">حذف</button> : <span />}
          </div>
        ))}
        {canPhase && (
          <form className="inline add" onSubmit={addPhase}>
            <input placeholder="اسم مرحلة جديدة" value={newPhase} onChange={(e) => setNewPhase(e.target.value)} />
            <button className="btn btn-line btn-sm">إضافة</button>
          </form>
        )}
      </section>

      {p.description && <section className="block"><h2>الوصف</h2><p className="muted">{p.description}</p></section>}

      {isAdmin && <button className="textlink danger" style={{ marginTop: "3rem" }} onClick={delProject}>حذف المشروع</button>}
    </>
  );
}
