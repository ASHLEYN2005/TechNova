import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { useAppContext } from "@/lib/AppContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { student, loading, signOut } = useAppContext();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
  };

  if (isLoggingOut) return <div className="min-h-screen bg-[#F9FAFB]" />;
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <aside className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-40">
        <Sidebar student={student} onLogout={handleLogout} />
      </aside>

      <div className="flex-1 flex flex-col md:pl-72 min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3 md:px-8 md:py-4">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <Sidebar student={student} onNavigate={() => setOpen(false)} onLogout={handleLogout} />
              </SheetContent>
            </Sheet>

            <div className="flex-1 min-w-0">
              {title && (
                <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 md:text-2xl">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-0.5 truncate text-xs text-slate-500 md:text-sm">{subtitle}</p>
              )}
            </div>

            {actions && <div className="shrink-0">{actions}</div>}
          </div>
        </header>

        <main className="mx-auto flex-1 w-full max-w-7xl p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}