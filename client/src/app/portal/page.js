"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { statuses, types, money } from "./fmt";

const ease = [0.22, 1, 0.36, 1];

export default function PortalHome() {
  const [projects, setProjects] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/portal/projects").then((d) => setProjects(d.projects)).catch((e) => setErr(e.message));
  }, []);

  return (
    <>
      <h1>مشاريعي</h1>
      <p className="pt-sub">تابع تقدم العمل والدفعات والصور في مكان واحد.</p>

      {err && <div className="pt-alert">{err}</div>}
      {projects && projects.length === 0 && <div className="pt-empty">لا توجد مشاريع مرتبطة بحسابك حتى الآن.</div>}

      {(projects || []).map((p, i) => (
        <motion.div key={p.id} initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: i * 0.12, ease }}>
          <Link href={`/portal/${p.id}`} className="pt-card">
            <div className="pt-row">
              <h2>{p.title}</h2>
              <span className="pt-tag">{statuses[p.status]}</span>
            </div>
            <div className="pt-muted">{types[p.type]}{p.location ? ` · ${p.location}` : ""}{p.budget > 0 ? ` · المدفوع ${money(p.paid, p.currency)} من ${money(p.budget, p.currency)}` : ""}</div>
            <div className="pt-meter">
              <div className="pt-bar">
                <motion.span initial={{ width: 0 }} animate={{ width: `${p.progress}%` }} transition={{ duration: 1.4, delay: 0.3 + i * 0.12, ease }} />
              </div>
              <b dir="ltr">{p.progress}%</b>
            </div>
          </Link>
        </motion.div>
      ))}
    </>
  );
}
