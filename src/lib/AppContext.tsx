import React, { createContext, useContext, useEffect, useMemo, useState, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./useAuth";
import type { StudentRow, TransactionRow, ReceiptRow, FeeRow, ProgrammeRow } from "./useAppData";
import { useQueryClient } from "@tanstack/react-query";

type Notification = { id: string; type: "payment" | "reminder" | "announcement"; title: string; body: string; date: string; read: boolean };
type FeeBalanceRow = {
  index_number: string;
  fee_id: string;
  paid_amount: number;
  outstanding: number;
  credit: number;
  status: string;
  updated_at?: string | null;
};

export type AppContextValue = {
  session: any | null;
  authUser: any | null;
  student: StudentRow | null;
  students: StudentRow[];
  transactions: TransactionRow[];
  receipts: ReceiptRow[];
  fees: FeeRow[];
  programme: ProgrammeRow | null;
  balances: { totalPaid: number; totalTarget: number; outstanding: number; credit: number; completion: number };
  loading: boolean;
  notifications: Notification[];
  isLoggingOut: boolean;
  signInWithGoogle: (opts?: { redirectTo?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  refreshData: () => Promise<void>;
};

export const AppCtx = createContext<AppContextValue | undefined>(undefined);

export function notifyAppDataRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("app:data-changed"));
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { session, user: authUser, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [student, setStudent] = useState<StudentRow | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [feeBalances, setFeeBalances] = useState<FeeBalanceRow[]>([]);
  const [programme, setProgramme] = useState<ProgrammeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const lastLoadedId = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const authId = useMemo(() => session?.user?.id ?? authUser?.auth_user_id ?? null, [session, authUser]);
  const authEmail = useMemo(() => session?.user?.email ?? null, [session]);

  const signOut = async () => {
    setIsLoggingOut(true);
    queryClient.clear();
    await supabase.auth.signOut();
    Object.keys(localStorage).forEach(k => k.startsWith('sb-') && localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.href = '/login';
  };

  // Core data loader, extracted so it can be called both on auth change
  // and on-demand (e.g. after an insert/upsert from another page).
  const load = useCallback(async (identity: string, currentAuthId: string | null) => {
    setLoading(true);
    try {
      const { data: s, error: studentError } = await supabase
        .from("studenttable")
        .select(`*, department!department_id(name)`)
        .eq(currentAuthId ? "auth_user_id::uuid" : "email", identity)
        .maybeSingle();

      if (studentError) {
        console.error("Student lookup error", studentError);
      }

      if (!s) {
        if (mountedRef.current) {
          setStudent(null);
          setProgramme(null);
        }
        return;
      }

      const studentRow = {
        ...s,
        full_name: session?.user?.user_metadata?.full_name ?? authUser?.fullName ?? s.full_name
      } as StudentRow;

      let programmeRow: ProgrammeRow | null = null;
      if (studentRow.prog_id != null) {
        const { data: programmeData } = await supabase
          .from("programme_table")
          .select("prog_id, prog_name, duration_years")
          .eq("prog_id", studentRow.prog_id)
          .maybeSingle();

        programmeRow = (programmeData as ProgrammeRow | null) ?? null;
      }

      const isAdmin = studentRow.role === 'admin';

      const [txRes, rcRes, fRes, stRes, fbRes] = await Promise.all([
        isAdmin ? supabase.from("transactions_table").select("*") : supabase.from("transactions_table").select("*").eq("index_number", s.index_number),
        isAdmin ? supabase.from("receipts").select("*") : supabase.from("receipts").select("*").eq("index_number", s.index_number),
        supabase.from("fees").select("*"),
        isAdmin ? supabase.from("studenttable").select("*, department!department_id(name)") : Promise.resolve({ data: [] }),
        isAdmin ? supabase.from("fee_balances").select("*") : supabase.from("fee_balances").select("*").eq("index_number", s.index_number)
      ]);

      if (mountedRef.current) {
        setStudent(studentRow);
        setProgramme(programmeRow);
        const txs = (txRes.data ?? []) as TransactionRow[];
        setTransactions(txs);

        const receiptsWithAmount = ((rcRes.data ?? []) as any[]).map((r) => {
          const matchingTx = txs.find((t) => t.id === r.transaction_id);
          return {
            ...r,
            amount_paid: matchingTx ? matchingTx.amount_paid : 0
          };
        });

        setReceipts(receiptsWithAmount as ReceiptRow[]);
        setFees((fRes.data ?? []) as FeeRow[]);
        setFeeBalances((fbRes.data ?? []) as FeeBalanceRow[]);
        setStudents((stRes.data ?? []) as StudentRow[]);
        lastLoadedId.current = identity;
      }
    } catch (e) {
      console.error("AppProvider load error", e);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [session, authUser]);

  useEffect(() => {
    mountedRef.current = true;
    if (authLoading || isLoggingOut) return;

    const identity = authId ?? authEmail;
    if (!identity) {
      setLoading(false);
      return;
    }

    if (lastLoadedId.current === identity) {
      setLoading(false);
      return;
    }

    load(identity, authId);
    return () => { mountedRef.current = false; };
  }, [authId, authEmail, authLoading, isLoggingOut, load]);

  // Public refresh function — call this after any insert/upsert/delete
  // (e.g. CSV import, manual student add) so context state stays in sync
  // with the database without requiring a full page reload.
  const refreshData = useCallback(async () => {
    const identity = authId ?? authEmail;
    if (!identity) return;
    // Force a reload even if identity hasn't changed, by bypassing the
    // lastLoadedId guard.
    await load(identity, authId);
  }, [authId, authEmail, load]);

  useEffect(() => {
    const handleRefresh = () => {
      void refreshData();
    };

    window.addEventListener("app:data-changed", handleRefresh as EventListener);
    return () => {
      window.removeEventListener("app:data-changed", handleRefresh as EventListener);
    };
  }, [refreshData]);

  const balances = useMemo(() => {
    const relevantFees = fees.filter((f) => f.department_id === student?.department_id);
    const totalTarget = relevantFees.reduce((a, b) => a + Number(b.target_amount ?? 0), 0);

    const feeBalanceTotalPaid = feeBalances.reduce((a, b) => a + Number(b.paid_amount ?? 0), 0);
    const feeBalanceOutstanding = feeBalances.reduce((a, b) => a + Number(b.outstanding ?? 0), 0);
    const feeBalanceCredit = feeBalances.reduce((a, b) => a + Number(b.credit ?? 0), 0);

    const hasFeeBalanceRows = feeBalances.length > 0;
    const totalPaid = hasFeeBalanceRows ? feeBalanceTotalPaid : transactions.reduce((a, b) => a + Number(b.amount_paid ?? 0), 0);
    const outstanding = hasFeeBalanceRows ? Math.max(0, feeBalanceOutstanding) : Math.max(0, totalTarget - totalPaid);
    const credit = hasFeeBalanceRows ? Math.max(0, feeBalanceCredit) : Math.max(0, totalPaid - outstanding);
    const completion = totalTarget > 0 ? Math.min(100, Math.round((totalPaid / totalTarget) * 100)) : 0;

    return {
      totalPaid,
      totalTarget,
      outstanding,
      credit,
      completion,
    };
  }, [transactions, fees, feeBalances, student?.department_id]);

  const value = useMemo(() => ({
    session, authUser, student, students, transactions, receipts, fees, programme, balances, loading, notifications, isLoggingOut,
    signInWithGoogle: async () => {}, signOut, markNotificationsRead: async () => {}, refreshData,
  }), [session, authUser, student, students, transactions, receipts, fees, programme, balances, loading, notifications, isLoggingOut, refreshData]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useAppContext() {
  const v = useContext(AppCtx);
  if (!v) throw new Error("useAppContext must be used within AppProvider");
  return v;
}