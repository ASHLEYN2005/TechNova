import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type UiNotification = {
  id: string;
  type: "payment" | "reminder" | "announcement";
  title: string;
  body: string;
  date: string;
  read: boolean;
};

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
};

function mapRow(row: NotificationRow): UiNotification {
  return {
    id: row.id,
    type: row.type as UiNotification["type"],
    title: row.title,
    body: row.message,
    date: row.created_at,
    read: row.status === "read",
  };
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<UiNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
    } else {
      setNotifications((data ?? []).map(mapRow));
    }
    setLoading(false);
  }, [userId]);

  const markNotificationsRead = useCallback(async () => {
    if (!userId) return;

    const { error } = await supabase
      .from("notifications")
      .update({ status: "read" })
      .eq("user_id", userId)
      .neq("status", "read");

    if (error) {
      console.error("Failed to mark notifications read:", error);
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription — new notifications appear instantly
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [mapRow(payload.new as NotificationRow), ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { notifications, loading, markNotificationsRead, refetch: fetchNotifications };
}