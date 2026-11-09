"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { site } from "@/lib/site";
import "./portal.css";

export default function PortalLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    api("/auth/me")
      .then((d) => {
        if (d.user.role !== "client") router.replace("/dashboard");
        else setUser(d.user);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function logout() {
    try { await api("/auth/logout", { method: "POST" }); } catch {}
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <>
      <header className="pt-top">
        <div className="container in">
          <Link href="/" className="brand"><i />{site.name}</Link>
          <nav className="links">
            <Link href="/portal">مشاريعي</Link>
            <Link href="/">الموقع الرئيسي</Link>
            <Link href="/#contact">تواصل معنا</Link>
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer">واتساب</a>
          </nav>
          <div className="pt-who"><span>{user.name}</span><button onClick={logout}>تسجيل الخروج</button></div>
        </div>
      </header>
      <main className="pt-main">{children}</main>
    </>
  );
}
