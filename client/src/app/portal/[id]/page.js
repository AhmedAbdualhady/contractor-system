"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, animate } from "framer-motion";
import { api, asset } from "@/lib/api";
import { statuses, types, methods, stages, money, day, phaseState } from "../fmt";

const ease = [0.22, 1, 0.36, 1];

function Count({ to }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, to, { duration: 1.6, ease: "easeOut", onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [to]);
  return <b dir="ltr">{v}%</b>;
}

export default function ProjectPortal() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api(`/portal/projects/${id}`).then(setD).catch((e) => setErr(e.message));
  }, [id]);

  if (err) return (<><Link href="/portal" className="pt-back">العودة إلى مشاريعي</Link><div className="pt-alert">{err}</div></>);
  if (!d) return <p className="pt-muted">جاري التحميل...</p>;

  const { project: p, phases, payments, media, paid } = d;
  const remaining = Math.max(p.budget - paid, 0);
  const byStage = Object.keys(stages).map((k) => [k, media.filter((m) => m.stage === k)]).filter(([, l]) => l.length);

  return (
    <>
      <Link href="/portal" className="pt-back">العودة إلى مشاريعي</Link>
      <h1>{p.title}</h1>
      <p className="pt-sub">{types[p.type]}{p.location ? ` · ${p.location}` : ""} · <span className="pt-tag">{statuses[p.status]}</span></p>

      <section>
        <div className="pt-big"><Count to={p.progress} /><span>نسبة الإنجاز</span></div>
        <div className="pt-bar lg">
          <motion.span initial={{ width: 0 }} animate={{ width: `${p.progress}%` }} transition={{ duration: 1.6, ease }} />
        </div>
      </section>

      <div className="pt-facts">
        <div><small>تاريخ البدء</small><b>{day(p.start_date)}</b></div>
        <div><small>التسليم المتوقع</small><b>{day(p.end_date)}</b></div>
        {p.budget > 0 && (
          <>
            <div><small>قيمة العقد</small><b>{money(p.budget, p.currency)}</b></div>
            <div><small>المدفوع</small><b>{money(paid, p.currency)}</b></div>
            <div><small>المتبقي</small><b>{money(remaining, p.currency)}</b></div>
          </>
        )}
      </div>

      {p.description && <p className="pt-muted">{p.description}</p>}

      <section className="pt-sec">
        <h2>مراحل العمل</h2>
        {phases.length === 0 ? <div className="pt-empty">لم تُحدَّد مراحل لهذا المشروع بعد.</div> : (
          <ul className="pt-phases">
            {phases.map((ph, i) => (
              <motion.li key={ph.id} className={ph.progress >= 100 ? "done" : ""} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.7, ease }}>
                <div className="top"><span>{ph.title}</span><span className="state">{phaseState(ph.progress)} · <span dir="ltr">{ph.progress}%</span></span></div>
                <div className="pt-bar"><motion.span initial={{ width: 0 }} animate={{ width: `${ph.progress}%` }} transition={{ duration: 1.2, delay: 0.4 + i * 0.1, ease }} /></div>
                {(ph.start_date || ph.end_date) && <div className="dates">{day(ph.start_date)} إلى {day(ph.end_date)}</div>}
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      <section className="pt-sec">
        <h2>الدفعات</h2>
        {payments.length === 0 ? <div className="pt-empty">لا توجد دفعات مسجلة بعد.</div> : (
          <div className="pt-scroll">
            <table className="pt-tbl">
              <thead><tr><th>التاريخ</th><th>المبلغ</th><th>الطريقة</th><th>ملاحظة</th></tr></thead>
              <tbody>
                {payments.map((x) => (
                  <tr key={x.id}><td>{day(x.paid_at)}</td><td>{money(x.amount, x.currency)}</td><td>{methods[x.method]}</td><td className="pt-muted">{x.notes || "-"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="pt-sec">
        <h2>صور الموقع</h2>
        {byStage.length === 0 ? <div className="pt-empty">ستظهر هنا صور المشروع عند رفعها.</div> : byStage.map(([k, list]) => (
          <div key={k}>
            <p className="pt-stage">{stages[k]}</p>
            <div className="pt-grid">
              {list.map((m) => (
                <figure key={m.id}>
                  {m.kind === "video" ? <video src={asset(m.url)} controls /> : <img src={asset(m.url)} alt={m.caption || ""} loading="lazy" />}
                  {m.caption && <figcaption>{m.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
