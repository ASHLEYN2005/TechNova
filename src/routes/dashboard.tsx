import { createFileRoute, Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { formatGHS } from "@/lib/store";
import { useAppData } from "@/lib/useAppData";
import { useStudentFinance } from "@/lib/useStudentFinance";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Bell, CheckCircle2, CreditCard, GraduationCap, Wallet } from "lucide-react";
import { useAppContext } from "@/lib/AppContext";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Compssa Dues Payment System" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { student, transactions, balances, fees, loading, programmeName, programmeDurationYears } = useAppData();
  const { notifications } = useAppContext();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F9FAFB]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563EB] border-t-transparent" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">Retrieving financial records...</p>
        </div>
      </div>
    );
  }

  const txs = transactions.map((t) => {
    let normalizedStatus: "Success" | "Pending" | "Failed" = "Pending";
    const lowerStatus = t.status?.toLowerCase();
    if (lowerStatus === "success") normalizedStatus = "Success";
    if (lowerStatus === "failed") normalizedStatus = "Failed";

    return {
      id: t.id,
      date: t.created_at ?? new Date().toISOString(),
      amount: Number(t.amount_paid || 0),
      level: student?.current_level ?? 200,
      status: normalizedStatus,
      reference: t.paystack_reference,
    };
  });

  const b = balances;
  const displayOutstanding = Math.max(0, Math.round(b.outstanding ?? 0));
  const creditBalance = Math.max(0, Math.round(b.credit ?? 0));
  const isFullyPaid = displayOutstanding === 0;

  const { financeRows, duration_years } = useStudentFinance();

  const resolvedDurationYears = duration_years ?? (Number.isFinite(programmeDurationYears) && (programmeDurationYears ?? 0) > 0
    ? Number(programmeDurationYears)
    : Math.max(1, Math.ceil((student?.current_level ?? 0) / 100) || 4));

  const dynamicYearCards = financeRows.length > 0
    ? financeRows.map((row) => ({
        id: `${row.Academic_level}`,
        yearLabel: `Year ${row.Academic_level / 100}`,
        academic_level: row.Academic_level,
        target_amount: row.target_amount,
        paid_amount: row.paid_amount,
        status: row.status,
      }))
    : Array.from({ length: Math.max(1, resolvedDurationYears) }, (_, index) => ({
        id: `year-${index + 1}`,
        yearLabel: `Year ${index + 1}`,
        academic_level: (index + 1) * 100,
        target_amount: Number(fees[index]?.target_amount ?? 0),
        paid_amount: 0,
        status: "Pending" as const,
      }));

  const paidYears = dynamicYearCards.filter((year) => year.status === "Paid").length;
  const totalYears = dynamicYearCards.length;
  const completionPercent = Math.min(100, Math.round((paidYears / totalYears) * 100));
  const ringStyle = {
    background: `conic-gradient(#2563EB 0 ${completionPercent * 3.6}deg, #E5E7EB ${completionPercent * 3.6}deg 360deg)`,
  };

  return (
    <AppShell
      title={`Welcome back, ${student?.full_name?.split(" ")[0] ?? "User"}`}
      subtitle="Here is a polished view of your current dues and next steps."
      actions={
        <Link to="/payment">
          <Button className="gap-2 rounded-full bg-[#2563EB] px-4 text-xs shadow-sm md:text-sm">
            <Wallet className="h-4 w-4" />
            Pay now
          </Button>
        </Link>
      }
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#2563EB]">Student finance overview</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              You’re on track for a smooth academic year.
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Use the quick actions below to stay ahead of dues and keep your records updated.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-[#F9FAFB] px-3 py-1 text-sm font-medium text-slate-600">
            Level {student?.current_level ?? "N/A"}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Outstanding"
          value={formatGHS(displayOutstanding)}
          sub={isFullyPaid ? "All cleared" : "Across remaining years"}
          icon={<Wallet className="h-5 w-5" />}
          tone={isFullyPaid ? "success" : "primary"}
        />
        <StatCard
          label="Credit"
          value={formatGHS(creditBalance)}
          sub="Applied toward your account"
          icon={<CreditCard className="h-5 w-5" />}
          tone="accent"
        />
        <StatCard
          label="Level"
          value={`Level ${student?.current_level ?? "N/A"}`}
          sub="Current academic standing"
          icon={<GraduationCap className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label="Total paid"
          value={formatGHS(b.totalPaid)}
          sub={`${txs.filter((t) => t.status === "Success").length} completed payments`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="success"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Yearly progress</h3>
              <p className="text-sm text-slate-500">A clear summary of your years 1 through 4.</p>
            </div>
            <div className="rounded-full bg-[#F3F4F6] px-3 py-1 text-sm font-medium text-slate-600">
              {completionPercent}% complete
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex justify-center">
              <div className="flex h-56 w-56 items-center justify-center rounded-full p-4" style={ringStyle}>
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#F9FAFB]">
                  <span className="text-4xl font-semibold text-slate-900">{completionPercent}%</span>
                  <span className="mt-2 text-sm text-slate-500">Overall completion</span>
                  <span className="mt-1 text-sm font-medium text-[#2563EB]">{paidYears} / {totalYears} years paid</span>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              {dynamicYearCards.map((year) => (
                <div key={year.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-[#F9FAFB] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{year.yearLabel}</p>
                    <p className="text-sm text-slate-500">{formatGHS(year.paid_amount)} / {formatGHS(year.target_amount)}</p>
                  </div>
                  <div className={`rounded-full px-2.5 py-1 text-xs font-semibold ${year.status === "Paid" ? "bg-emerald-50 text-emerald-600" : "bg-[#EEF2FF] text-[#2563EB]"}`}>
                    {year.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Quick actions</h3>
                <p className="text-sm text-slate-500">Jump straight into the next payment task.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <Link to="/payment">
                <Button className="h-11 w-full justify-between rounded-2xl bg-[#2563EB] text-sm font-semibold">
                  Make a payment <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/receipts">
                <Button variant="outline" className="h-11 w-full justify-between rounded-2xl border-slate-200 text-sm font-semibold text-slate-700">
                  Download receipts <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/history">
                <Button variant="outline" className="h-11 w-full justify-between rounded-2xl border-slate-200 text-sm font-semibold text-slate-700">
                  View history <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#2563EB]" />
              <h3 className="text-lg font-semibold text-slate-900">Recent notifications</h3>
            </div>
            <div className="mt-4 space-y-3">
              {notifications.slice(0, 3).length === 0 && (
                <p className="text-sm text-slate-500">No new updates right now.</p>
              )}
              {notifications.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-[#F9FAFB] p-3">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export function StatusPill({ status }: { status: string }) {
  const normalized = status?.toLowerCase();
  const tone = normalized === "success" ? "success" : normalized === "failed" ? "warning" : "muted";
  const classes =
    tone === "success"
      ? "bg-emerald-50 text-emerald-600"
      : tone === "warning"
      ? "bg-amber-50 text-amber-600"
      : "bg-slate-100 text-slate-600";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>{normalized === "success" ? "Success" : normalized === "failed" ? "Failed" : "Pending"}</span>;
}

function StatCard({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub: string;
  icon: ReactNode;
  tone: "primary" | "success" | "accent" | "warning";
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
          <div className="mt-3 text-2xl font-semibold text-slate-900">{value}</div>
          <p className="mt-2 text-sm text-slate-500">{sub}</p>
        </div>
        <div className={`shrink-0 rounded-2xl p-3 text-white ${tone === "primary" ? "bg-[#2563EB]" : tone === "success" ? "bg-emerald-500" : tone === "accent" ? "bg-[#8B5CF6]" : "bg-amber-500"}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}