"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import "../auth.css";

const ease = [0.22, 1, 0.36, 1];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // لو الزول داخل أصلاً: نودّيه لبوابتو أو لوحتو على طول بدل ما نعرض النموذج
  useEffect(() => {
    api("/auth/me")
      .then((d) => router.replace(d.user.role === "client" ? "/portal" : "/dashboard"))
      .catch(() => setChecking(false));
  }, [router]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = await api("/auth/login", { method: "POST", body: { email, password } });
      router.push(user.role === "client" ? "/portal" : "/dashboard");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (checking) return null;

  return (
    <main className="auth">
      <motion.section className="auth-form" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }}>
        <h1>تسجيل الدخول</h1>
        <p className="sub">ادخل بحسابك لمتابعة المشاريع والدفعات.</p>

        <form onSubmit={onSubmit} noValidate>
          <label className="field">
            <span>البريد الإلكتروني</span>
            <input type="email" dir="ltr" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label className="field">
            <span>كلمة المرور</span>
            <div className="pw">
              <input type={show ? "text" : "password"} dir="ltr" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShow((v) => !v)}>{show ? "إخفاء" : "إظهار"}</button>
            </div>
          </label>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <button className="btn btn-solid" type="submit" disabled={loading}>
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <p style={{ color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.9, marginTop: "1.6rem", marginBottom: 0 }}>
          ما عندك حساب؟ الحسابات بيفتحها المهندس للعملاء. لطلب عرض سعر{" "}
          <Link href="/#contact" style={{ color: "var(--ochre-soft)" }}>اضغط هنا</Link>
        </p>

        <Link href="/" className="back">العودة إلى الموقع</Link>
      </motion.section>

      <section className="auth-art" aria-hidden="true">
        <svg viewBox="80 120 230 330">
          <motion.path
            d="M110 430 V154 H280 V430 Z M110 384 H280 M110 338 H280 M110 292 H280 M110 246 H280 M110 200 H280 M195 154 V116 M60 430 H330"
            fill="none" stroke="#bcd6ea" strokeOpacity=".8" strokeWidth="1.5"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4, ease: "easeInOut" }}
          />
          {Array.from({ length: 6 }).map((_, r) =>
            [0, 1, 2, 3].map((c) => (
              <motion.rect key={`${r}-${c}`} className="win" x={124 + c * 40} y={160 + r * 46} width="20" height="18" rx="1.5"
                initial={{ opacity: 0 }} animate={{ opacity: (r + c) % 3 === 0 ? 0.3 : 1 }}
                transition={{ delay: 1.2 + (5 - r) * 0.18 + c * 0.08, duration: 0.6 }} />
            ))
          )}
        </svg>
      </section>
    </main>
  );
}
