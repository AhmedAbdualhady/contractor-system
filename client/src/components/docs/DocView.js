"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { site } from "@/lib/site";
import { useUser } from "@/components/dashboard/UserContext";
import { kinds, money, day } from "./kinds";
import "./docs.css";

export default function DocView({ kind }) {
  const k = kinds[kind];
  const { id } = useParams();
  const router = useRouter();
  const user = useUser();
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");

  const load = () => api(`${k.api}/${id}`).then(setD).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function setStatus(status) {
    setErr("");
    try { await api(`${k.api}/${id}/status`, { method: "PATCH", body: { status } }); await load(); } catch (e) { setErr(e.message); }
  }
  async function remove() {
    if (!confirm("حذف هذا المستند نهائياً؟")) return;
    try { await api(`${k.api}/${id}`, { method: "DELETE" }); router.replace(k.base); } catch (e) { setErr(e.message); }
  }

  if (err && !d) return <div className="alert">{err}</div>;
  if (!d) return <p className="muted">جاري التحميل...</p>;

  const { doc, items, paid } = d;
  const sub = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const canManual = k.manual.includes(doc.status);

  return (
    <>
      <div className="dc-bar no-print">
        <Link href={k.base} className="btn btn-line btn-sm">الرجوع للقائمة</Link>
        <Link href={`${k.base}/${id}/edit`} className="btn btn-line btn-sm">تعديل</Link>
        {canManual ? (
          <select className="sel-sm" value={doc.status} onChange={(e) => setStatus(e.target.value)}>
            {k.manual.map((s) => <option key={s} value={s}>{k.statuses[s]}</option>)}
          </select>
        ) : <span className="muted">{k.statuses[doc.status]}</span>}
        <span className="sp" />
        {user.role === "admin" && <button className="btn btn-line btn-sm" onClick={remove}>حذف</button>}
        <button className="btn btn-solid btn-sm" onClick={() => window.print()}>طباعة / حفظ PDF</button>
      </div>
      {err && <div className="alert no-print">{err}</div>}

      <article className="paper">
        <div className="ph">
          <div className="co">
            {site.logo ? <img src={site.logo} alt="" /> : <i />}
            <div><b>{site.name}</b><small>{site.trade}</small>{site.phone && <small dir="ltr" style={{ display: "block", textAlign: "start" }}>{site.phone}</small>}</div>
          </div>
          <div className="dt">
            <h2>{k.docTitle}</h2>
            <div dir="ltr">{doc.number}</div>
            <div>التاريخ: {day(doc.created_at)}</div>
            {doc.date && <div>{k.dateLabel}: {day(doc.date)}</div>}
          </div>
        </div>

        <div className="parties">
          <div><small>إلى</small><b>{doc.client_name}</b>{doc.client_phone && <div dir="ltr" style={{ textAlign: "start" }}>{doc.client_phone}</div>}{doc.client_address && <div>{doc.client_address}</div>}</div>
          {doc.project_title && <div><small>المشروع</small><b>{doc.project_title}</b></div>}
        </div>

        <table>
          <thead><tr><th>#</th><th>البند</th><th>الكمية</th><th>الوحدة</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
          <tbody>
            {items.map((i, n) => (
              <tr key={i.id}>
                <td>{n + 1}</td><td>{i.description}</td><td>{i.quantity}</td><td>{i.unit || "-"}</td>
                <td>{money(i.unit_price, doc.currency)}</td><td>{money(i.quantity * i.unit_price, doc.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="tot">
          {(k.discount && doc.discount > 0) && (<><div><span>المجموع</span><span>{money(sub, doc.currency)}</span></div><div><span>الخصم</span><span>{money(doc.discount, doc.currency)}</span></div></>)}
          <div className="grand"><span>الإجمالي</span><span>{money(doc.total, doc.currency)}</span></div>
          {kind === "invoices" && (<><div><span>المدفوع</span><span>{money(paid, doc.currency)}</span></div><div><span>المتبقي</span><span>{money(Math.max(doc.total - paid, 0), doc.currency)}</span></div></>)}
        </div>

        {doc.notes && <div className="notes">{doc.notes}</div>}
        <div className="sign"><span>توقيع المهندس</span><span>توقيع العميل</span></div>
      </article>
    </>
  );
}
