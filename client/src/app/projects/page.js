"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import SiteShell from "@/components/SiteShell";
import WorkCard from "@/components/WorkCard";

export default function ProjectsPage() {
  const [works, setWorks] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/public/projects").then((d) => setWorks(d.projects)).catch((e) => setErr(e.message));
  }, []);

  return (
    <SiteShell>
      <div className="container pg">
        <h1>أعمالنا</h1>
        <p className="sub">مشاريع نفذناها وأخرى قيد التنفيذ.</p>
        {err && <div className="pg-empty">{err}</div>}
        {works && works.length === 0 && <div className="pg-empty">سنعرض مشاريعنا هنا قريباً.</div>}
        {works && works.length > 0 && (
          <div className="wk-grid">{works.map((w, i) => <WorkCard key={w.id} w={w} i={i} />)}</div>
        )}
      </div>
    </SiteShell>
  );
}
