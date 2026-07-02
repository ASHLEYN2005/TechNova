import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { formatGHS, genRef } from "@/lib/store";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { useAppData } from "@/lib/useAppData";
import { useStudentFinance } from "@/lib/useStudentFinance";
import { notifyAppDataRefresh } from "@/lib/AppContext";

const FEE_RATE = 0.015;
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

declare global {
  interface Window {
    PaystackPop?: any;
  }
}

export const Route = createFileRoute("/payment")({
  head: () => ({ meta: [{ title: "Make Payment — Compssa Dues" }] }),
  component: PaymentPage,
});

function PaymentPage() {
  const navigate = useNavigate();
  const { student, fees, transactions, balances, programmeName, programmeDurationYears } = useAppData();
  const { user: authUser, session } = useAuth();

  const authUserId = authUser?.auth_user_id ?? session?.user?.id ?? null;
  const displayOutstanding = Math.max(0, Math.round(balances.outstanding ?? 0));
  const isFullyPaid = displayOutstanding === 0;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"momo" | "card">("momo");

  const { financeRows, duration_years } = useStudentFinance();

  const resolvedDurationYears = duration_years ?? (Number.isFinite(programmeDurationYears) && (programmeDurationYears ?? 0) > 0
    ? Number(programmeDurationYears)
    : Math.max(1, Math.ceil((student?.current_level ?? 0) / 100) || 4));

  type YearCard = {
    id: string;
    fee_name: string;
    yearLabel: string;
    academic_level: number;
    isPaid: boolean;
    targetAmount: number;
    paidAmount: number;
    status: "Paid" | "Pending";
  };

 const yearCards = useMemo<YearCard[]>(() => {
  if (financeRows.length > 0) {
    return financeRows.map((row) => {
      return {
        id: row.fee_id, 
        fee_name: row.fee_name ?? `Annual dues ${row.Academic_level / 100}`,
        yearLabel: `Year ${row.Academic_level / 100}`,
        academic_level: Number(row.Academic_level),
        isPaid: row.status === "Paid",
        targetAmount: Number(row.target_amount ?? 0),
        paidAmount: Number(row.paid_amount ?? 0),
        status: row.status,
      };
    });
  }

    return Array.from({ length: Math.max(1, resolvedDurationYears) }, (_, index) => {
      const fee = fees[index] ?? null;
      return {
        id: fee?.id ?? `year-${index + 1}`,
        fee_name: fee?.fee_name ?? `Annual dues ${index + 1}`,
        yearLabel: `Year ${index + 1}`,
        academic_level: (index + 1) * 100,
        isPaid: Boolean(fee && transactions.some((t) => t.fee_id === fee.id && t.status?.toLowerCase() === "success")),
        targetAmount: Number(fee?.target_amount ?? 0),
        paidAmount: 0,
        status: "Pending",
      };
    });
  }, [fees, financeRows, resolvedDurationYears, transactions]);

  const selectedFee = useMemo<YearCard | null>(() => {
    if (!yearCards.length) return null;
    return yearCards.find((fee) => fee.id === selectedFeeId) ?? yearCards[0];
  }, [yearCards, selectedFeeId]);

  const amount = selectedFee ? selectedFee.targetAmount : 0;
  const fee = Math.round(amount * FEE_RATE * 100) / 100;
  const total = Math.round((amount + fee) * 100) / 100;
  const programmeYears = Math.max(1, (programmeDurationYears ?? yearCards.length) || 4);

  const pay = async (feeToPay?: typeof selectedFee | null) => {
    const feeSelection = feeToPay ?? selectedFee;
    if (!feeSelection) {
      setError("No dues amount found for your department. Please contact admin.");
      return;
    }

    setError(null);
    setLoading(true);
    setSelectedFeeId(feeSelection.id);

    const amountToPay = Number(feeSelection.targetAmount ?? 0);
    const feeAmount = Math.round(amountToPay * FEE_RATE * 100) / 100;
    const totalAmount = Math.round((amountToPay + feeAmount) * 100) / 100;

    const handleSuccess = async (res: { reference: string }) => {
      try {
        const { error } = await supabase.functions.invoke("verify-paystack", {
          body: {
            reference: res.reference,
            amount: totalAmount,
            academic_level: feeSelection.academic_level,
            index_number: student?.index_number,
            auth_user_id: authUserId,
            fee_id: feeSelection.id,
          },
        });

        if (error) {
          setError("Payment succeeded, but we couldn't save it.");
          setLoading(false);
          return;
        }

        notifyAppDataRefresh();
        navigate({ to: "/payment-success", search: { ref: res.reference, amount: totalAmount } });
      } catch (err: any) {
        setError("Payment succeeded, but we couldn't save it.");
        setLoading(false);
      }
    };

    try {
      if (!window.PaystackPop) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://js.paystack.co/v1/inline.js";
          script.onload = () => resolve();
          script.onerror = () => reject();
          document.body.appendChild(script);
        });
      }

      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: authUser?.email || "test@example.com",
        amount: Math.round(totalAmount * 100),
        currency: "GHS",
        ref: genRef(),
        callback: (res: any) => handleSuccess(res),
        onClose: () => {
          setLoading(false);
        },
      });

      handler.openIframe();
    } catch (err) {
      setError("Failed to open payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AppShell title="Make a payment" subtitle="Choose the year you want to settle and continue with a secure checkout.">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#2563EB]">Secure checkout</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Pay your dues in a professional flow.</h2>
            <p className="mt-2 text-sm text-slate-500">Each academic year card below can be paid instantly using your preferred method.</p>
          </div>
          <div className="rounded-full border border-slate-200 bg-[#F9FAFB] px-3 py-1 text-sm font-medium text-slate-600">
            Outstanding {formatGHS(displayOutstanding)}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Academic years</h3>
                <p className="text-sm text-slate-500">Use a single tap to settle each year.</p>
              </div>
              <div className="rounded-full bg-[#F3F4F6] px-3 py-1 text-sm font-medium text-slate-600">
                {yearCards.length} options
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {yearCards.map((fee) => (
                <div key={fee.id} className={`rounded-2xl border p-4 transition-all ${selectedFee?.id === fee.id ? "border-[#2563EB] bg-[#F8FAFF] shadow-sm" : "border-slate-200 bg-[#F9FAFB]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{fee.yearLabel}</p>
                      <p className="mt-1 text-sm text-slate-500">{fee.fee_name}</p>
                    </div>
                    <div className={`rounded-full px-2.5 py-1 text-xs font-semibold ${fee.status === "Paid" ? "bg-emerald-50 text-emerald-600" : "bg-[#EEF2FF] text-[#2563EB]"}`}>
                      {fee.status}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-xl font-semibold text-slate-900">{formatGHS(Number(fee.targetAmount ?? 0))}</p>
                      <p className="text-sm text-slate-500">Paid {formatGHS(Number(fee.paidAmount ?? 0))}</p>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <Button
                        type="button"
                        onClick={() => pay(fee)}
                        disabled={loading || fee.status === "Paid"}
                        className="rounded-full bg-[#2563EB] px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {loading && selectedFeeId === fee.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {fee.status === "Paid" ? <CheckCircle2 className="mr-2 h-4 w-4" /> : null}
                        {fee.status === "Paid" ? "Paid" : "Pay now"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Payment summary</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-[#F9FAFB] px-3 py-2">
                <span className="text-slate-500">Programme Type</span>
                <span className="font-semibold text-slate-900">{programmeName ?? student?.department?.name ?? "Not assigned"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#F9FAFB] px-3 py-2">
                <span className="text-slate-500">Duration</span>
                <span className="font-semibold text-slate-900">{programmeYears} years</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#F9FAFB] px-3 py-2">
                <span className="text-slate-500">Selected dues</span>
                <span className="font-semibold text-slate-900">{formatGHS(amount)}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#F9FAFB] px-3 py-2">
                <span className="text-slate-500">Processing fee</span>
                <span className="font-semibold text-slate-900">{formatGHS(fee)}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3">
                <span className="font-semibold text-slate-900">Total due</span>
                <span className="font-semibold text-[#2563EB]">{formatGHS(total)}</span>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-900">Payment method</p>
              <div className="mt-3 space-y-3">
                {[
                  { id: "momo", label: "Mobile Money", subtitle: "Instant transfer", icon: CreditCard },
                  { id: "card", label: "Card", subtitle: "Visa or Mastercard", icon: CreditCard },
                ].map((method) => {
                  const active = selectedMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethod(method.id as "momo" | "card")}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-all ${active ? "border-[#2563EB] bg-[#F8FAFF]" : "border-slate-200 bg-white"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl p-2 ${active ? "bg-[#EEF2FF] text-[#2563EB]" : "bg-[#F9FAFB] text-slate-500"}`}>
                          <method.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{method.label}</div>
                          <div className="text-sm text-slate-500">{method.subtitle}</div>
                        </div>
                      </div>
                      <div className={`h-4 w-4 rounded-full border ${active ? "border-[#2563EB] bg-[#2563EB]" : "border-slate-300"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
              <ShieldCheck className="h-4 w-4" /> Your payment is secured with Paystack.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}