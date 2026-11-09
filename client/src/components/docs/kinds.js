export const kinds = {
  quotes: {
    api: "/quotes", base: "/dashboard/quotes", title: "عروض الأسعار", one: "عرض سعر", docTitle: "عرض سعر",
    dateLabel: "صالح حتى", discount: true,
    statuses: { draft: "مسودة", sent: "مرسل", accepted: "مقبول", rejected: "مرفوض" },
    manual: ["draft", "sent", "accepted", "rejected"],
  },
  invoices: {
    api: "/invoices", base: "/dashboard/invoices", title: "الفواتير", one: "فاتورة", docTitle: "فاتورة",
    dateLabel: "تاريخ الاستحقاق", discount: false,
    statuses: { draft: "مسودة", sent: "مرسلة", partial: "مدفوعة جزئياً", paid: "مدفوعة", overdue: "متأخرة" },
    manual: ["draft", "sent", "overdue"],
  },
};

export const money = (n, cur) => `${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} ${cur === "USD" ? "$" : "ج.س"}`;
export const day = (d) => (d ? String(d).slice(0, 10) : "-");
