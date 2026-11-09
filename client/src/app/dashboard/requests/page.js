"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useUser } from "@/components/dashboard/UserContext";
import { day } from "@/components/docs/kinds";
import "@/components/docs/docs.css";

const statuses = { new: "جديد", contacted: "تم التواصل", quoted: "أُرسل عرض", closed: "مغلق" };

export default function RequestsPage() {
  const router = useRouter();
  const user = useUser();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(() => api("/quote-requests").then((d) => setRows(d.requests)).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function setStatus(r, status) {
    setErr("");
    try { await api(`/quote-requests/${r.id}/status`, { method: "PATCH", body: { status } }); await load(); } catch (e) { setErr(e.message); }
  }
  async function convert(r) {
    setErr("");
    try {
      const d = await api(`/quote-requests/${r.id}/convert`, { method: "POST" });
      router.push(`/dashboard/quotes/new?client=${d.client_id}&request=${r.id}`);
    } catch (e) { setErr(e.message); }
  }
  async function remove(r) {
    if (!confirm(`حذف طلب ${r.name}؟`)) return;
    setErr("");
    try { await api(`/quote-requests/${r.id}`, { method: "DELETE" }); await load(); } catch (e) { setErr(e.message); }
  }

  return (
    <>
      <div className="page-head"><h1>طلبات العروض</h1></div>
      <p className="muted">الطلبات اللي بتجي من فورم الموقع. اضغط "تحويل لعرض سعر" وبيتجهز العميل وتفاصيل الطلب.</p>
      {err && <div className="alert">{err}</div>}

      {rows === null ? <p className="muted">جاري التحميل...</p> : rows.length === 0 ? <p className="muted">لا توجد طلبات بعد.</p> : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>مقدّم الطلب</th><th>التفاصيل</th><th>الحالة</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <b>{r.name}</b>
                    <div><a href={`tel:${r.phone}`} dir="ltr">{r.phone}</a></div>
                    <div className="muted">{day(r.created_at)}</div>
                  </td>
                  <td>
                    {[r.project_type, r.location, r.budget_range].filter(Boolean).join(" · ") || "-"}
                    {r.message && <div className="muted" style={{ whiteSpace: "pre-wrap", maxWidth: "34rem" }}>{r.message}</div>}
                  </td>
                  <td>
                    <select className="sel-sm" value={r.status} onChange={(e) => setStatus(r, e.target.value)}>
                      {Object.entries(statuses).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="acts">
                    <button className="textlink" onClick={() => convert(r)}>تحويل لعرض سعر</button>
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
