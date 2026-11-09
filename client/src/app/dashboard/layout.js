"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { roles } from "@/lib/labels";
import { site } from "@/lib/site";
import { UserContext } from "@/components/dashboard/UserContext";
import "./dash.css";
import "./side-fix.css";

const nav = [
  { href: "/dashboard", label: "نظرة عامة", exact: true },
  { href: "/dashboard/projects", label: "المشاريع" },
  { href: "/dashboard/clients", label: "العملاء" },
  { href: "/dashboard/requests", label: "طلبات العروض", roles: ["admin", "accountant"] },
  { href: "/dashboard/quotes", label: "عروض الأسعار", roles: ["admin", "accountant"] },
  { href: "/dashboard/invoices", label: "الفواتير", roles: ["admin", "accountant"] },
  { href: "/dashboard/payments", label: "المدفوعات", roles: ["admin", "accountant"] },
  { href: "/dashboard/photos", label: "الصور", roles: ["admin", "site_engineer"] },
  { href: "/dashboard/expenses", label: "المصروفات", roles: ["admin", "accountant", "site_engineer"] },
  { href: "/dashboard/workers", label: "العمال والأجور", roles: ["admin", "accountant"] },
  { href: "/dashboard/attendance", label: "الحضور اليومي", roles: ["admin", "site_engineer"] },
  { href: "/dashboard/reports", label: "تقرير الأرباح", roles: ["admin", "accountant"] },
  { href: "/dashboard/users", label: "المستخدمون", roles: ["admin"] },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api("/auth/me")
      .then((d) => { if (d.user.role === "client") router.replace("/portal"); else setUser(d.user); })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function logout() {
    try { await api("/auth/logout", { method: "POST" }); } catch {}
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <UserContext.Provider value={user}>
      <div className="app">
        <aside className={`side ${open ? "open" : ""}`}>
          <div className="side-brand"><i />{site.name}</div>
          <nav>
            {nav.filter((n) => !n.roles || n.roles.includes(user.role)).map((n) => {
              const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} className={active ? "active" : ""} onClick={() => setOpen(false)}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="side-foot">
            <div className="who"><b>{user.name}</b><span>{roles[user.role]}</span></div>
            <Link href="/">عرض الموقع</Link>
            <button onClick={logout}>تسجيل الخروج</button>
          </div>
        </aside>

        <div className="main">
          <header className="top">
            <button className="btn btn-line btn-sm" onClick={() => setOpen((o) => !o)}>القائمة</button>
            <span>{site.name}</span>
          </header>
          <div className="content">{children}</div>
        </div>
      </div>
    </UserContext.Provider>
  );
}
