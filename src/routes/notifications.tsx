import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/lib/AppContext";
import { Bell, CheckCircle2, Megaphone, Clock } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Compssa Dues" }] }),
  component: NotificationsPage,
});

const ICON = {
  payment: { i: CheckCircle2, tone: "bg-success/15 text-success" },
  reminder: { i: Clock, tone: "bg-warning/15 text-warning" },
  announcement: { i: Megaphone, tone: "bg-primary/10 text-primary" },
} as const;

function NotificationsPage() {
  const { notifications: list, markNotificationsRead } = useAppContext();
  return (
    <AppShell title="Notifications" subtitle="Reminders, receipts, and department announcements." actions={
      <Button variant="outline" size="sm" onClick={() => void markNotificationsRead()}>Mark all as read</Button>
    }>
      <div className="rounded-2xl border border-border bg-card shadow-soft divide-y divide-border">
        {list.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <Bell className="mx-auto h-8 w-8 mb-3 opacity-50" />
            No notifications yet.
          </div>
        )}
        {list.map((n) => {
          const Icon = ICON[n.type].i;
          return (
            <div key={n.id} className="flex items-start gap-4 p-5">
              <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ICON[n.type].tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{n.title}</div>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                <div className="mt-1 text-xs text-muted-foreground">{new Date(n.date).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}