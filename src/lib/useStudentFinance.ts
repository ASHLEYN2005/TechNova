import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./useAuth";

export type StudentFinanceRow = {
  Academic_level: number;
  target_amount: number;
  paid_amount: number;
  status: "Paid" | "Pending";
  fee_id?: string;
  fee_name?: string;
};

export type StudentFinanceResult = {
  financeRows: StudentFinanceRow[];
  duration_years: number | null;
  loading: boolean;
  error: string | null;
};

export async function fetchStudentFinanceData(authUserId: string): Promise<StudentFinanceResult> {
  try {
    const { data: student, error: studentError } = await supabase
      .from("studenttable")
      .select("id, index_number, department_id, prog_id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (studentError) throw studentError;
    if (!student || !student.prog_id || !student.index_number) {
      return { financeRows: [], duration_years: null, loading: false, error: null };
    }

    const [{ data: programmeData, error: programmeError }, { data: feesData, error: feesError }, { data: txData, error: txError }] =
      await Promise.all([
        supabase.from("programme_table").select("prog_id, duration_years").eq("prog_id", student.prog_id).maybeSingle(),
        supabase
          .from("fees")
          .select("id, fee_name, target_amount, Academic_level")
          .eq("prog_id", student.prog_id)
          .eq("department_id", student.department_id),
        supabase
          .from("transactions_table")
          .select("academic_level, amount_paid")
          .eq("index_number", student.index_number),
      ]);

    if (programmeError) throw programmeError;
    if (feesError) throw feesError;
    if (txError) throw txError;

    const duration_years = programmeData?.duration_years ?? null;
    const resolvedDurationYears = Math.max(1, duration_years ?? ((feesData?.length ?? 0) || 4));

    const paidByLevel = (txData ?? []).reduce<Record<number, number>>((acc, transaction: any) => {
      const level = Number(transaction.academic_level ?? 0);
      if (!level) return acc;
      const amount = Number(transaction.amount_paid ?? 0);
      acc[level] = (acc[level] ?? 0) + amount;
      return acc;
    }, {});

    const feeMap = (feesData ?? []).reduce<Record<number, { id: string; fee_name?: string; target_amount: number }>>((acc, fee: any) => {
      const level = Number(fee.Academic_level ?? 0);
      if (!level) return acc;
      acc[level] = {
        id: fee.id?.toString() ?? `${level}`,
        fee_name: fee.fee_name,
        target_amount: Number(fee.target_amount ?? 0),
      };
      return acc;
    }, {});

    const financeRows: StudentFinanceRow[] = Array.from({ length: resolvedDurationYears }, (_, index) => {
      const academicLevel = (index + 1) * 100;
      const feeInfo = feeMap[academicLevel];
      const target_amount = feeInfo?.target_amount ?? 0;
      const paid_amount = Number(paidByLevel[academicLevel] ?? 0);
      const status: StudentFinanceRow["status"] = paid_amount >= target_amount ? "Paid" : "Pending";
      return {
        Academic_level: academicLevel,
        target_amount,
        paid_amount,
        status,
        fee_id: feeInfo?.id,
        fee_name: feeInfo?.fee_name,
      };
    });

    return { financeRows, duration_years, loading: false, error: null };
  } catch (error: any) {
    console.error("fetchStudentFinanceData error", error);
    return { financeRows: [], duration_years: null, loading: false, error: error?.message ?? "Unable to load student finance data." };
  }
}

export function useStudentFinance() {
  const { session, user, loading: authLoading } = useAuth();
  const [financeRows, setFinanceRows] = useState<StudentFinanceRow[]>([]);
  const [duration_years, setDurationYears] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authUserId = session?.user?.id ?? user?.auth_user_id ?? null;

  const loadFinance = async () => {
    if (!authUserId) {
      setFinanceRows([]);
      setDurationYears(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await fetchStudentFinanceData(authUserId);
    setFinanceRows(result.financeRows);
    setDurationYears(result.duration_years);
    setError(result.error);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    void loadFinance();
  }, [authUserId, authLoading]);

  useEffect(() => {
    const handleReload = () => {
      void loadFinance();
    };

    window.addEventListener("app:data-changed", handleReload);
    return () => window.removeEventListener("app:data-changed", handleReload);
  }, [authUserId]);

  return useMemo(
    () => ({ financeRows, duration_years, loading, error }),
    [financeRows, duration_years, loading, error],
  );
}
