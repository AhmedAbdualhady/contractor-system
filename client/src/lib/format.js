export const money = (n, cur = "SDG") =>
  `${Number(n || 0).toLocaleString("en-US")} ${cur === "USD" ? "$" : "ج.س"}`;
