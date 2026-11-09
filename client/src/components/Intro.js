"use client";
import { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";
import { site } from "@/lib/site";

const FLOORS = 6, FH = 46, GROUND = 430, BX = 110, BW = 170;
const TOP = GROUND - FH * FLOORS; // 154
const floorDelay = (i) => 1.1 + i * 0.5;
const ease = [0.22, 1, 0.36, 1];

// شبكة حديد برج الرافعة
const lattice = (() => {
  let d = "M338 430", y = 430, left = false;
  while (y > 76) { y -= 22; d += ` L${left ? 338 : 352} ${y}`; left = !left; }
  return d;
})();

const draw = (delay, duration = 1) => ({
  initial: { pathLength: 0 },
  animate: { pathLength: 1 },
  transition: { delay, duration, ease: "easeInOut" },
});

export default function Intro({ onDone }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const c = animate(0, 100, {
      duration: 5.6,
      ease: [0.45, 0, 0.2, 1],
      onUpdate: (v) => setPct(Math.round(v)),
      onComplete: () => setTimeout(onDone, 700),
    });
    return () => c.stop();
  }, [onDone]);

  return (
    <motion.div
      className="intro"
      exit={{ y: "-100%" }}
      transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div className="intro-brand" initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.9, ease }}>
        <h1>{site.name}</h1>
        <p>{site.trade}</p>
      </motion.div>

      <svg viewBox="20 40 380 420" className="intro-svg" aria-hidden="true">
        <defs>
          <linearGradient id="fl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(140,190,235,.14)" />
            <stop offset="1" stopColor="rgba(140,190,235,.04)" />
          </linearGradient>
        </defs>

        {/* الأرض والأساس */}
        <motion.path d="M40 430 H380" stroke="#bcd6ea" strokeWidth="1.5" fill="none" {...draw(0.1, 0.9)} />
        <motion.rect y={GROUND} height="10" fill="rgba(140,190,235,.18)" stroke="#bcd6ea" strokeOpacity=".7"
          initial={{ width: 0, x: 195 }} animate={{ width: BW + 28, x: BX - 14 }} transition={{ delay: 0.5, duration: 0.6, ease }} />

        {/* الطوابق */}
        {Array.from({ length: FLOORS }).map((_, i) => {
          const yTop = GROUND - FH * (i + 1);
          const d = floorDelay(i);
          return (
            <g key={i}>
              <motion.rect x={BX} width={BW} fill="url(#fl)" stroke="#bcd6ea" strokeOpacity=".75" strokeWidth="1"
                initial={{ y: yTop + FH, height: 0 }} animate={{ y: yTop, height: FH }}
                transition={{ delay: d, duration: 0.7, ease }} />
              {[0, 1, 2, 3].map((w) => (
                <motion.rect key={w} className="win" x={BX + 14 + w * 40} y={yTop + 14} width="20" height="18" rx="1.5"
                  initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.5, (i + w) % 3 === 0 ? 0.3 : 1] }}
                  transition={{ delay: d + 0.55 + w * 0.12, duration: 0.7 }} />
              ))}
            </g>
          );
        })}

        {/* خط القياس + الهوائي */}
        <motion.path d={`M88 ${GROUND} V${TOP} M82 ${GROUND} H94 M82 ${TOP} H94`} stroke="#bcd6ea" strokeOpacity=".6" strokeWidth="1" fill="none" {...draw(4.3, 0.9)} />
        <motion.path d={`M195 ${TOP} V116`} stroke="#bcd6ea" strokeWidth="1.5" fill="none" {...draw(4.4, 0.5)} />
        <motion.circle cx="195" cy="113" r="3.5" fill="#e0a526"
          initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.2, 1] }} transition={{ delay: 4.9, duration: 1.4, repeat: Infinity }} />

        {/* الرافعة */}
        <motion.path d="M338 430 V70 M352 430 V70" stroke="#e0a526" strokeWidth="2.5" fill="none" {...draw(0.3, 1.2)} />
        <motion.path d={lattice} stroke="#e0a526" strokeOpacity=".7" strokeWidth="1" fill="none" {...draw(0.8, 1.4)} />
        <motion.path d="M345 70 H150 M345 70 H392 M345 50 L160 70 M345 50 L388 70 M345 70 V50" stroke="#e0a526" strokeWidth="2" fill="none" {...draw(1.4, 1)} />
        <motion.rect x="378" y="70" width="16" height="14" fill="#e0a526" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }} />
        <motion.line x1="190" x2="190" y1="70" stroke="#e0a526" strokeWidth="1"
          initial={{ y2: 70 }} animate={{ y2: [100, 132, 100] }} transition={{ delay: 2, duration: 3, repeat: Infinity, ease: "easeInOut" }} />
        <motion.rect x="170" width="40" height="8" fill="#e0a526"
          initial={{ y: 70, opacity: 0 }} animate={{ y: [100, 132, 100], opacity: 1 }} transition={{ delay: 2, duration: 3, repeat: Infinity, ease: "easeInOut" }} />
      </svg>

      <div className="intro-bar">
        <div className="track"><div className="fill" style={{ width: `${pct}%` }} /></div>
        <div className="meta">
          <span>{pct < 100 ? "جاري البناء" : "اكتمل البناء"}</span>
          <span dir="ltr">{pct}%</span>
        </div>
      </div>

      <button className="skip" onClick={onDone}>تخطي</button>
    </motion.div>
  );
}
