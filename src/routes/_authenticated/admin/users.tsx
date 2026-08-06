import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ShieldCheck, Trash2, KeyRound, UserPlus, Ban, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/site/PasswordField";
import { validateNewPassword } from "@/lib/password";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listAccounts,
  createStaffAccount,
  setAccountRole,
  setAccountStatus,
  deleteAccount,
  resetStaffPassword,
  getMyAccess,
  type ManagedAccount,
  type ManagedRole,
} from "@/lib/admin-users.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersAdmin,
});

function errText(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong.";
}

function UsersAdmin() {
  const qc = useQueryClient();
  const fetchAccess = useServerFn(getMyAccess);
  const fetchAccounts = useServerFn(listAccounts);
  const createFn = useServerFn(createStaffAccount);
  const roleFn = useServerFn(setAccountRole);
  const statusFn = useServerFn(setAccountStatus);
  const deleteFn = useServerFn(deleteAccount);
  const resetFn = useServerFn(resetStaffPassword);

  const access = useQuery({ queryKey: ["my-access"], queryFn: () => fetchAccess() });
  const isOwner = access.data?.isOwner ?? false;

  const accounts = useQuery({
    queryKey: ["managed-accounts"],
    queryFn: () => fetchAccounts(),
    enabled: isOwner,
  });

  const [form, setForm] = useState({
    email: "",
    fullName: "",
    password: "",
    confirm: "",
    role: "staff" as "admin" | "staff",
  });
  const [busy, setBusy] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["managed-accounts"] });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const invalid = validateNewPassword(form.password, form.confirm);
    if (invalid) return toast.error(invalid);
    setBusy(true);
    try {
      await createFn({
        data: {
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          role: form.role,
        },
      });
      toast.success(`${form.email} can now sign in as ${form.role}.`);
      setForm({ email: "", fullName: "", password: "", confirm: "", role: "staff" });
      refresh();
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(u: ManagedAccount, role: ManagedRole) {
    try {
      await roleFn({ data: { userId: u.id, role } });
      toast.success(`${u.email ?? "Account"} is now ${role}.`);
      refresh();
    } catch (e) {
      toast.error(errText(e));
    }
  }

  async function toggleStatus(u: ManagedAccount) {
    const status = u.account_status === "active" ? "disabled" : "active";
    try {
      await statusFn({ data: { userId: u.id, status } });
      toast.success(status === "active" ? "Account re-enabled." : "Account disabled.");
      refresh();
    } catch (e) {
      toast.error(errText(e));
    }
  }

  async function removeAccount(u: ManagedAccount) {
    if (!window.confirm(`Permanently delete ${u.email}? This cannot be undone.`)) return;
    try {
      await deleteFn({ data: { userId: u.id } });
      toast.success("Account deleted.");
      refresh();
    } catch (e) {
      toast.error(errText(e));
    }
  }

  async function resetPassword(u: ManagedAccount) {
    const pw = window.prompt(`New password for ${u.email} (min 8 chars, letters + numbers):`);
    if (!pw) return;
    const invalid = validateNewPassword(pw, pw);
    if (invalid) return toast.error(invalid);
    try {
      await resetFn({ data: { userId: u.id, password: pw } });
      toast.success("Password updated. Share it securely with the staff member.");
    } catch (e) {
      toast.error(errText(e));
    }
  }

  if (access.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!isOwner) {
    return (
      <div>
        <PageHeader title="Admin Management" description="Owner-only area." />
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Only the business owner account can create, disable, or remove
            administrator and staff accounts.
          </p>
        </div>
      </div>
    );
  }

  const staff = (accounts.data ?? []).filter((a) => a.role !== "customer");
  const customers = (accounts.data ?? []).filter((a) => a.role === "customer");

  return (
    <div>
      <PageHeader
        title="Admin Management"
        description="Create staff logins, change roles, disable access, and remove accounts. Nobody can grant themselves admin access."
      />

      <form
        onSubmit={handleCreate}
        className="mb-8 grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
      >
        <div className="flex items-center gap-2">
          <UserPlus className="size-4 text-primary" />
          <h2 className="text-sm font-bold text-primary">Create a staff / admin account</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="new-name">Full name</Label>
            <Input
              id="new-name"
              required
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="Jane Doe"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-email">Email</Label>
            <Input
              id="new-email"
              type="email"
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="staff@izems.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-pw">Password</Label>
            <PasswordField
              id="new-pw"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-pw2">Confirm password</Label>
            <PasswordField
              id="new-pw2"
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm((f) => ({ ...f, role: v as "admin" | "staff" }))}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={busy} className="w-full sm:w-auto">
              {busy ? "Creating…" : "Create account"}
            </Button>
          </div>
        </div>
      </form>

      <AccountTable
        title="Administrators & staff"
        rows={staff}
        loading={accounts.isLoading}
        onRole={changeRole}
        onToggle={toggleStatus}
        onDelete={removeAccount}
        onReset={resetPassword}
      />
      <div className="h-8" />
      <AccountTable
        title="Customer accounts"
        rows={customers}
        loading={accounts.isLoading}
        onRole={changeRole}
        onToggle={toggleStatus}
        onDelete={removeAccount}
        onReset={resetPassword}
      />
    </div>
  );
}

function AccountTable({
  title,
  rows,
  loading,
  onRole,
  onToggle,
  onDelete,
  onReset,
}: {
  title: string;
  rows: ManagedAccount[];
  loading: boolean;
  onRole: (u: ManagedAccount, role: ManagedRole) => void;
  onToggle: (u: ManagedAccount) => void;
  onDelete: (u: ManagedAccount) => void;
  onReset: (u: ManagedAccount) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-semibold">Name</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Role</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Last sign-in</th>
              <th className="p-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No accounts yet.
                </td>
              </tr>
            )}
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium text-primary">
                  <span className="flex items-center gap-2">
                    {u.full_name || "—"}
                    {u.is_owner && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        Owner
                      </span>
                    )}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">{u.email || "—"}</td>
                <td className="p-3">
                  {u.is_owner ? (
                    <span className="text-muted-foreground">Owner</span>
                  ) : (
                    <Select value={u.role} onValueChange={(v) => onRole(u, v as ManagedRole)}>
                      <SelectTrigger className="h-9 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </td>
                <td className="p-3">
                  <span
                    className={
                      u.account_status === "active"
                        ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                        : "rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive"
                    }
                  >
                    {u.account_status}
                  </span>
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {u.last_sign_in_at
                    ? new Date(u.last_sign_in_at).toLocaleString("en-NG")
                    : "Never"}
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReset(u)}
                      disabled={u.is_owner}
                      title="Set a new password"
                    >
                      <KeyRound className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onToggle(u)}
                      disabled={u.is_owner}
                      title={u.account_status === "active" ? "Disable access" : "Re-enable access"}
                    >
                      {u.account_status === "active" ? (
                        <Ban className="size-4" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => onDelete(u)}
                      disabled={u.is_owner}
                      title="Delete account"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}