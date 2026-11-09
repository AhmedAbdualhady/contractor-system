import { Reem_Kufi, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const display = Reem_Kufi({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-display",
});
const body = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
});

export const metadata = {
  title: "مقاولات وإنشاءات",
  description: "بناء وتشطيب وإشراف هندسي بدقة والتزام بالموعد.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
