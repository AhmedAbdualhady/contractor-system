"use client";
import { useEffect } from "react";
import { asset } from "@/lib/api";
import "./gallery.css";

// items: [{ url, caption }]  ·  index: رقم الصورة المفتوحة
export default function Lightbox({ items, index, onClose, onIndex }) {
  const n = items.length;
  const next = () => onIndex((index + 1) % n);
  const prev = () => onIndex((index - 1 + n) % n);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onIndex((index + 1) % n);   // في الواجهة العربية: اليسار = التالي
      if (e.key === "ArrowRight") onIndex((index - 1 + n) % n);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [index, n, onClose, onIndex]);

  const it = items[index];
  return (
    <div className="lb" role="dialog" aria-modal="true" onClick={onClose}>
      <img src={asset(it.url)} alt={it.caption || ""} onClick={(e) => e.stopPropagation()} />
      {it.caption && <div className="lb-cap">{it.caption}</div>}
      <button className="x" onClick={onClose}>إغلاق</button>
      {n > 1 && (
        <>
          <button className="pv" onClick={(e) => { e.stopPropagation(); prev(); }}>السابق</button>
          <button className="nx" onClick={(e) => { e.stopPropagation(); next(); }}>التالي</button>
        </>
      )}
    </div>
  );
}
