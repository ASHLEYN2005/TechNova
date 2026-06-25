import { useEffect, useState } from "react";

export type Transaction = {
  id: string;
  date: string;
  amount: number;
  level: 100 | 200 | 300 | 400;
  status: "Success" | "Pending" | "Failed";
  reference: string;
  method: string;
};
export const store = {
  // placeholder API kept for compatibility — prefer `useAppContext()` for live data
  get: () => ({ transactions: [] as Transaction[], notifications: [] as any[] }),
};

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

export const LEVEL_DUE = 100;
export const TOTAL_DUE = 400;

export function computeBalances(txs: Transaction[]) {
  const paidByLevel: Record<number, number> = { 100: 0, 200: 0, 300: 0, 400: 0 };
  for (const t of txs) {
    if (t.status === "Success") paidByLevel[t.level] = (paidByLevel[t.level] || 0) + t.amount;
  }
  const totalPaid = Object.values(paidByLevel).reduce((a, b) => a + b, 0);
  const outstanding = Math.max(0, TOTAL_DUE - totalPaid);
  const completion = Math.min(100, Math.round((totalPaid / TOTAL_DUE) * 100));
  return { paidByLevel, totalPaid, outstanding, completion };
}

export function formatGHS(n: number | null | undefined) {
  if (typeof n !== 'number') return "GHS 0.00";
  return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function genRef() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `PSK-${s}`;
}