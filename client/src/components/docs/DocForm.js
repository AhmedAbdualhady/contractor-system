"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { kinds, money } from "./kinds";
import "./docs.css";

const blank = () => ({ description: "", quantity: 1, unit: "", unit_price: "" });

export default function DocForm({ kind, editing = false }) {
  const k = kinds[kind];
  const router = useRouter();
  const { id } = useParams();
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [f, setF] = useState({ client_id: "", project_id: "", currency: "SDG", date: "", discount: 0, notes: "" });
  const [items, setItems] = useState([blank()]);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [req, setReq] = useState(null);

  useEffect(() => {
    Promise.all([api("/clients"), api("/projects")])
      .then(([c, p]) => { setClients(c.clients); setProjects(p.projects); })
      .catch((e) => setErr(e.message));
  }, []);

  // قادم من "تحويل لعرض سعر": يختار العميل ويربط الطلب
  useEffect(() => {
    if (editing) return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("client")) setF((s) => ({ ...s, client_id: sp.get("client") }));
    if (sp.get("request")) setRequestId(Number(sp.get("request")));
  }, [editing]);

  useEffect(() => {
    if (!requestId) return;
    api("/quote-requests").then((d) => setReq(d.requests.find((r) => r.id === requestId) || null)).catch(() => {});
  }, [requestId]);

  useEffect(() => {
    if (!editing) return;
    api(`${k.api}/${id}`).then((d) => {
      setF({ client_id: String(d.doc.client_id), project_id: d.doc.project_id ? String(d.doc.project_id) : "", currency: d.doc.currency, date: d.doc.date || "", discount: d.doc.discount || 0, notes: d.doc.notes || "" });
      setItems(d.items.map((i) => ({ description: i.description, quantity: i.quantity, unit: i.unit || "", unit_price: i.unit_price })));
    }).catch((e) => setErr(e.message));
  }, [editing, id, k.api]);

  const set = (key) => (e) => setF((s) => ({ ...s, [key]: e.target.value }));
  const setItem = (i, key) => (e) => setItems((l) => l.map((x, j) => (j === i ? { ...x, [key]: e.target.value } : x)));
  const pickProject = (e) => {
    const p = projects.find((x) => String(x.id) === e.target.value);
    setF((s) => ({ ...s, project_id: e.target.value, ...(p ? { client_id: String(p.client_id || s.client_id), currency: p.currency || s.currency } : {}) }));
  };

  const sub = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);
  const total = Math.max(sub - (k.discount ? Number(f.discount) || 0 : 0), 0);
  const shownProjects = projects.filter((p) => !f.client_id || String(p.client_id) === f.client_id);

  async function save(e) {
    e.preventDefault();
    setSaving(true); setErr("");
    const body = {
      client_id: Number(f.client_id) || 0,
      project_id: f.project_id ? Number(f.project_id) : null,
      currency: f.currency,
      date: f.date || null,
      notes: f.notes,
      ...(requestId ? { request_id: requestId } : {}),
      ...(k.discount ? { discount: Number(f.discount) || 0 } : {}),
      items: items.map((i) => ({ description: i.description, quantity: Number(i.quantity), unit: i.unit, unit_price: Number(i.unit_price) || 0 })),
    };
    try {
      const r = await api(editing ? `${k.api}/${id}` : k.api, { method: editing ? "PUT" : "POST", body });
      router.push(`${k.base}/${editing ? id : r.id}`);
    } catch (e2) { setErr(e2.message); setSaving(false); }
  }

  return (
    <form onSubmit={save}>
      <div className="page-head"><h1>{editing ? `تعديل ${k.one}` : `${k.one} جديد`}</h1></div>
      {err && <div className="alert">{err}</div>}

      {req && (
        <div className="panel">
          <p className="muted" style={{ margin: 0 }}>تفاصيل الطلب من الموقع</p>
          <p style={{ margin: "0.4rem 0 0" }}>{[req.project_type, req.location, req.budget_range].filter(Boolean).join(" · ")}</p>
          {req.message && <p className="muted" style={{ margin: "0.4rem 0 0", whiteSpace: "pre-wrap" }}>{req.message}</p>}
        </div>
      )}

      <div className="panel">
        <div className="form-grid">
          <label className="field"><span>العميل</span>
            <select value={f.client_id} onChange={set("client_id")} required>
              <option value="">اختر العميل</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="field"><span>المشروع (اختياري)</span>
            <select value={f.project_id} onChange={pickProject}>
              <option value="">بدون مشروع</option>
              {shownProjects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </label>
          <label className="field"><span>العملة</span>
            <select value={f.currency} onChange={set("currency")}><option value="SDG">جنيه سوداني</option><option value="USD">دولار</option></select>
          </label>
          <label className="field"><span>{k.dateLabel}</span><input type="date" dir="ltr" value={f.date} onChange={set("date")} /></label>
        </div>
      </div>

      <div className="panel">
        <div className="tbl-wrap">
          <table className="dc-items">
            <thead><tr><th>البند</th><th>الكمية</th><th>الوحدة</th><th>سعر الوحدة</th><th /></tr></thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td><input className="desc" required value={it.description} onChange={setItem(i, "description")} placeholder="مثال: صب أعمدة خرسانية" /></td>
                  <td><input type="number" min="0" step="any" dir="ltr" value={it.quantity} onChange={setItem(i, "quantity")} /></td>
                  <td><input value={it.unit} onChange={setItem(i, "unit")} placeholder="م٢، م٣، عدد" /></td>
                  <td><input type="number" min="0" step="any" dir="ltr" value={it.unit_price} onChange={setItem(i, "unit_price")} /></td>
                  <td>{items.length > 1 && <button type="button" className="textlink danger" onClick={() => setItems((l) => l.filter((_, j) => j !== i))}>حذف</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="actions" style={{ marginTop: "0.8rem" }}>
          <button type="button" className="btn btn-line btn-sm" onClick={() => setItems((l) => [...l, blank()])}>إضافة بند</button>
        </div>

        <div className="dc-sum">
          <div><span>المجموع</span><span>{money(sub, f.currency)}</span></div>
          {k.discount && (
            <div><span>الخصم</span><input type="number" min="0" step="any" dir="ltr" value={f.discount} onChange={set("discount")} style={{ width: "120px", background: "rgba(14,34,54,.9)", border: "1px solid var(--line)", color: "var(--paper)", padding: "0.3rem 0.5rem", font: "inherit" }} /></div>
          )}
          <div className="grand"><span>الإجمالي</span><span>{money(total, f.currency)}</span></div>
        </div>
      </div>

      <div className="panel">
        <label className="field"><span>ملاحظات وشروط (تظهر في الطباعة)</span><textarea rows="3" value={f.notes} onChange={set("notes")} /></label>
      </div>

      <div className="actions">
        <button className="btn btn-solid" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</button>
        <Link href={k.base} className="btn btn-line">إلغاء</Link>
      </div>
    </form>
  );
}
