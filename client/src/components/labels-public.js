export const types = { residential: "سكني", commercial: "تجاري", government: "حكومي", renovation: "ترميم", other: "أخرى" };
export const stagesPublic = { before: "قبل البدء", during: "أثناء التنفيذ", after: "بعد الإنجاز" };
export const statusPublic = (s) => (s === "completed" ? "منتهي" : "قيد التنفيذ");
