import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ShieldCheck, KeyRound, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  friendlyAuthError,
  validateNewPassword,
} from "@/lib/password";
import { PageHeader, Button } from "@/components/admin/AdminShell";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/site/PasswordField";
import { PasswordStrength } from "@/components/site/PasswordStrength";

export const Route = createFileRoute("/_authenticated/admin/security")({
  component: SecurityAdmin,
});

function SecurityAdmin() {
  const [email, setEmail] = useState<string | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Could not verify your account. Please sign in again.");
      return;
    }
    const invalid = validateNewPassword(next, confirm);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    if (next === current) {
      toast.error("Your new password must be different from your current one.");
      return;
    }

    setSaving(true);
    // Verify the current password by re-authenticating first.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (reauthError) {
      setSaving(false);
      toast.error("Your current password is incorrect.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    toast.success("Password changed successfully.");
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  async function handleSendReset() {
    if (!email) return;
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setSending(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    toast.success("Password reset link sent to your email.");
  }

  return (
    <div>
      <PageHeader
        title="Security"
        description="Manage your administrator password and account security."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="size-5 text-primary" />
            <h2 className="text-sm font-bold text-primary">Change Password</h2>
          </div>
          <form onSubmit={handleChange} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cur-pass">Current password</Label>
              <PasswordField
                id="cur-pass"
                required
                autoComplete="current-password"
                toggleLabel="current password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-pass">New password</Label>
              <PasswordField
                id="new-pass"
                required
                autoComplete="new-password"
                toggleLabel="new password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
              <PasswordStrength password={next} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-pass">Confirm new password</Label>
              <PasswordField
                id="confirm-pass"
                required
                autoComplete="new-password"
                toggleLabel="confirmation"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Updating…" : "Update password"}
            </Button>
          </form>
        </section>

        <div className="grid content-start gap-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Mail className="size-5 text-primary" />
              <h2 className="text-sm font-bold text-primary">Password reset email</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Send a secure reset link to{" "}
              <span className="font-medium text-foreground">{email ?? "your email"}</span>.
              Useful if you'd rather reset from a fresh link.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleSendReset}
              disabled={sending || !email}
            >
              {sending ? "Sending…" : "Send reset link"}
            </Button>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <h2 className="text-sm font-bold text-primary">Account security tips</h2>
            </div>
            <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
              <li>Use a unique password of at least 12 characters.</li>
              <li>Mix upper &amp; lower case, numbers and symbols.</li>
              <li>Never reuse your password on other sites.</li>
              <li>Sign out on shared or public devices.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
