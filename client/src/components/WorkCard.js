import Link from "next/link";
import { asset } from "@/lib/api";
import { types, statusPublic } from "./labels-public";
import "./gallery.css";

export default function WorkCard({ w, i = 0 }) {
  return (
    <Link href={`/projects/${encodeURIComponent(w.slug)}`} className="wk-card" style={{ "--i": i }}>
      <div className="wk-img"><img src={asset(w.cover)} alt={w.title} loading="lazy" /></div>
      <div className="wk-meta">
        <h3>{w.title}</h3>
        <span>{[types[w.type], w.location, w.year].filter(Boolean).join(" · ")}</span>
      </div>
      <em className="wk-tag">{statusPublic(w.status)}</em>
    </Link>
  );
}
