"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import "./quote-form.css";

const types = ["سكني", "تجاري", "حكومي", "ترميم وتشطيب", "أخرى"];
const init = { name: "", phone: "", project_type: "سكني", location: "", budget_range: "", message: "", website: "" };

export default function QuoteForm() {
  const [f, setF] = useState(init);
  const [state, setState] = useState("idle"); // idle | sending | done
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setErr(""); setState("sending");
    try {
      await api("/quote-requests", { method: "POST", body: f });
      setF(init); setState("done");
    } catch (e2) { setErr(e2.message); setState("idle"); }
  }

  if (state === "done") {
    return (
      <div className="qf-done" role="status">
        <h3>وصلنا طلبك</h3>
        <p>سنتواصل معك على الرقم الذي كتبته في أقرب وقت لمراجعة التفاصيل.</p>
        <button className="btn btn-line" onClick={() => setState("idle")}>إرسال طلب آخر</button>
      </div>
    );
  }

  return (
    <form className="qf" onSubmit={submit}>
      <input className="qf-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set("website")} />
      <div className="two">
        <label><span>الاسم</span><input required value={f.name} onChange={set("name")} autoComplete="name" /></label>
        <label><span>رقم الهاتف</span><input required dir="ltr" inputMode="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" /></label>
      </div>
      <div className="two">
        <label><span>نوع المشروع</span>
          <select value={f.project_type} onChange={set("project_type")}>{types.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
        <label><span>الموقع</span><input value={f.location} onChange={set("location")} placeholder="المدينة / الحي" /></label>
      </div>
      <label><span>الميزانية التقريبية (اختياري)</span><input value={f.budget_range} onChange={set("budget_range")} /></label>
      <label><span>تفاصيل المشروع</span><textarea rows="4" value={f.message} onChange={set("message")} placeholder="المساحة، عدد الطوابق، نوع التشطيب..." /></label>
      {err && <div className="qf-err" role="alert">{err}</div>}
      <button className="btn btn-solid" disabled={state === "sending"}>{state === "sending" ? "جاري الإرسال..." : "أرسل الطلب"}</button>
    </form>
  );
}
