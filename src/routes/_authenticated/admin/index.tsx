import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Package,
  ClipboardList,
  MessageSquare,
  Mail,
  AlertTriangle,
  Tags,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Boxes,
  Users,
  Bell,
  Activity,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/AdminShell";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, humanize } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Overview,
});

const CHART_COLORS = ["#0b3d91", "#2563eb", "#38bdf8", "#f59e0b", "#10b981", "#a855f7", "#ef4444"];

function Overview() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview-v2"],
    queryFn: async () => {
      const [
        products,
        categories,
        orders,
        quotes,
        messages,
        subs,
        stock,
        customers,
      ] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id,status,created_at"),
        supabase.from("quotes").select("id,status,created_at"),
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("status", "new"),
        supabase
          .from("newsletter_subscribers")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase.from("products").select("stock_quantity,low_stock_threshold,category_id"),
        supabase
          .from("user_roles")
          .select("user_id", { count: "exact", head: true })
          .eq("role", "customer"),
      ]);

      const orderRows = orders.data ?? [];
      const quoteRows = quotes.data ?? [];
      const stockRows = stock.data ?? [];
      const low = stockRows.filter(
        (p) => p.stock_quantity <= p.low_stock_threshold,
      );

      return {
        products: products.count ?? 0,
        categories: categories.count ?? 0,
        orders: orderRows.length,
        pendingOrders: orderRows.filter((o) => o.status === "pending" || o.status === "processing").length,
        completedOrders: orderRows.filter((o) => o.status === "delivered" || o.status === "paid").length,
        pendingQuotes: quoteRows.filter((q) => q.status === "pending" || q.status === "reviewing").length,
        approvedQuotes: quoteRows.filter((q) => q.status === "approved" || q.status === "completed").length,
        rejectedQuotes: quoteRows.filter((q) => q.status === "rejected" || q.status === "cancelled").length,
        newMessages: messages.count ?? 0,
        subscribers: subs.count ?? 0,
        inventoryItems: stockRows.length,
        lowStock: low.length,
        customers: customers.count ?? 0,
        orderRows,
        quoteRows,
        stockRows,
      };
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["admin-overview-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,name");
      return data ?? [];
    },
  });

  const { data: activity } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const quoteTrend = useMemo(() => {
    const days: { date: string; label: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: key,
        label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        count: 0,
      });
    }
    (data?.quoteRows ?? []).forEach((q) => {
      const key = q.created_at.slice(0, 10);
      const d = days.find((x) => x.date === key);
      if (d) d.count++;
    });
    return days;
  }, [data]);

  const orderStatusData = useMemo(() => {
    const map: Record<string, number> = {};
    (data?.orderRows ?? []).forEach((o) => {
      map[o.status] = (map[o.status] ?? 0) + 1;
    });
    return Object.entries(map).map(([status, count]) => ({
      status: humanize(status),
      count,
    }));
  }, [data]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    (data?.stockRows ?? []).forEach((p) => {
      const key = p.category_id ?? "uncategorised";
      map[key] = (map[key] ?? 0) + 1;
    });
    return Object.entries(map).map(([id, value]) => ({
      name:
        categoriesData?.find((c) => c.id === id)?.name ?? "Uncategorised",
      value,
    }));
  }, [data, categoriesData]);

  const cards = [
    { label: "Products", value: data?.products, icon: Package, to: "/admin/products", tone: "text-blue-600 bg-blue-500/10" },
    { label: "Categories", value: data?.categories, icon: Tags, to: "/admin/categories", tone: "text-sky-600 bg-sky-500/10" },
    { label: "Pending Quotes", value: data?.pendingQuotes, icon: Clock, to: "/admin/quotes", tone: "text-amber-600 bg-amber-500/10" },
    { label: "Approved Quotes", value: data?.approvedQuotes, icon: CheckCircle2, to: "/admin/quotes", tone: "text-emerald-600 bg-emerald-500/10" },
    { label: "Rejected Quotes", value: data?.rejectedQuotes, icon: XCircle, to: "/admin/quotes", tone: "text-red-600 bg-red-500/10" },
    { label: "Total Orders", value: data?.orders, icon: ClipboardList, to: "/admin/orders", tone: "text-indigo-600 bg-indigo-500/10" },
    { label: "Pending Orders", value: data?.pendingOrders, icon: Clock, to: "/admin/orders", tone: "text-amber-600 bg-amber-500/10" },
    { label: "Completed Orders", value: data?.completedOrders, icon: CheckCircle2, to: "/admin/orders", tone: "text-emerald-600 bg-emerald-500/10" },
    { label: "Inventory Items", value: data?.inventoryItems, icon: Boxes, to: "/admin/inventory", tone: "text-cyan-600 bg-cyan-500/10" },
    { label: "Low Stock", value: data?.lowStock, icon: AlertTriangle, to: "/admin/inventory", tone: "text-red-600 bg-red-500/10" },
    { label: "New Messages", value: data?.newMessages, icon: MessageSquare, to: "/admin/messages", tone: "text-purple-600 bg-purple-500/10" },
    { label: "Subscribers", value: data?.subscribers, icon: Mail, to: "/admin/newsletter", tone: "text-teal-600 bg-teal-500/10" },
    { label: "Customers", value: data?.customers, icon: Users, to: "/admin/users", tone: "text-fuchsia-600 bg-fuchsia-500/10" },
  ] as const;

  return (
    <div>
      <PageHeader
        title="Dashboard Overview"
        description="Your business command center — quotes, orders, inventory and activity at a glance."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {cards.map((c, i) => (
          <Link
            key={c.label}
            to={c.to}
            style={{ animationDelay: `${i * 40}ms` }}
            className="group animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-accent/40"
          >
            <div className={cn("mb-3 flex size-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110", c.tone)}>
              <c.icon className="size-5" />
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-2xl font-bold text-primary">{c.value ?? 0}</p>
            )}
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Quote Requests (Last 30 Days)" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={quoteTrend}>
              <defs>
                <linearGradient id="qg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0b3d91" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0b3d91" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#0b3d91" fill="url(#qg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Orders by Status" icon={ClipboardList}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={orderStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="status" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Products by Category" icon={Tags}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Inventory Stock Levels" icon={Boxes}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={[
                { name: "Healthy", value: (data?.inventoryItems ?? 0) - (data?.lowStock ?? 0) },
                { name: "Low Stock", value: data?.lowStock ?? 0 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Activity + Notifications */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="size-4 text-accent" />
            <h2 className="font-semibold text-primary">Recent Activity</h2>
          </div>
          <ul className="space-y-3">
            {(activity ?? []).length === 0 && (
              <li className="text-sm text-muted-foreground">No activity yet.</li>
            )}
            {(activity ?? []).map((a) => (
              <li key={a.id} className="flex items-start gap-3 text-sm">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" />
                <div>
                  <p className="font-medium">{a.description || humanize(a.action)}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.actor_name ? `${a.actor_name} · ` : ""}
                    {formatDateTime(a.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-accent" />
              <h2 className="font-semibold text-primary">Notifications</h2>
            </div>
            {(notifications ?? []).some((n) => !n.is_read) && (
              <button
                className="text-xs font-medium text-accent hover:underline"
                onClick={async () => {
                  await supabase
                    .from("notifications")
                    .update({ is_read: true })
                    .eq("is_read", false);
                  qc.invalidateQueries({ queryKey: ["admin-notifications"] });
                }}
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="space-y-2">
            {(notifications ?? []).length === 0 && (
              <li className="text-sm text-muted-foreground">No notifications.</li>
            )}
            {(notifications ?? []).map((n) => (
              <li
                key={n.id}
                className={cn(
                  "rounded-lg border p-3 text-sm transition-colors",
                  n.is_read
                    ? "border-border bg-card"
                    : "border-accent/30 bg-accent/5",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDateTime(n.created_at)}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Package;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="size-4 text-accent" />
        <h2 className="font-semibold text-primary">{title}</h2>
      </div>
      {children}
    </div>
  );
}
