import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ManagedRole = "admin" | "staff" | "customer";
export type AccountStatus = "active" | "disabled" | "pending";

export type ManagedAccount = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: ManagedRole;
  account_status: AccountStatus;
  is_owner: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
};

const uuid = z.object({ userId: z.string().uuid() });

/** Throws unless the caller is the Owner account. */
async function assertOwner(supabase: {
  from: (t: "profiles") => {
    select: (c: string) => {
      eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: { is_owner: boolean } | null }> };
    };
  };
}, userId: string) {
  const { data } = await supabase.from("profiles").select("is_owner").eq("id", userId).maybeSingle();
  if (!data?.is_owner) throw new Error("Only the owner can manage administrator accounts.");
}

export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ManagedAccount[]> => {
    const { supabase, userId } = context;
    await assertOwner(supabase as never, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles }, { data: roles }, authUsers] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,full_name,email,phone,account_status,is_owner,created_at"),
      supabaseAdmin.from("user_roles").select("user_id,role"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    const rank: Record<ManagedRole, number> = { admin: 3, staff: 2, customer: 1 };
    const roleMap = new Map<string, ManagedRole>();
    for (const r of roles ?? []) {
      const role = r.role as ManagedRole;
      const current = roleMap.get(r.user_id);
      if (!current || rank[role] > rank[current]) roleMap.set(r.user_id, role);
    }
    const authMap = new Map(authUsers.data.users.map((u) => [u.id, u]));

    return (profiles ?? []).map((p) => {
      const au = authMap.get(p.id);
      return {
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        phone: p.phone,
        role: roleMap.get(p.id) ?? "customer",
        account_status: (p.account_status ?? "active") as AccountStatus,
        is_owner: p.is_owner ?? false,
        created_at: p.created_at,
        last_sign_in_at: au?.last_sign_in_at ?? null,
        email_confirmed: Boolean(au?.email_confirmed_at),
      };
    });
  });

/** Owner creates a staff/admin account directly — no public admin signup exists. */
export const createStaffAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        password: z.string().min(8).max(72),
        fullName: z.string().trim().min(2).max(120),
        role: z.enum(["admin", "staff"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email = data.email.toLowerCase();
    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (created.error || !created.data.user) {
      throw new Error(created.error?.message ?? "Could not create the account.");
    }
    const id = created.data.user.id;

    await supabaseAdmin
      .from("profiles")
      .upsert({ id, email, full_name: data.fullName, account_status: "active" });
    await supabaseAdmin.from("user_roles").delete().eq("user_id", id);
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: id, role: data.role });
    if (error) throw new Error(error.message);

    return { ok: true as const, id };
  });

export const setAccountRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    uuid.extend({ role: z.enum(["admin", "staff", "customer"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: target } = await supabaseAdmin
      .from("profiles")
      .select("is_owner")
      .eq("id", data.userId)
      .maybeSingle();
    if (target?.is_owner) throw new Error("The owner's role cannot be changed.");

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setAccountStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    uuid.extend({ status: z.enum(["active", "disabled", "pending"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: target } = await supabaseAdmin
      .from("profiles")
      .select("is_owner")
      .eq("id", data.userId)
      .maybeSingle();
    if (target?.is_owner) throw new Error("The owner account cannot be disabled.");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ account_status: data.status })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);

    // Disabled accounts are signed out everywhere immediately.
    if (data.status !== "active") {
      await supabaseAdmin.auth.admin.updateUserById(data.userId, { ban_duration: "876000h" });
    } else {
      await supabaseAdmin.auth.admin.updateUserById(data.userId, { ban_duration: "none" });
    }
    return { ok: true as const };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => uuid.parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase as never, context.userId);
    if (data.userId === context.userId) throw new Error("You cannot delete your own account.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target } = await supabaseAdmin
      .from("profiles")
      .select("is_owner")
      .eq("id", data.userId)
      .maybeSingle();
    if (target?.is_owner) throw new Error("The owner account cannot be deleted.");

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Owner sets a new password for a staff member who has lost access. */
export const resetStaffPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => uuid.extend({ password: z.string().min(8).max(72) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Any signed-in user can read their own admin capabilities. */
export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("is_owner,account_status,full_name,email")
      .eq("id", context.userId)
      .maybeSingle();
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    return {
      isOwner: Boolean(profile?.is_owner),
      status: (profile?.account_status ?? "active") as AccountStatus,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
      roles: (roles ?? []).map((r) => r.role as ManagedRole),
    };
  });