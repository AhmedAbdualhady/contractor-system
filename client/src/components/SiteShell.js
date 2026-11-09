import Link from "next/link";
import { site } from "@/lib/site";
import "./gallery.css";

export default function SiteShell({ children }) {
  return (
    <>
      <header className="nav scrolled">
        <div className="container nav-in">
          <Link href="/" className="brand"><i />{site.name}</Link>
          <nav className="links">
            <Link href="/">الرئيسية</Link>
            <Link href="/projects">أعمالنا</Link>
          </nav>
          <Link href="/#contact" className="btn btn-solid">اطلب عرض سعر</Link>
        </div>
      </header>
      <main className="shell-main">{children}</main>
      <footer className="footer">
        <div className="container">© {new Date().getFullYear()} {site.name}، {site.trade}</div>
      </footer>
    </>
  );
}
