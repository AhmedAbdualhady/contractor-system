"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import StatusChip from "@/components/dashboard/StatusChip";

export default function Overview() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/dashboard/stats").then(setD).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="alert">{err}</div>;
  if (!d) return <p className="muted">جاري التحميل...</p>;

  const c = d.counts;
  const total = (arr, cur) => arr.find((x) => x.currency === cur)?.total || 0;
  const currencies = d.income ? [...new Set([...d.income, ...d.spend].map((x) => x.currency))] : [];

  return (
    <>
      <div className="page-head"><h1>نظرة عامة</h1></div>

      <div className="kpis">
        <div><b>{c.active_projects}</b><span>مشاريع قيد التنفيذ</span></div>
        <div><b>{c.completed_projects}</b><span>مشاريع مكتملة</span></div>
        <div><b>{c.clients}</b><span>العملاء</span></div>
        <div><b>{c.new_requests}</b><span>طلبات عروض أسعار جديدة</span></div>
      </div>

      {d.income && (
        <section className="block">
          <h2>الماليات</h2>
          {currencies.length === 0 ? (
            <p className="muted">لا توجد حركات مالية بعد. تُسجَّل الدفعات والمصروفات في الخطوة الجاية.</p>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>العملة</th><th>الإيرادات</th><th>المصروفات</th><th>الصافي</th></tr></thead>
                <tbody>
                  {currencies.map((cur) => (
                    <tr key={cur}>
                      <td>{cur === "USD" ? "دولار" : "جنيه سوداني"}</td>
                      <td>{money(total(d.income, cur), cur)}</td>
                      <td>{money(total(d.spend, cur), cur)}</td>
                      <td>{money(total(d.income, cur) - total(d.spend, cur), cur)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section className="block">
        <h2>آخر المشاريع</h2>
        {d.recent.length === 0 ? (
          <p className="muted">لا توجد مشاريع بعد. <Link href="/dashboard/projects" className="textlink">أضف أول مشروع</Link></p>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <tbody>
                {d.recent.map((p) => (
                  <tr key={p.id}>
                    <td><Link href={`/dashboard/projects/${p.id}`} className="textlink">{p.title}</Link><div className="muted sm">{p.client_name || "بدون عميل"}</div></td>
                    <td><StatusChip status={p.status} /></td>
                    <td className="w-prog">
                      <div className="bar"><span style={{ width: `${p.progress}%` }} /></div>
                    </td>
                    <td dir="ltr">{p.progress}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
