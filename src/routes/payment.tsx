import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { formatGHS, genRef } from "@/lib/store";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { useAppData } from "@/lib/useAppData";

const FEE_RATE = 0.015;
const DUES_AMOUNT = 100;
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
  const { student, balances, fees } = useAppData();
  const { user: authUser, session } = useAuth();
  const b = balances;
  const authUserId = authUser?.auth_user_id ?? session?.user?.id ?? null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = DUES_AMOUNT;
  const fee = Math.round(amount * FEE_RATE * 100) / 100;
  const total = Math.round((amount + fee) * 100) / 100;

  const pay = async () => {
    setError(null);
    setLoading(true);

    const handleSuccess = async (res: { reference: string }) => {
      try {
        const { error } = await supabase.functions.invoke("verify-paystack", {
          body: {
            reference: res.reference,
            amount: total,
            fee_id: fees?.[0]?.id,
            index_number: student?.index_number,
            auth_user_id: authUserId,
          },
        });

        if (error) throw error;
        navigate({ to: "/payment-success", search: { ref: res.reference, amount: total } });
      } catch (err) {
        console.error("Database save failed:", err);
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
        amount: Math.round(total * 100),
        currency: "GHS",
        ref: genRef(),
        callback: (res: any) => handleSuccess(res),
        onClose: () => {
          setLoading(false);
        },
      });

      handler.openIframe();
    } catch (err) {
      console.error("FATAL ERROR:", err);
      setError("Failed to open payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AppShell title="Make a payment" subtitle="Pay your departmental dues of GHS 100.">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary to-accent p-6 text-primary-foreground shadow-elegant">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest opacity-80">Outstanding balance</div>
                <div className="mt-2 text-4xl font-bold">{formatGHS(b.outstanding)}</div>
              </div>
              <div className="hidden md:flex h-20 w-20 rounded-2xl bg-white/10 backdrop-blur items-center justify-center">
                <CreditCard className="h-9 w-9" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-semibold">Payment details</h2>
            <div className="mt-4">
              <div className="rounded-xl border-2 border-primary bg-primary/5 ring-2 ring-primary/20 p-5">
                <div className="font-semibold text-foreground">Departmental Dues</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Fixed annual departmental dues — GHS 100 per level
                </div>
                <div className="mt-4 text-3xl font-bold text-foreground">{formatGHS(DUES_AMOUNT)}</div>
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-6 shadow-soft h-fit">
          <h2 className="text-lg font-semibold">Payment summary</h2>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dues amount</span>
              <span className="font-medium">{formatGHS(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Processing fee (1.5%)</span>
              <span className="font-medium">{formatGHS(fee)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>{formatGHS(total)}</span>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

          <Button
            onClick={pay}
            disabled={loading}
            className="mt-6 h-14 w-full gap-2 text-base font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Processing…
              </>
            ) : (
              <>Pay {formatGHS(total)} with Paystack</>
            )}
          </Button>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Secured by Paystack • PCI-DSS
          </div>
        </aside>
      </div>
    </AppShell>
  );
}