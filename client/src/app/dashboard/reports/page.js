"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { money } from "@/components/docs/kinds";
import "@/components/docs/docs.css";
import "../work.css";

const statuses = { planning: "تخطيط", in_progress: "قيد التنفيذ", on_hold: "متوقف", completed: "منتهي" };

export default function ReportsPage() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { api("/reports/projects").then(setD).catch((e) => setErr(e.message)); }, []);

  // مجاميع حسب العملة
  const sums = {};
  (d?.projects || []).forEach((p) => {
    const s = (sums[p.currency] ||= { collected: 0, spent: 0 });
    s.collected += p.collected; s.spent += p.spent;
  });
  (d?.overhead || []).forEach((o) => { (sums[o.currency] ||= { collected: 0, spent: 0 }).spent += o.total; });

  return (
    <>
      <div className="page-head"><h1>تقرير الأرباح</h1></div>
      <p className="muted">الصافي = المحصّل من العميل − المصروف على المشروع، بعملة المشروع.</p>
      {err && <div className="alert">{err}</div>}

      {d && (
        <>
          {Object.keys(sums).length > 0 && (
            <div className="panel">
              {Object.entries(sums).map(([cur, s]) => (
                <div key={cur} style={{ display: "flex", gap: "2rem", flexWrap: "wrap", padding: "0.3rem 0" }}>
                  <span>المحصّل: <b>{money(s.collected, cur)}</b></span>
                  <span>المصروف (شامل العام): <b>{money(s.spent, cur)}</b></span>
                  <span>الصافي: <b className={s.collected - s.spent < 0 ? "rp-neg" : "rp-pos"}>{money(s.collected - s.spent, cur)}</b></span>
                </div>
              ))}
            </div>
          )}

          {d.projects.length === 0 ? <p className="muted">لا توجد مشاريع بعد.</p> : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>المشروع</th><th>قيمة العقد</th><th>المحصّل</th><th>المصروف</th><th>الصافي</th></tr></thead>
                <tbody>
                  {d.projects.map((p) => {
                    const net = p.collected - p.spent;
                    return (
                      <tr key={p.id}>
                        <td><b>{p.title}</b><div className="muted">{[p.client_name, statuses[p.status]].filter(Boolean).join(" · ")}</div></td>
                        <td>{p.budget > 0 ? money(p.budget, p.currency) : "-"}</td>
                        <td>{money(p.collected, p.currency)}</td>
                        <td>{money(p.spent, p.currency)}
                          {p.unpaid_wages > 0 && <div className="muted">+ أجور لم تُدفع {money(p.unpaid_wages, p.currency)}</div>}
                        </td>
                        <td className={net < 0 ? "rp-neg" : "rp-pos"}>{money(net, p.currency)}
                          {p.other_currency > 0 && <div className="muted">في حركات بعملة أخرى غير محسوبة</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
