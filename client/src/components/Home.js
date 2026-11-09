"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import QuoteForm from "./QuoteForm";
import WorkCard from "./WorkCard";
import { api, asset } from "@/lib/api";
import { site } from "@/lib/site";

const ease = [0.22, 1, 0.36, 1];
const stack = { hidden: {}, show: { transition: { staggerChildren: 0.14, delayChildren: 0.45 } } };
const rise = { hidden: { opacity: 0, y: 46 }, show: { opacity: 1, y: 0, transition: { duration: 1, ease } } };

export default function Home({ ready }) {
  const [scrolled, setScrolled] = useState(false);
  const [works, setWorks] = useState(null); // null = جاري التحميل

  useEffect(() => {
    api("/public/projects?limit=5").then((d) => setWorks(d.projects)).catch(() => setWorks([]));
  }, []);
  const featured = works?.[0];

  const [me, setMe] = useState(null);
  useEffect(() => { api("/auth/me").then((d) => setMe(d.user)).catch(() => {}); }, []);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const state = ready ? "show" : "hidden";

  return (
    <>
      <motion.header className={`nav ${scrolled ? "scrolled" : ""}`} initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 0.8, delay: 0.6 }}>
        <div className="container nav-in">
          <a href="#top" className="brand"><i />{site.name}</a>
          <nav className="links">
            <a href="#services">خدماتنا</a>
            {works?.length > 0 && <a href="#works">أعمالنا</a>}
            <a href="#contact">تواصل معنا</a>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: "1.3rem" }}>
            <Link href={me ? (me.role === "client" ? "/portal" : "/dashboard") : "/login"} style={{ color: "var(--muted)", textDecoration: "none" }}>{me ? "حسابي" : "دخول"}</Link>
            <a href="#contact" className="btn btn-solid">اطلب عرض سعر</a>
          </div>
        </div>
      </motion.header>

      <main>
        <section className="hero" id="top">
          <div className="container hero-grid">
            <motion.div variants={stack} initial="hidden" animate={state}>
              <motion.h1 variants={rise}>نبني بدقة، ونسلّم في الموعد.</motion.h1>
              <motion.p variants={rise} className="lead">
                {site.trade}: من الدراسة والتصميم إلى التسليم، بإشراف هندسي مباشر على كل مرحلة.
              </motion.p>
              <motion.div variants={rise} className="cta-row">
                <a href="#contact" className="btn btn-solid">اطلب عرض سعر</a>
                <a href="#services" className="btn btn-line">خدماتنا</a>
              </motion.div>
            </motion.div>

            {featured ? (
              <motion.aside className="sheet feat" variants={stack} initial="hidden" animate={state} aria-label="من أعمالنا">
                <motion.div variants={rise}>
                  <Link href={`/projects/${encodeURIComponent(featured.slug)}`} className="feat-link">
                    <img src={asset(featured.cover)} alt={featured.title} />
                    <div className="feat-cap">
                      <b>{featured.title}</b>
                      <span>{[featured.location, featured.year].filter(Boolean).join(" · ")}</span>
                    </div>
                  </Link>
                </motion.div>
              </motion.aside>
            ) : works !== null ? (
              <motion.aside className="sheet" variants={stack} initial="hidden" animate={state} aria-label="مثال من بوابة العميل">
              <motion.div variants={rise}>
                <div className="sheet-head">بوابة العميل: نموذج لما سيراه عميلك</div>
                <dl className="sheet-rows">
                  <div><dt>المشروع</dt><dd>فيلا سكنية، طابقان</dd></div>
                  <div><dt>الحالة</dt><dd>قيد التنفيذ</dd></div>
                  <div><dt>المرحلة الحالية</dt><dd>التشطيبات</dd></div>
                </dl>
                <div className="sheet-prog">
                  <div className="row"><span>نسبة الإنجاز</span><b dir="ltr">72%</b></div>
                  <div className="track">
                    <motion.span initial={{ width: 0 }} animate={{ width: ready ? "72%" : 0 }} transition={{ duration: 1.8, delay: 1.2, ease }} />
                  </div>
                </div>
              </motion.div>
            </motion.aside>
            ) : null}
          </div>
        </section>

        <section className="services" id="services">
          <div className="container">
            <h2>ما ننفذه</h2>
            <ul className="rows">
              {site.services.map((s) => (
                <li key={s.title}>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {works?.length > 0 && (
          <section className="works" id="works">
            <div className="container">
              <div className="works-head">
                <h2>أعمالنا</h2>
                <Link href="/projects" className="more">كل المشاريع</Link>
              </div>
              <div className="wk-grid">
                {works.map((w, i) => <WorkCard key={w.id} w={w} i={i} />)}
              </div>
            </div>
          </section>
        )}

        <section className="contact" id="contact">
          <div className="container qf-wrap">
            <div>
              <h2>عندك مشروع؟ أرسل تفاصيله ونرجع لك بعرض سعر.</h2>
              <p className="lead">املأ النموذج، أو تواصل معنا مباشرة.</p>
              <div className="cta-row">
                <a className="btn btn-solid" href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer">تواصل عبر واتساب</a>
                <a className="btn btn-line" href={`tel:${site.phone}`}>اتصال هاتفي</a>
              </div>
            </div>
            <QuoteForm />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">© {new Date().getFullYear()} {site.name}، {site.trade}</div>
      </footer>
    </>
  );
}
