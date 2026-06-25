import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { AuthCard } from "@/components/AuthCard";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Create Password — Compssa Dues" }] }),
  component: CreatePasswordPage,
});

function CreatePasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Password Valdiations
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    // 2. Overwrite the user's Google auth identity profile with a local password identity
    const { data, error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // 3. Mark the student record table as active using the authenticated email context
    const userEmail = data.user?.email;
    if (userEmail) {
      const { error: dbError } = await supabase
        .from("studenttable")
        .update({ is_activated: true })
        .eq("email", userEmail);

      if (dbError) {
        setError(dbError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);

    // 4. Force state replace directly into the student dashboard
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <AuthCard title="Set up your password" subtitle="Create a password to complete your student profile onboarding.">
      <form onSubmit={handlePasswordSetup} className="space-y-5">
        {error ? <p className="text-sm text-rose-600 font-medium">{error}</p> : null}

        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              className="pl-10 h-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              className="pl-10 h-11"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="h-11 w-full gap-2 shadow-elegant">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Completing onboarding…
            </>
          ) : (
            "Complete setup & load dashboard"
          )}
        </Button>
      </form>
    </AuthCard>
  );
}