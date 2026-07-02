import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, CreditCard, History, LayoutDashboard, LogOut, ReceiptText, Settings2, ShieldCheck, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

const STUDENT_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/payment", label: "Make Payment", icon: CreditCard },
  { to: "/history", label: "Payment History", icon: History },
  { to: "/receipts", label: "Receipts", icon: ReceiptText },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const ADMIN_NAV = [
  { to: "/admin", label: "Admin", icon: ShieldCheck },
  { to: "/import-students", label: "Import Students", icon: UserPlus },
  { to: "/history", label: "Payment History", icon: History },
  { to: "/receipts", label: "Receipts", icon: ReceiptText },
  { to: "/notifications", label: "Notifications", icon: Bell },
] as const;

function NavItems({ onNavigate, role }: { onNavigate?: () => void; role?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = role?.toLowerCase() === "admin";
  const navItems = isAdmin ? ADMIN_NAV : STUDENT_NAV;

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {navItems.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || (to !== "/dashboard" && to !== "/admin" && pathname.startsWith(to));

        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "border-white/20 bg-white/20 text-white shadow-sm"
                : "text-primary-foreground/80 hover:border-white/10 hover:bg-white/15 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({
  onNavigate,
  student,
  onLogout,
}: {
  onNavigate?: () => void;
  student?: any;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-primary text-primary-foreground">
      <div className="border-b border-slate-200 px-3 py-5">
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <Logo className="h-10 w-auto" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-primary">
        <NavItems onNavigate={onNavigate} role={student?.role} />
      </div>

      <div className="space-y-3 border-t border-slate-200 px-3 py-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-sm font-semibold text-[#2563EB]">
              {(student?.full_name ?? "U")
                .split(" ")
                .map((s: string) => s[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-900">{student?.full_name ?? "User"}</div>
              <div className="truncate text-xs text-slate-500">{student?.index_number ?? "Student"}</div>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 rounded-xl text-slate-600 hover:bg-white hover:text-rose-600"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4 shrink-0" /> Logout
        </Button>
      </div>
    </div>
  );
}
