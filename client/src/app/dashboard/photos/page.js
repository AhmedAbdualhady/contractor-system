"use client";
import { useCallback, useEffect, useState } from "react";
import { api, asset } from "@/lib/api";
import "@/components/docs/docs.css";

const stages = { before: "قبل البدء", during: "أثناء التنفيذ", after: "بعد الإنجاز" };

export default function PhotosPage() {
  const [projects, setProjects] = useState([]);
  const [pid, setPid] = useState("");
  const [media, setMedia] = useState([]);
  const [stage, setStage] = useState("during");
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { api("/projects").then((d) => setProjects(d.projects)).catch((e) => setErr(e.message)); }, []);

  const load = useCallback(async (id) => {
    if (!id) { setMedia([]); return; }
    try { setMedia((await api(`/media/project/${id}`)).media); } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(pid); }, [pid, load]);

  async function upload(e) {
    e.preventDefault();
    if (files.length === 0) { setErr("اختر صورة أو فيديو أولاً"); return; }
    setBusy(true); setErr("");
    const fd = new FormData();
    fd.append("stage", stage);
    fd.append("caption", caption);
    files.forEach((x) => fd.append("files", x));
    try {
      await api(`/media/project/${pid}`, { method: "POST", body: fd });
      setFiles([]); setCaption(""); e.target.reset();
      await load(pid);
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  }

  const cur = projects.find((p) => String(p.id) === pid);
  const reloadProjects = () => api("/projects").then((d) => setProjects(d.projects)).catch((e) => setErr(e.message));

  async function publish(is_public) {
    setErr("");
    try { await api(`/portfolio/${pid}`, { method: "PATCH", body: { is_public } }); await reloadProjects(); } catch (e) { setErr(e.message); }
  }
  async function setCover(m) {
    setErr("");
    try { await api(`/portfolio/${pid}`, { method: "PATCH", body: { cover_image: m.url } }); await reloadProjects(); } catch (e) { setErr(e.message); }
  }

  async function remove(m) {
    if (!confirm("حذف هذا الملف؟")) return;
    setErr("");
    try { await api(`/media/${m.id}`, { method: "DELETE" }); await load(pid); } catch (e) { setErr(e.message); }
  }

  return (
    <>
      <div className="page-head"><h1>صور المشاريع</h1></div>
      <p className="muted">الصور بتظهر للعميل في بوابتو تحت صور الموقع.</p>
      {err && <div className="alert">{err}</div>}

      <form className="panel" onSubmit={upload}>
        <div className="form-grid">
          <label className="field"><span>المشروع</span>
            <select value={pid} onChange={(e) => setPid(e.target.value)} required>
              <option value="">اختر المشروع</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </label>
          <label className="field"><span>المرحلة</span>
            <select value={stage} onChange={(e) => setStage(e.target.value)}>{Object.entries(stages).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </label>
          <label className="field"><span>وصف (اختياري)</span><input value={caption} onChange={(e) => setCaption(e.target.value)} /></label>
          <label className="field"><span>الملفات (صور JPG/PNG/WebP أو فيديو MP4، حتى 40MB)</span>
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4" onChange={(e) => setFiles([...e.target.files])} />
          </label>
        </div>
        <div className="actions"><button className="btn btn-solid btn-sm" disabled={busy || !pid}>{busy ? "جاري الرفع..." : "رفع"}</button></div>
      </form>

      {pid && cur && (
        <div className="panel">
          <label style={{ display: "flex", gap: "0.7rem", alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={!!cur.is_public} onChange={(e) => publish(e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--ochre)" }} />
            <span>عرض هذا المشروع في معرض الموقع العام</span>
          </label>
          <p className="muted" style={{ margin: "0.5rem 0 0" }}>بيظهر باسمو ونوعو وموقعو ووصفو وصورو، من غير الميزانية واسم العميل. اضغط "غلاف" تحت أي صورة عشان تكون صورة الواجهة.</p>
        </div>
      )}

      {pid && (media.length === 0 ? <p className="muted">لا توجد ملفات لهذا المشروع بعد.</p> : (
        <div className="dc-grid">
          {media.map((m) => (
            <figure key={m.id}>
              {m.kind === "video" ? <video src={asset(m.url)} controls /> : <img src={asset(m.url)} alt={m.caption || ""} loading="lazy" />}
              <figcaption>
                <span>{stages[m.stage]}{m.caption ? ` · ${m.caption}` : ""}</span>
                <span>
                  {m.kind !== "video" && (cur?.cover_image === m.url ? <span className="muted">الغلاف الحالي</span> : <button className="textlink" onClick={() => setCover(m)}>غلاف</button>)}
                  {" "}<button className="textlink danger" onClick={() => remove(m)}>حذف</button>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      ))}
    </>
  );
}
