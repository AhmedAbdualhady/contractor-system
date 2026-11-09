const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// يحوّل مسار الصورة (/api/uploads/x.jpg) إلى رابط كامل على سيرفر الـ API
export const asset = (u) => (u && u.startsWith("/") ? BASE.replace(/\/api$/, "") + u : u);

// يرسل الطلب مع الكوكي. يدعم JSON وملفات FormData، ويرجع رسالة خطأ عربية واضحة
export async function api(path, { method = "GET", body } = {}) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: "include",
      headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new Error("تعذّر الاتصال بالخادم. تأكد أن السيرفر شغال.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.details?.[0]?.message || data.message || "حدث خطأ، حاول مرة أخرى");
    err.status = res.status;
    throw err;
  }
  return data;
}
