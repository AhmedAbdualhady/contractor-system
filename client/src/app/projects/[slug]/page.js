"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, asset } from "@/lib/api";
import SiteShell from "@/components/SiteShell";
import Lightbox from "@/components/Lightbox";
import { types, stagesPublic, statusPublic } from "@/components/labels-public";

export default function ProjectDetail() {
  const { slug } = useParams();
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(null); // رقم الصورة في المعرض

  useEffect(() => {
    api(`/public/projects/${slug}`).then(setD).catch((e) => setErr(e.status === 404 ? "المشروع غير موجود" : e.message));
  }, [slug]);

  const images = useMemo(() => (d ? d.media.filter((m) => m.kind === "image") : []), [d]);
  const groups = useMemo(
    () => (d ? Object.keys(stagesPublic).map((k) => [k, d.media.filter((m) => m.stage === k)]).filter(([, l]) => l.length) : []),
    [d]
  );

  return (
    <SiteShell>
      <div className="container pg">
        <Link href="/projects" className="pg-back">كل المشاريع</Link>
        {err && <div className="pg-empty">{err}</div>}
        {d && (
          <>
            <h1>{d.project.title}</h1>
            <p className="sub">
              <span className="pg-tag">{statusPublic(d.project.status)}</span>
              <span>{[types[d.project.type], d.project.location, d.project.year].filter(Boolean).join(" · ")}</span>
            </p>
            {d.project.cover && <img className="pg-hero" src={asset(d.project.cover)} alt={d.project.title} />}
            {d.project.description && <p className="pg-desc">{d.project.description}</p>}

            {groups.map(([k, list]) => (
              <section key={k}>
                <h2 className="pg-stage">{stagesPublic[k]}</h2>
                <div className="pg-grid">
                  {list.map((m) => m.kind === "video" ? (
                    <figure key={m.id}><video src={asset(m.url)} controls /></figure>
                  ) : (
                    <button key={m.id} onClick={() => setOpen(images.findIndex((x) => x.id === m.id))} aria-label="تكبير الصورة">
                      <img src={asset(m.url)} alt={m.caption || d.project.title} loading="lazy" />
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
      {open !== null && images.length > 0 && <Lightbox items={images} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />}
    </SiteShell>
  );
}
