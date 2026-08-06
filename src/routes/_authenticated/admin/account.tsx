import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/site/PasswordField";
import { PasswordStrength } from "@/components/site/PasswordStrength";
import { getMyAccess } from "@/lib/admin-users.functions";
import {
  validateNewPassword,
  friendlyAuthError,
  normalizeEmail,
} from "@/lib/password";

export const Route = createFileRoute("/_authenticated/admin/account")({
  component: AccountPage,
});

function AccountPage() {
  const fetchAccess = useServerFn(getMyAccess);
  const access = useQuery({ queryKey: ["my-access"], queryFn: () => fetchAccess() });

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    const invalid = validateNewPassword(next, confirm);
    if (invalid) return toast.error(invalid);

    const email = access.data?.email;
    if (!email) return toast.error("Could not read your account email.");

    setBusy(true);
    // Re-authenticate with the current password before changing it.
    const reauth = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password: current,
    });
    if (reauth.error) {
      setBusy(false);
      return toast.error("Your current password is incorrect.");
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (error) return toast.error(friendlyAuthError(error.message));

    setCurrent("");
    setNext("");
    setConfirm("");
    toast.success("Password updated. Use it the next time you sign in.");
  }

  return (
    <div>
      <PageHeader
        title="My Account"
        description="Your sign-in details and password. The same login works locally and on the live site."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-bold text-primary">Account details</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium text-primary">{access.data?.fullName || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium text-primary">{access.data?.email || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Access level</dt>
              <dd className="font-medium text-primary">
                {access.data?.isOwner ? "Owner" : (access.data?.roles ?? []).join(", ") || "—"}
              </dd>
            </div>
          </dl>
        </div>

        <form
          onSubmit={handleChange}
          className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-primary">Change password</h2>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cur-pw">Current password</Label>
            <PasswordField
              id="cur-pw"
              required
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="next-pw">New password</Label>
            <PasswordField
              id="next-pw"
              required
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <PasswordStrength password={next} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="next-pw2">Confirm new password</Label>
            <PasswordField
              id="next-pw2"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}