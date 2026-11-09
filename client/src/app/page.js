"use client";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";
import Intro from "@/components/Intro";
import Home from "@/components/Home";

export default function Page() {
  const [intro, setIntro] = useState(true);

  const finish = useCallback(() => {
    try { sessionStorage.setItem("introSeen", "1"); } catch {}
    setIntro(false);
  }, []);

  // في الإنتاج: المقدمة تظهر مرة واحدة في كل جلسة. أثناء التطوير: تظهر دائماً.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    try { if (sessionStorage.getItem("introSeen")) setIntro(false); } catch {}
  }, []);

  useEffect(() => {
    document.body.style.overflow = intro ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [intro]);

  return (
    <MotionConfig reducedMotion="user">
      <Home ready={!intro} />
      <AnimatePresence>{intro && <Intro onDone={finish} />}</AnimatePresence>
    </MotionConfig>
  );
}
