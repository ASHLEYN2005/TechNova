import { useAppContext } from "./AppContext";
import type { FeeBalanceRow } from "./AppContext";

// --- Types ---
export type StudentRow = {
  id: string;
  email: string;
  full_name: string;
  current_level: number;
  department_id: number;
  department?: { name: string };
  outstanding_balance: number;
  is_activated: boolean;
  role: string;
  index_number?: string;
  prog_id?: number | null;
  auth_user_id: string;
  created_at: string;
};

export type TransactionRow = {
  id: string;
  amount_paid: number;
  paystack_reference: string;
  status: string;
  source_account: string;
  fee_id: string;
  index_number: string;
  created_at: string;
  transactions?: { amount_paid: number } | null;
};

export type ReceiptRow = {
  id: string;
  transaction_id: string;
  index_number: string;
  beneficiary_account: string;
  level: number;
  department_name: string;
  provider: string;
  narration: string;
  issued_at: string;
  amount_paid?: number;
};

export type FeeRow = {
  id: string;
  fee_name: string;
  target_amount: number;
  department_id: number;
  prog_id?: number | null;
  Academic_level: number;
};

export type ProgrammeRow = {
  prog_id: number;
  prog_name: string;
  duration_years: number;
};

export type YearCard = {
  id: string;
  fee_name: string;
  yearLabel: string;
  academic_level: number;
  targetAmount: number;
  paidAmount: number;
  status: "Paid" | "Pending";
};

// --- Hook ---
export function useAppData() {
  const ctx = useAppContext();

  const totalPaid = ctx.balances?.totalPaid ?? 0;
  const outstanding = ctx.balances?.outstanding ?? 0;
  const credit = ctx.balances?.credit ?? 0;

  // Single source of truth for "which fee applies to this student, for
  // which academic year, and what's the paid/outstanding status" — built
  // from context data that's already loaded once per session, instead of
  // re-querying Supabase separately on every page that needs it.
  const relevantFees = ((ctx.fees || []) as FeeRow[])
    .filter(
      (f) =>
        f.department_id === ctx.student?.department_id &&
        f.prog_id === ctx.student?.prog_id
    )
    .sort((a, b) => Number(a.Academic_level ?? 0) - Number(b.Academic_level ?? 0));

  const balanceByFeeId = ((ctx.feeBalances || []) as FeeBalanceRow[]).reduce<Record<string, FeeBalanceRow>>(
    (acc, row) => {
      acc[row.fee_id] = row;
      return acc;
    },
    {}
  );

  const yearCards: YearCard[] = relevantFees.map((fee) => {
    const balance = balanceByFeeId[fee.id];
    const targetAmount = Number(fee.target_amount ?? 0);
    const paidAmount = Number(balance?.paid_amount ?? 0);
    const status: YearCard["status"] =
      (balance?.status as YearCard["status"]) ?? (targetAmount > 0 && paidAmount >= targetAmount ? "Paid" : "Pending");

    return {
      id: fee.id,
      fee_name: fee.fee_name,
      yearLabel: `Year ${Number(fee.Academic_level ?? 0) / 100}`,
      academic_level: Number(fee.Academic_level ?? 0),
      targetAmount,
      paidAmount,
      status,
    };
  });

  return {
    student: ctx.student as StudentRow | null,
    departmentName: ctx.student?.department?.name ?? "Not assigned",
    transactions: (ctx.transactions || []) as TransactionRow[],
    receipts: (ctx.receipts || []) as ReceiptRow[],
    fees: (ctx.fees || []) as FeeRow[],
    feeBalances: (ctx.feeBalances || []) as FeeBalanceRow[],
    yearCards,
    balances: {
      totalPaid,
      outstanding,
      credit,
      completion: ctx.balances?.completion ?? 0,
    },
    programme: ctx.programme as ProgrammeRow | null,
    programmeName: ctx.programme?.prog_name ?? "Not assigned",
    programmeDurationYears: ctx.programme?.duration_years ?? null,
    loading: ctx.loading,
  } as const;
}