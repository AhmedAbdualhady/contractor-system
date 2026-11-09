"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useUser } from "@/components/dashboard/UserContext";
import { kinds, money, day } from "./kinds";
import "./docs.css";

export default function DocList({ kind }) {
  const k = kinds[kind];
  const user = useUser();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(() => api(k.api).then((d) => setRows(d.rows)).catch((e) => setErr(e.message)), [k.api]);
  useEffect(() => { load(); }, [load]);

  async function remove(r) {
    if (!confirm(`حذف ${k.one} ${r.number}؟`)) return;
    setErr("");
    try { await api(`${k.api}/${r.id}`, { method: "DELETE" }); await load(); } catch (e) { setErr(e.message); }
  }

  return (
    <>
      <div className="page-head">
        <h1>{k.title}</h1>
        <Link href={`${k.base}/new`} className="btn btn-solid btn-sm">{k.one} جديد</Link>
      </div>
      {err && <div className="alert">{err}</div>}
      {rows === null ? <p className="muted">جاري التحميل...</p> : rows.length === 0 ? <p className="muted">لا توجد مستندات بعد.</p> : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>الرقم</th><th>العميل</th><th>{k.dateLabel}</th><th>الإجمالي</th>{kind === "invoices" && <th>المدفوع</th>}<th>الحالة</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td dir="ltr" className="al-s"><Link href={`${k.base}/${r.id}`}>{r.number}</Link></td>
                  <td>{r.client_name}<div className="muted">{r.project_title || ""}</div></td>
                  <td>{day(r.date)}</td>
                  <td>{money(r.total, r.currency)}</td>
                  {kind === "invoices" && <td>{money(r.paid, r.currency)}</td>}
                  <td>{k.statuses[r.status]}</td>
                  <td className="acts">
                    <Link className="textlink" href={`${k.base}/${r.id}`}>عرض</Link>
                    {user.role === "admin" && <button className="textlink danger" onClick={() => remove(r)}>حذف</button>}
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
