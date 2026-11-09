export const statuses = { planning: "تخطيط", in_progress: "قيد التنفيذ", on_hold: "متوقف مؤقتاً", completed: "منتهي" };
export const types = { residential: "سكني", commercial: "تجاري", government: "حكومي", renovation: "ترميم", other: "أخرى" };
export const methods = { cash: "نقداً", bank: "إيداع بنكي", transfer: "تحويل", mobile_money: "دفع إلكتروني" };
export const stages = { before: "قبل البدء", during: "أثناء التنفيذ", after: "بعد الإنجاز" };

export const money = (n, cur) => `${Number(n || 0).toLocaleString("en-US")} ${cur === "USD" ? "$" : "ج.س"}`;
export const day = (d) => (d ? String(d).slice(0, 10) : "-");
export const phaseState = (p) => (p >= 100 ? "منتهية" : p > 0 ? "جارية" : "لم تبدأ");
