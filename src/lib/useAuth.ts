import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type AppUser = {
  fullName: string;
  email: string;
  studentId?: string;
  level?: number;
  department?: string;
  avatar?: string | null;
  auth_user_id?: string | null;
};

export function useAuth() {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const s = data.session ?? null;
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        const supaUser = s.user;
        // try to load profile from studenttable
        try {
          const { data: profile } = await supabase.from("studenttable").select("*").eq("auth_user_id", supaUser.id).maybeSingle();
          if (!mounted) return;
          const mapped: AppUser = {
            fullName: (profile && (profile.full_name || profile.fullName)) ?? supaUser.user_metadata?.full_name ?? supaUser.user_metadata?.name ?? supaUser.email?.split("@")[0] ?? "User",
            email: supaUser.email ?? "",
            studentId: profile?.student_id ?? profile?.studentId ?? undefined,
            level: profile?.level ?? undefined,
            department: profile?.department ?? undefined,
            avatar: profile?.avatar ?? undefined,
            auth_user_id: supaUser.id,
          };
          setUser(mapped);
        } catch (e) {
          // fallback to basic mapping
          const mapped: AppUser = {
            fullName: supaUser.user_metadata?.full_name ?? supaUser.email?.split("@")[0] ?? "User",
            email: supaUser.email ?? "",
            auth_user_id: supaUser.id,
          };
          setUser(mapped);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    void load();

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      const sess = (s as any) ?? null;
      setSession(sess);
      if (!sess?.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      // when signed in, fetch profile
      (async () => {
        setLoading(true);
        try {
          const supaUser = sess.user;
          const { data: profile } = await supabase.from("studenttable").select("*").eq("auth_user_id", supaUser.id).maybeSingle();
          const mapped: AppUser = {
            fullName: (profile && (profile.full_name || profile.fullName)) ?? supaUser.user_metadata?.full_name ?? supaUser.user_metadata?.name ?? supaUser.email?.split("@")[0] ?? "User",
            email: supaUser.email ?? "",
            studentId: profile?.student_id ?? profile?.studentId ?? undefined,
            level: profile?.level ?? undefined,
            department: profile?.department ?? undefined,
            avatar: profile?.avatar ?? undefined,
            auth_user_id: supaUser.id,
          };
          setUser(mapped);
        } catch (e) {
          const supaUser = sess.user;
          setUser({ fullName: supaUser.user_metadata?.full_name ?? supaUser.email?.split("@")[0] ?? "User", email: supaUser.email ?? "", auth_user_id: supaUser.id });
        } finally {
          setLoading(false);
        }
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user, loading } as const;
}
