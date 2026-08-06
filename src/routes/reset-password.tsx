import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { siteConfig } from "@/lib/site-config";
import {
  friendlyAuthError,
  validateNewPassword,
} from "@/lib/password";
import logo from "@/assets/izems-logo.png";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/site/PasswordField";
import { PasswordStrength } from "@/components/site/PasswordStrength";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Set a new password | ${siteConfig.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    // A recovery link establishes a temporary session. Confirm we have one.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setValidLink(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setValidLink(true);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    const invalid = validateNewPassword(password, confirm);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    toast.success("Password updated. You can now sign in.");
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-4 py-12">
      <Link to="/" className="mb-6 flex items-center gap-3">
        <img src={logo} alt={siteConfig.name} className="size-12 rounded-md bg-white p-1" />
        <div className="text-left">
          <p className="font-bold leading-tight text-primary">IZEMS</p>
          <p className="text-xs text-muted-foreground">Global Resources Ltd</p>
        </div>
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-center text-xl font-bold text-primary">Set a new password</h1>

        {!ready ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">Verifying link…</p>
        ) : !validLink ? (
          <>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              This reset link is invalid or has expired. Request a new one from the sign-in page.
            </p>
            <Button asChild className="mt-6 w-full bg-brand-cta hover:bg-brand-cta-hover">
              <Link to="/auth">Back to sign in</Link>
            </Button>
          </>
        ) : (
          <form onSubmit={handleUpdate} className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="rp-pass">New password</Label>
              <PasswordField
                id="rp-pass"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              <PasswordStrength password={password} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rp-confirm">Confirm new password</Label>
              <PasswordField
                id="rp-confirm"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-brand-cta hover:bg-brand-cta-hover"
            >
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
