import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Tags,
  Boxes,
  ClipboardList,
  Users,
  MessageSquare,
  Mail,
  Settings,
  ShieldCheck,
  UserCog,
  LogOut,
  Menu,
  X,
  ExternalLink,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/izems-logo.png";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const nav: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/quotes", label: "Quotes", icon: FileText },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin/users", label: "Admin Management", icon: Users },
  { to: "/admin/account", label: "My Account", icon: UserCog },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
  { to: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { to: "/admin/security", label: "Security", icon: ShieldCheck },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const navList = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {nav.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(item.to, item.exact)
              ? "bg-primary text-primary-foreground"
              : "text-foreground/75 hover:bg-secondary hover:text-primary",
          )}
        >
          <item.icon className="size-4 shrink-0" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-secondary">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <img src={logo} alt="IZEMS" className="size-9 rounded-md" />
          <div>
            <p className="text-sm font-bold text-primary">IZEMS Admin</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Dashboard
            </p>
          </div>
        </div>
        {navList}
        <div className="border-t border-border p-3">
          <a
            href="/"
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-secondary hover:text-primary"
          >
            <ExternalLink className="size-4" /> View Website
          </a>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="size-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <span className="text-sm font-bold text-primary">IZEMS Admin</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>
            {navList}
            <div className="border-t border-border p-3">
              <button
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-4" /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-6 text-primary" />
          </button>
          <span className="text-sm font-bold text-primary">IZEMS Admin</span>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-primary">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export { Button };