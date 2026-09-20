import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  CloudUpload,
  Command,
  GitCompareArrows,
  Copy,
  FileCheck2,
  FileText,
  Filter,
  Gauge,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Table2,
  Tags,
  Upload,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Streamdown } from "streamdown";
import type {
  Alert,
  Contract,
  DashboardData,
  Obligation,
  CompareChange,
} from "../../../server/contractData";
const Compare = GitCompareArrows;

const navGroups = [
  {
    label: "Workspace",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "contracts", label: "Contracts", icon: FileText },
      { id: "obligations", label: "Obligations", icon: Check },
      { id: "timeline", label: "Timeline", icon: Activity },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { id: "alerts", label: "Alerts", icon: Bell, count: 3 },
      { id: "compare", label: "Compare", icon: Compare },
      { id: "analytics", label: "Analytics", icon: Gauge },
      { id: "chat", label: "AI Chat", icon: MessageSquare },
    ],
  },
];

type View =
  | "dashboard"
  | "contracts"
  | "obligations"
  | "timeline"
  | "alerts"
  | "compare"
  | "analytics"
  | "chat"
  | "settings";

const formatDate = (value: string) =>
  value
    ? new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not set";
const formatShortDate = (value: string) =>
  value
    ? new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "Not set";
const daysFromNow = (value: string) =>
  Math.ceil(
    (new Date(`${value}T12:00:00`).getTime() -
      new Date("2026-09-19T12:00:00").getTime()) /
      86_400_000
  );
const initials = (name: string) =>
  name
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function StatusBadge({
  value,
  kind = "status",
}: {
  value: string;
  kind?: "status" | "risk" | "priority";
}) {
  const label = value.replaceAll("_", " ");
  let tone = "badge-gray";
  if (["active", "completed", "low", "acknowledged"].includes(value))
    tone = "badge-green";
  if (["review", "expiring", "due_soon", "medium", "upcoming"].includes(value))
    tone = "badge-amber";
  if (["high", "overdue", "due", "critical"].includes(value))
    tone = "badge-red";
  if (["archived", "open", "info"].includes(value)) tone = "badge-blue";
  return (
    <span className={`badge ${tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {kind === "risk" ? `${label} risk` : label}
    </span>
  );
}

function MetricCard({
  label,
  value,
  delta,
  note,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  delta?: string;
  note: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "amber" | "red";
}) {
  const toneClass = {
    blue: "text-[#aeb5ff] bg-[#5e6ad2]/12",
    green: "text-[#83e6b7] bg-[#55bd8b]/10",
    amber: "text-[#ffd18d] bg-[#d7983c]/10",
    red: "text-[#ff9aa8] bg-[#ce485e]/10",
  }[tone];
  return (
    <div className="glass-panel hover-lift rounded-2xl p-5 min-h-[142px] flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="text-[12px] uppercase tracking-[.12em] text-[#858b98]">
          {label}
        </div>
        <div className={`rounded-xl p-2 ${toneClass}`}>
          <Icon size={16} strokeWidth={1.8} />
        </div>
      </div>
      <div>
        <div className="mt-5 flex items-end gap-2">
          <span className="font-display text-[32px] leading-none font-semibold tracking-[-.04em] text-[#f5f5f7]">
            {value}
          </span>
          {delta && (
            <span className="mb-0.5 flex items-center gap-0.5 text-[11px] font-semibold text-[#83e6b7]">
              <ArrowUpRight size={12} />
              {delta}
            </span>
          )}
        </div>
        <div className="mt-2 text-xs text-[#747a86]">{note}</div>
      </div>
    </div>
  );
}

function SourceLink({
  page,
  section,
  onClick,
}: {
  page: number;
  section: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="source-chip inline-flex items-center gap-1 text-[11px]"
      title={`Open page ${page}, ${section}`}
    >
      <BookOpen size={11} />
      p.{page} · {section}
    </button>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: { id: string; label: string; icon: LucideIcon; count?: number };
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`nav-item group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] ${active ? "active" : ""}`}
    >
      <Icon size={16} strokeWidth={active ? 2.2 : 1.7} />
      <span className="sidebar-label flex-1">{item.label}</span>
      {item.count && (
        <span className="sidebar-label rounded-md bg-[#ed7a8b]/12 px-1.5 py-0.5 text-[10px] font-semibold text-[#ff9aa8]">
          {item.count}
        </span>
      )}
    </button>
  );
}

function Topbar({
  view,
  onUpload,
  onSearch,
  onMobileMenu,
}: {
  view: View;
  onUpload: () => void;
  onSearch: () => void;
  onMobileMenu: () => void;
}) {
  const titles: Record<View, string> = {
    dashboard: "Dashboard",
    contracts: "Contract library",
    obligations: "Obligation tracker",
    timeline: "Timeline",
    alerts: "Alerts",
    compare: "Compare versions",
    analytics: "Analytics",
    chat: "AI Contract Chat",
    settings: "Workspace settings",
  };
  return (
    <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-white/[.07] bg-[#050506]/75 px-5 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenu}
          aria-label="Open navigation"
          className="button-ghost mobile-topbar hidden rounded-lg p-2"
        >
          <Menu size={18} />
        </button>
        <div>
          <div className="text-[11px] uppercase tracking-[.12em] text-[#666c77]">
            Workspace / {titles[view]}
          </div>
          <div className="mt-1 font-display text-[18px] font-semibold tracking-[-.025em] text-[#f2f2f5]">
            {titles[view]}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          onClick={onSearch}
          className="button-ghost hidden items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#959aa6] sm:flex"
          aria-label="Search contracts"
        >
          <Command size={14} />
          <span>Search</span>
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-[#666c77]">
            ⌘ K
          </kbd>
        </button>
        <button
          onClick={onUpload}
          className="button-primary flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-semibold"
        >
          <Upload size={14} />{" "}
          <span className="hidden sm:inline">Upload contract</span>
          <span className="sm:hidden">Upload</span>
        </button>
        <button
          className="button-ghost rounded-lg p-2.5"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>
      </div>
    </header>
  );
}

function Sidebar({
  view,
  setView,
  collapsed,
  setCollapsed,
  onUpload,
  user,
  workspaceName,
  mobile = false,
}: {
  view: View;
  setView: (view: View) => void;
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  onUpload: () => void;
  user: { name?: string | null; email?: string | null } | null;
  workspaceName: string;
  mobile?: boolean;
}) {
  const displayName = user?.name?.trim() || "Guest user";
  const workspaceLabel = workspaceName;
  return (
    <aside
      className={`${mobile ? "mobile-drawer-panel !relative !left-auto !top-auto !bottom-auto !z-auto !w-full !max-w-none !border-0" : `desktop-sidebar fixed bottom-0 left-0 top-0 z-30 ${collapsed ? "sidebar-collapsed" : ""}`} flex w-[248px] flex-col border-r border-white/[.07] bg-[#070709]/95 px-3 py-4 backdrop-blur-xl transition-all duration-200 ${collapsed ? "!w-[76px]" : ""}`}
    >
      <div className="flex items-center gap-3 px-2.5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7b86f5] to-[#414a9f] shadow-[0_8px_24px_rgba(94,106,210,.35)]">
          <FileCheck2 size={18} color="white" />
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-[#070709] bg-[#6bd7a4]" />
        </div>
        <div className="sidebar-label min-w-0">
          <div className="font-display text-[15px] font-bold tracking-[-.025em] text-[#f4f4f6]">
            ContractLens
          </div>
          <div className="text-[10px] text-[#6f7480]">
            Intelligence workspace
          </div>
        </div>
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed(!collapsed)}
          className="button-ghost ml-auto rounded-md p-1.5"
        >
          <PanelLeftClose size={14} className={collapsed ? "rotate-180" : ""} />
        </button>
      </div>
      <button
        onClick={onUpload}
        className={`button-primary mt-7 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold ${collapsed ? "mx-2" : "mx-1"}`}
      >
        <Plus size={15} />
        <span className="sidebar-label">Add contract</span>
      </button>
      <nav className="mt-8 flex-1 space-y-6" aria-label="Primary navigation">
        {navGroups.map(group => (
          <div key={group.label}>
            <div className="nav-section-label mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-[#555b67]">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map(item => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={view === item.id}
                  onClick={() => setView(item.id as View)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/[.07] pt-4">
        <NavButton
          item={{ id: "settings", label: "Settings", icon: Settings2 }}
          active={view === "settings"}
          onClick={() => setView("settings")}
        />
        <NavButton
          item={{ id: "help", label: "Help center", icon: LifeBuoy }}
          active={false}
          onClick={() =>
            toast("Help center is coming next in the workspace build.")
          }
        />
      </div>
      <div
        className={`mt-5 flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.025] p-2.5 ${collapsed ? "justify-center" : ""}`}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#232642] text-[11px] font-bold text-[#c8ccff]">
          {initials(displayName)}
        </div>
        <div className="workspace-detail min-w-0">
          <div className="truncate text-xs font-medium text-[#e5e6eb]">
            {displayName}
          </div>
          <div className="truncate text-[10px] text-[#666c77]">
            {workspaceLabel}
          </div>
        </div>
        <ChevronDown
          className="workspace-detail ml-auto text-[#616774]"
          size={14}
        />
      </div>
    </aside>
  );
}

function DashboardView({
  dashboard,
  onOpenContract,
  setView,
  userName,
  workspaceName,
  onToggleWorkspace,
}: {
  dashboard: DashboardData;
  onOpenContract: (id: string) => void;
  setView: (view: View) => void;
  userName: string;
  workspaceName: string;
  onToggleWorkspace: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-[#858b98]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6bd7a4]" />
            All systems operational
          </div>
          <h1 className="font-display text-[30px] font-semibold leading-tight tracking-[-.045em] text-[#f5f5f7] sm:text-[36px]">
            Good morning, {userName}
            <span className="text-[#737cf0]">.</span>
          </h1>
          <p className="mt-2 max-w-[580px] text-sm leading-6 text-[#858b98]">
            Here’s the signal across your contract portfolio. Three items need
            attention this week.
          </p>
        </div>
        <button
          onClick={onToggleWorkspace}
          className="pill flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#959aa6] hover:text-white"
          title="Switch workspace"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#7c87f4]" />
          {workspaceName} <ChevronDown size={13} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Total contracts"
          value={dashboard.metrics.totalContracts}
          delta="12%"
          note="Across this workspace"
          icon={FileText}
        />
        <MetricCard
          label="Active contracts"
          value={dashboard.metrics.activeContracts}
          note="Currently in force"
          icon={ShieldCheck}
          tone="green"
        />
        <MetricCard
          label="Upcoming renewals"
          value={dashboard.metrics.upcomingRenewals}
          note="Next 120 days"
          icon={Clock3}
          tone="amber"
        />
        <MetricCard
          label="Due soon"
          value={dashboard.metrics.obligationsDueSoon}
          note="Within 14 days"
          icon={Zap}
          tone="amber"
        />
        <MetricCard
          label="Review required"
          value={dashboard.metrics.reviewRequired}
          note="AI-flagged items"
          icon={AlertTriangle}
          tone="red"
        />
        <MetricCard
          label="Updated this week"
          value={dashboard.metrics.updatedThisWeek}
          note="Last 7 days"
          icon={Activity}
          tone="blue"
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <section className="glass-panel rounded-2xl p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-[16px] font-semibold tracking-[-.02em] text-[#f1f1f4]">
                  Upcoming obligations
                </h2>
                <span className="badge badge-blue">Live view</span>
              </div>
              <p className="mt-1 text-xs text-[#737984]">
                Deadlines extracted from your active agreements
              </p>
            </div>
            <button
              onClick={() => setView("obligations")}
              className="button-ghost flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs"
            >
              View all <ChevronRight size={13} />
            </button>
          </div>
          <div className="mt-5 overflow-x-auto">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-[1.6fr_1.2fr_100px_84px_92px] gap-3 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[#626874]">
                <span>Obligation</span>
                <span>Contract</span>
                <span>Due date</span>
                <span>Priority</span>
                <span>Status</span>
              </div>
              {dashboard.upcomingObligations.map(item => (
                <div
                  key={item.id}
                  className="table-row grid grid-cols-[1.6fr_1.2fr_100px_84px_92px] items-center gap-3 px-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-[#e4e5ea]">
                      {item.obligation}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-[#6d737f]">
                      <UserRound size={10} />
                      {item.responsibleParty}
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenContract(item.contractId)}
                    className="truncate text-left text-xs text-[#aab0f7] hover:text-white"
                  >
                    {item.contractName}
                  </button>
                  <div className="text-xs text-[#c1c4cc]">
                    {formatShortDate(item.dueDate)}
                  </div>
                  <StatusBadge value={item.priority} kind="priority" />
                  <StatusBadge value={item.status} />
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="glass-panel rounded-2xl p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-[16px] font-semibold tracking-[-.02em] text-[#f1f1f4]">
                Renewal radar
              </h2>
              <p className="mt-1 text-xs text-[#737984]">
                Contracts requiring a decision
              </p>
            </div>
            <button
              onClick={() => setView("timeline")}
              className="button-ghost rounded-lg p-2"
              aria-label="Open renewal timeline"
            >
              <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="mt-5 space-y-4">
            {dashboard.renewals.map(contract => {
              const days = daysFromNow(contract.expirationDate);
              return (
                <button
                  onClick={() => onOpenContract(contract.id)}
                  key={contract.id}
                  className="group flex w-full items-center gap-3 text-left"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${days < 45 ? "bg-[#ce485e]/12 text-[#ff9aa8]" : "bg-[#5e6ad2]/12 text-[#aeb5ff]"}`}
                  >
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-[#e1e2e7] group-hover:text-white">
                      {contract.name}
                    </div>
                    <div className="mt-1 text-[11px] text-[#737984]">
                      Renewal {formatDate(contract.renewalDate)} ·{" "}
                      {contract.owner}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xs font-semibold ${days < 45 ? "text-[#ff9aa8]" : "text-[#b5baff]"}`}
                    >
                      {days < 0
                        ? `${Math.abs(days)}d overdue`
                        : `${days}d left`}
                    </div>
                    <div className="mt-1 text-[10px] text-[#666c77]">
                      Notice {formatShortDate(contract.noticeDeadline)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr_1.1fr]">
        <section className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-[15px] font-semibold text-[#f1f1f4]">
                Portfolio health
              </h2>
              <p className="mt-1 text-xs text-[#737984]">
                Status across all agreements
              </p>
            </div>
            <Activity size={16} className="text-[#737cf0]" />
          </div>
          <div className="mt-6 flex items-center gap-6">
            <div
              className="relative flex h-28 w-28 items-center justify-center rounded-full"
              style={{
                background:
                  "conic-gradient(#6bd7a4 0 40%, #f2b86b 40% 60%, #ed7a8b 60% 80%, #444750 80% 100%)",
              }}
            >
              <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#0c0c0f]">
                <div className="text-center">
                  <div className="font-display text-2xl font-semibold">
                    80<span className="text-sm text-[#7d828e]">%</span>
                  </div>
                  <div className="text-[9px] uppercase tracking-[.12em] text-[#6d737f]">
                    healthy
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#6bd7a4]" />
                Active <span className="ml-auto pl-5 text-[#c1c4cc]">2</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f2b86b]" />
                Review <span className="ml-auto pl-5 text-[#c1c4cc]">1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#ed7a8b]" />
                Expiring <span className="ml-auto pl-5 text-[#c1c4cc]">1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#444750]" />
                Archived <span className="ml-auto pl-5 text-[#c1c4cc]">1</span>
              </div>
            </div>
          </div>
        </section>
        <section className="glass-panel rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-[15px] font-semibold text-[#f1f1f4]">
                Activity
              </h2>
              <p className="mt-1 text-xs text-[#737984]">
                Contract events, last 7 days
              </p>
            </div>
            <MoreHorizontal size={17} className="text-[#737984]" />
          </div>
          <div className="mt-6 flex h-[118px] items-end gap-2 px-1">
            {[28, 42, 34, 58, 46, 72, 64, 88, 68, 78, 92, 82, 100, 86].map(
              (height, index) => (
                <div
                  key={index}
                  className={`chart-bar flex-1 ${index < 3 ? "muted" : ""}`}
                  style={{ height: `${height}%` }}
                />
              )
            )}
          </div>
          <div className="mt-3 flex justify-between text-[10px] text-[#626874]">
            <span>Sep 13</span>
            <span>Sep 19</span>
          </div>
        </section>
        <section className="glass-panel-strong relative overflow-hidden rounded-2xl p-5">
          <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[#5e6ad2]/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[#b9bdff]">
              <Sparkles size={16} />
              <span className="text-[11px] font-semibold uppercase tracking-[.12em]">
                Lens intelligence
              </span>
            </div>
            <h2 className="mt-4 font-display text-[21px] font-semibold leading-tight tracking-[-.035em] text-[#f2f2f6]">
              Your contracts are telling a story.
            </h2>
            <p className="mt-3 text-xs leading-5 text-[#969ba8]">
              One renewal decision and two high-priority obligations are driving
              the next 14 days of work.
            </p>
            <button
              onClick={() => setView("analytics")}
              className="button-primary mt-5 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
            >
              View insights <ChevronRight size={14} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ContractListView({
  contracts,
  search,
  setSearch,
  onOpenContract,
  onUpload,
}: {
  contracts: Contract[];
  search: string;
  setSearch: (value: string) => void;
  onOpenContract: (id: string) => void;
  onUpload: () => void;
}) {
  const [status, setStatus] = useState("all");
  const filtered = contracts.filter(
    contract => status === "all" || contract.status === status
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-.04em] text-[#f4f4f6]">
            Contract library
          </h1>
          <p className="mt-1 text-sm text-[#858b98]">
            Search, filter, and inspect every agreement in your workspace.
          </p>
        </div>
        <button
          onClick={onUpload}
          className="button-primary flex w-fit items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-semibold"
        >
          <CloudUpload size={15} /> Upload contracts
        </button>
      </div>
      <div className="glass-panel flex flex-col gap-3 rounded-2xl p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#656a74]"
            size={15}
          />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search contracts, parties, owners..."
            className="h-10 w-full rounded-lg border border-white/[.07] bg-black/20 pl-9 pr-3 text-sm text-[#e5e6eb] placeholder:text-[#646a75] focus:border-[#7c87f4]/50 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter size={14} className="ml-2 shrink-0 text-[#656a74]" />
          {["all", "active", "review", "expiring", "archived"].map(item => (
            <button
              key={item}
              onClick={() => setStatus(item)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs capitalize transition ${status === item ? "bg-[#5e6ad2]/20 text-[#c9ceff]" : "text-[#858b98] hover:bg-white/[.05]"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[1.5fr_1.05fr_94px_74px_120px_110px] gap-4 px-5 py-3 text-[10px] font-semibold uppercase tracking-[.12em] text-[#626874]">
              <span>Contract</span>
              <span>Parties</span>
              <span>Status</span>
              <span>Risk</span>
              <span>Expiration</span>
              <span>Owner</span>
            </div>
            {filtered.map(contract => (
              <button
                key={contract.id}
                onClick={() => onOpenContract(contract.id)}
                className="table-row grid w-full grid-cols-[1.5fr_1.05fr_94px_74px_120px_110px] items-center gap-4 px-5 py-4 text-left"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#5e6ad2]/10 text-[#aeb5ff]">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-[#e5e6eb]">
                      {contract.name}
                    </div>
                    <div className="mt-1 truncate text-[10px] text-[#6f7581]">
                      {contract.type} · updated{" "}
                      {formatShortDate(contract.lastUpdated)}
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs text-[#c0c4cd]">
                    {contract.parties
                      .map(party => party.name.split(",")[0])
                      .join(" · ")}
                  </div>
                  <div className="mt-1 text-[10px] text-[#6f7581]">
                    {contract.parties.length} parties
                  </div>
                </div>
                <StatusBadge value={contract.status} />
                <StatusBadge value={contract.risk} kind="risk" />
                <div>
                  <div className="text-xs text-[#c7c9d0]">
                    {formatDate(contract.expirationDate)}
                  </div>
                  <div className="mt-1 text-[10px] text-[#777d88]">
                    Notice {formatShortDate(contract.noticeDeadline)}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#b7bbc5]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#232642] text-[9px] font-bold text-[#c8ccff]">
                    {initials(contract.owner)}
                  </span>
                  {contract.owner.split(" ")[0]}
                </div>
              </button>
            ))}
          </div>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search size={24} className="text-[#656a74]" />
            <div className="mt-3 text-sm text-[#bfc2cc]">
              No contracts match your filters.
            </div>
            <div className="mt-1 text-xs text-[#6f7581]">
              Try another search or upload a new agreement.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ContractDetail({
  contract,
  onBack,
  setView,
}: {
  contract: Contract;
  onBack: () => void;
  setView: (view: View) => void;
}) {
  const [tab, setTab] = useState("overview");
  const [question, setQuestion] = useState("");
  const queryMutation = trpc.contracts.query.useMutation();
  const compareTarget = contract.id === "cld-001" ? "sft-002" : "cld-001";
  const tabs = [
    "Overview",
    "Clauses",
    "Obligations",
    "Timeline",
    "Q&A",
    "Versions",
    "Alerts",
    "Source document",
  ];
  const handleAsk = () => {
    if (!question.trim()) return;
    queryMutation.mutate(
      { id: contract.id, question },
      {
        onError: () => toast.error("Unable to query this contract."),
        onSuccess: () => setQuestion(""),
      }
    );
  };
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-[#858b98] hover:text-white"
      >
        <ChevronRight size={14} className="rotate-180" />
        Back to contract library
      </button>
      <div className="glass-panel-strong rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5e6ad2]/30 to-[#252747] text-[#b8beff]">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-semibold tracking-[-.04em] text-[#f5f5f7]">
                  {contract.name}
                </h1>
                <StatusBadge value={contract.status} />
                <StatusBadge value={contract.risk} kind="risk" />
              </div>
              <p className="mt-2 text-sm text-[#8b909b]">
                {contract.type}
                {contract.document ? ` · ${contract.document}` : ""}
                {contract.pageCount > 0
                  ? ` · ${contract.pageCount} pages`
                  : " · Processing document details"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#737984]">
                <span className="flex items-center gap-1">
                  <UserRound size={12} />
                  Owner: {contract.owner}
                </span>
                <span className="flex items-center gap-1">
                  <Clock3 size={12} />
                  Updated {formatDate(contract.lastUpdated)}
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} />
                  {contract.document
                    ? "Source document stored securely"
                    : "Awaiting source document"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                toast(
                  "Source document viewer is ready for the connected storage integration."
                )
              }
              className="button-ghost flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
            >
              <BookOpen size={14} />
              Source
            </button>
            <button
              onClick={() => setView("compare")}
              className="button-primary flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
            >
              <Compare size={14} />
              Compare
            </button>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto border-t border-white/[.07] pt-3">
          <div className="flex min-w-max gap-1">
            {tabs.map(item => (
              <button
                key={item}
                onClick={() => setTab(item.toLowerCase().replace(" ", "-"))}
                className={`rounded-lg px-3 py-2 text-xs transition ${tab === item.toLowerCase().replace(" ", "-") ? "bg-white/[.08] text-[#eef0f8]" : "text-[#777d88] hover:bg-white/[.04] hover:text-[#d4d7e0]"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
      {tab === "overview" && (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <div className="space-y-5">
            <section className="glass-panel rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-[#9da5ff]" />
                    <h2 className="font-display text-[16px] font-semibold text-[#f0f1f5]">
                      AI summary
                    </h2>
                    <span className="badge badge-blue">Evidence-backed</span>
                  </div>
                  <p className="mt-1 text-xs text-[#737984]">
                    Concise view generated from indexed document evidence
                  </p>
                </div>
                <button
                  className="button-ghost rounded-lg p-2"
                  aria-label="Copy summary"
                  onClick={() => {
                    void navigator.clipboard?.writeText(contract.summary);
                    toast.success("Summary copied");
                  }}
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="mt-5 text-[14px] leading-7 text-[#c5c8d1]">
                {contract.summary}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/[.07] pt-4">
                <div className="flex items-center gap-2 text-[11px] text-[#737984]">
                  <ShieldCheck size={13} className="text-[#6bd7a4]" />
                  No unsupported legal conclusions
                </div>
                <SourceLink page={7} section="Fees and payment" />
              </div>
            </section>
            {contract.clauses.length === 0 &&
              contract.obligations.length === 0 && (
                <section className="glass-panel rounded-2xl border border-[#7c87f4]/20 bg-[#5e6ad2]/[.06] p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-[#7c87f4]/15 p-2 text-[#aeb5ff]">
                      <Clock3 size={17} />
                    </div>
                    <div>
                      <h2 className="font-display text-[16px] font-semibold text-[#f0f1f5]">
                        Contract details are processing
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-[#9a9fac]">
                        Your file is saved in this workspace. Clause extraction,
                        obligations, dates, and review insights will appear here
                        when processing completes.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[#c6c9ff]">
                        <span className="rounded-md bg-white/[.07] px-2 py-1">
                          File saved
                        </span>
                        <span className="rounded-md bg-white/[.07] px-2 py-1">
                          Workspace linked
                        </span>
                        <span className="rounded-md bg-white/[.07] px-2 py-1">
                          Awaiting extraction
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            <section className="glass-panel rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-[16px] font-semibold text-[#f0f1f5]">
                    Key terms
                  </h2>
                  <p className="mt-1 text-xs text-[#737984]">
                    High-signal fields extracted from the source
                  </p>
                </div>
                <button
                  onClick={() => setTab("clauses")}
                  className="text-xs text-[#aeb5ff] hover:text-white"
                >
                  See clauses <ChevronRight size={13} className="inline" />
                </button>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-4">
                  <div className="text-[10px] uppercase tracking-[.12em] text-[#686e7a]">
                    Parties
                  </div>
                  <div className="mt-3 space-y-2">
                    {contract.parties.map(party => (
                      <div
                        key={party.name}
                        className="flex items-center gap-2 text-xs text-[#d2d4dc]"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#232642] text-[9px] font-bold text-[#c9ceff]">
                          {initials(party.name)}
                        </span>
                        {party.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-4">
                  <div className="text-[10px] uppercase tracking-[.12em] text-[#686e7a]">
                    Duration
                  </div>
                  <div className="mt-3 text-sm font-medium text-[#e0e2e8]">
                    {formatDate(contract.effectiveDate)} —{" "}
                    {formatDate(contract.expirationDate)}
                  </div>
                  <div className="mt-1 text-xs text-[#777d88]">
                    Renewal notice by {formatDate(contract.noticeDeadline)}
                  </div>
                </div>
                <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-4">
                  <div className="text-[10px] uppercase tracking-[.12em] text-[#686e7a]">
                    Financial terms
                  </div>
                  <div className="mt-3 text-sm font-medium text-[#e0e2e8]">
                    {contract.amount}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-[#777d88]">
                    {contract.paymentTerms}
                  </div>
                </div>
                <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-4">
                  <div className="text-[10px] uppercase tracking-[.12em] text-[#686e7a]">
                    Governing law
                  </div>
                  <div className="mt-3 text-sm font-medium text-[#e0e2e8]">
                    {contract.governingLaw}
                  </div>
                  <div className="mt-1 text-xs text-[#777d88]">
                    Not legal advice — verify source terms
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div className="space-y-5">
            <section className="glass-panel rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-[#ffad79]" />
                    <h2 className="font-display text-[16px] font-semibold text-[#f0f1f5]">
                      Review flags
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-[#737984]">
                    Items that may require human review
                  </p>
                </div>
                <span className="badge badge-red">
                  {contract.reviewFlags.length} open
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {contract.reviewFlags.map(flag => (
                  <div
                    key={flag.id}
                    className="rounded-xl border border-[#ed7a8b]/15 bg-[#ed7a8b]/[.045] p-3.5"
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 rounded-lg bg-[#ed7a8b]/10 p-1.5 text-[#ff9aa8]">
                        <AlertTriangle size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#f0d8db]">
                          {flag.title}
                        </div>
                        <p className="mt-1 text-[11px] leading-5 text-[#a99ba0]">
                          {flag.reason}
                        </p>
                        <div className="mt-2">
                          <SourceLink
                            page={flag.source.page}
                            section={flag.source.section}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="glass-panel rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-[16px] font-semibold text-[#f0f1f5]">
                    Next deadline
                  </h2>
                  <p className="mt-1 text-xs text-[#737984]">
                    Highest urgency in this contract
                  </p>
                </div>
                <Clock3 size={16} className="text-[#f2b86b]" />
              </div>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <div className="font-display text-3xl font-semibold tracking-[-.05em] text-[#f4f4f7]">
                    5
                    <span className="ml-1 text-base font-normal text-[#858b98]">
                      days
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[#aeb1ba]">
                    Payment due · {formatDate("2026-09-24")}
                  </div>
                </div>
                <StatusBadge value="high" kind="priority" />
              </div>
              <div className="mt-4 progress-track">
                <div className="progress-fill" style={{ width: "68%" }} />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-[#666c77]">
                <span>Tracked obligation</span>
                <span>68% confidence</span>
              </div>
            </section>
          </div>
        </div>
      )}
      {tab === "clauses" && <ClauseExplorer clauses={contract.clauses} />}
      {tab === "obligations" && (
        <ObligationExplorer obligations={contract.obligations} />
      )}
      {tab === "timeline" && <TimelineView contract={contract} />}
      {tab === "q&a" && (
        <QAPanel
          contract={contract}
          question={question}
          setQuestion={setQuestion}
          onAsk={handleAsk}
          result={queryMutation.data}
          isPending={queryMutation.isPending}
        />
      )}
      {tab === "versions" && (
        <VersionPanel
          contract={contract}
          compareTarget={compareTarget}
          setView={setView}
        />
      )}
      {tab === "alerts" && <AlertPanel contract={contract} />}
      {tab === "source-document" && <SourceDocument contract={contract} />}
    </div>
  );
}

function ClauseExplorer({ clauses }: { clauses: Contract["clauses"] }) {
  const [open, setOpen] = useState<string | undefined>(clauses[0]?.id);
  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6">
      <div>
        <h2 className="font-display text-[16px] font-semibold text-[#f0f1f5]">
          Clause explorer
        </h2>
        <p className="mt-1 text-xs text-[#737984]">
          Searchable, source-linked clauses detected in the document
        </p>
      </div>
      <div className="mt-5 space-y-2">
        {clauses.map(clause => (
          <div
            key={clause.id}
            className="rounded-xl border border-white/[.07] bg-white/[.018]"
          >
            <button
              onClick={() =>
                setOpen(open === clause.id ? undefined : clause.id)
              }
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <span className="font-mono text-[11px] text-[#777d88]">
                § {clause.number}
              </span>
              <span className="flex-1 text-sm font-medium text-[#dfe1e7]">
                {clause.title}
              </span>
              <span className="badge badge-blue">
                {Math.round(clause.confidence * 100)}%
              </span>
              <ChevronDown
                size={15}
                className={`text-[#757b87] transition-transform ${open === clause.id ? "rotate-180" : ""}`}
              />
            </button>
            {open === clause.id && (
              <div className="border-t border-white/[.07] px-4 pb-4 pt-3">
                <p className="text-sm leading-6 text-[#bfc2cc]">
                  {clause.text}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-[#737984]">
                    Category · {clause.category}
                  </span>
                  <SourceLink page={clause.page} section={clause.title} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ObligationExplorer({
  obligations,
}: {
  obligations: Contract["obligations"];
}) {
  return (
    <section className="glass-panel overflow-hidden rounded-2xl">
      <div className="border-b border-white/[.07] p-5 sm:p-6">
        <h2 className="font-display text-[16px] font-semibold text-[#f0f1f5]">
          Obligation register
        </h2>
        <p className="mt-1 text-xs text-[#737984]">
          Every obligation stays connected to a source clause and page.
        </p>
      </div>
      <div className="divide-y divide-white/[.06]">
        {obligations.map(obligation => (
          <div key={obligation.id} className="p-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#5e6ad2]/10 text-[#aeb5ff]">
                  <Check size={14} />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#e3e4ea]">
                    {obligation.obligation}
                  </div>
                  <div className="mt-1.5 text-[11px] text-[#777d88]">
                    {obligation.responsibleParty} → {obligation.beneficiary} ·{" "}
                    {obligation.frequency}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-10 md:pl-0">
                <StatusBadge value={obligation.priority} kind="priority" />
                <StatusBadge value={obligation.status} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 pl-10">
              <span className="text-xs text-[#c4c7cf]">
                Due {formatDate(obligation.dueDate)}
              </span>
              <SourceLink
                page={obligation.source.page}
                section={obligation.source.section}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TimelineView({ contract }: { contract: Contract }) {
  const events = [
    {
      label: "Contract start",
      date: contract.effectiveDate,
      status: "completed",
      detail: "Effective date",
    },
    ...contract.obligations.map(item => ({
      label: item.obligation,
      date: item.dueDate,
      status: item.status,
      detail: item.responsibleParty,
    })),
    {
      label: "Renewal / expiration",
      date: contract.expirationDate,
      status: "upcoming",
      detail: "Decision milestone",
    },
  ];
  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="font-display text-[16px] font-semibold text-[#f0f1f5]">
            Contract timeline
          </h2>
          <p className="mt-1 text-xs text-[#737984]">
            Milestones and obligations in chronological order
          </p>
        </div>
        <div className="flex gap-2">
          <button className="button-ghost flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs">
            <Filter size={13} />
            Filter
          </button>
          <button className="button-ghost flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs">
            <Tags size={13} />
            Tags
          </button>
        </div>
      </div>
      <div className="mt-7 ml-2 border-l border-[#5e6ad2]/30">
        {events.map((event, index) => (
          <div
            key={`${event.label}-${index}`}
            className="relative pb-7 pl-8 last:pb-1"
          >
            <div
              className={`absolute -left-[7px] top-0 h-3.5 w-3.5 rounded-full border-2 border-[#0b0b0e] ${event.status === "completed" ? "bg-[#6bd7a4]" : event.status === "due_soon" || event.status === "upcoming" ? "bg-[#f2b86b]" : "bg-[#ed7a8b]"}`}
            />
            <div className="flex flex-col justify-between gap-2 sm:flex-row">
              <div>
                <div className="text-sm font-medium text-[#e1e3e9]">
                  {event.label}
                </div>
                <div className="mt-1 text-xs text-[#757b87]">
                  {event.detail}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge value={event.status} />
                <span className="text-xs text-[#aeb2bd]">
                  {formatDate(event.date)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function QAPanel({
  contract,
  question,
  setQuestion,
  onAsk,
  result,
  isPending,
}: {
  contract: Contract;
  question: string;
  setQuestion: (value: string) => void;
  onAsk: () => void;
  result?: {
    answer: string;
    source: { page: number; section: string; excerpt: string };
    mode: string;
  };
  isPending: boolean;
}) {
  const suggestions = [
    "When does this contract expire?",
    "What are the payment terms?",
    "What obligations does the vendor have?",
    "What is the termination notice period?",
  ];
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#5e6ad2]/15 p-2 text-[#abb2ff]">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="font-display text-[16px] font-semibold text-[#f0f1f5]">
              Ask this contract
            </h2>
            <p className="mt-1 text-xs text-[#737984]">
              Answers are grounded only in indexed document evidence.
            </p>
          </div>
        </div>
        <div className="mt-5 min-h-[170px] rounded-xl border border-white/[.07] bg-black/20 p-4">
          {result ? (
            <div>
              <div className="flex items-center gap-2 text-[11px] text-[#83e6b7]">
                <ShieldCheck size={13} />
                Evidence-backed response · workspace retrieval
              </div>
              <p className="mt-4 text-[15px] leading-7 text-[#e2e4eb]">
                {result.answer}
              </p>
              <div className="mt-5 border-t border-white/[.07] pt-3">
                <div className="mb-2 text-[10px] uppercase tracking-[.12em] text-[#686e7a]">
                  Source reference
                </div>
                <div className="rounded-lg border border-[#5e6ad2]/20 bg-[#5e6ad2]/[.06] p-3">
                  <div className="flex items-center justify-between">
                    <SourceLink
                      page={result.source.page}
                      section={result.source.section}
                    />
                    <span className="text-[10px] text-[#6e7480]">
                      {contract.document}
                    </span>
                  </div>
                  <div className="mt-2 text-xs leading-5 text-[#aeb2bd]">
                    “{result.source.excerpt}”
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[140px] flex-col items-center justify-center text-center">
              <CircleHelp size={22} className="text-[#565c68]" />
              <div className="mt-3 text-sm text-[#9ea3ae]">
                Ask a precise question about this agreement.
              </div>
              <div className="mt-1 text-xs text-[#666c77]">
                ContractLens will show the clause and page used to answer.
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map(suggestion => (
            <button
              key={suggestion}
              onClick={() => setQuestion(suggestion)}
              className="rounded-full border border-white/[.08] bg-white/[.025] px-3 py-2 text-[11px] text-[#9fa4af] hover:border-[#7c87f4]/30 hover:text-[#d8dbeb]"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <textarea
            value={question}
            onChange={event => setQuestion(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey))
                onAsk();
            }}
            placeholder="Ask about a date, clause, payment, or obligation..."
            rows={2}
            className="min-h-[54px] flex-1 resize-none rounded-xl border border-white/[.09] bg-black/20 px-3 py-3 text-sm text-[#e4e6ec] placeholder:text-[#656b76] focus:border-[#7c87f4]/50 focus:outline-none"
          />
          <button
            onClick={onAsk}
            disabled={isPending || question.trim().length < 3}
            className="button-primary self-end rounded-xl px-4 py-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Thinking..." : "Ask"}
          </button>
        </div>
      </section>
      <aside className="glass-panel rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <FileCheck2 size={15} className="text-[#aeb5ff]" />
          <h3 className="text-sm font-semibold text-[#e5e6eb]">
            Evidence rules
          </h3>
        </div>
        <ul className="mt-4 space-y-3 text-xs leading-5 text-[#858b98]">
          <li className="flex gap-2">
            <Check size={13} className="mt-1 shrink-0 text-[#6bd7a4]" />
            Answers stay scoped to uploaded documents.
          </li>
          <li className="flex gap-2">
            <Check size={13} className="mt-1 shrink-0 text-[#6bd7a4]" />
            Every answer includes a page and section reference.
          </li>
          <li className="flex gap-2">
            <Check size={13} className="mt-1 shrink-0 text-[#6bd7a4]" />
            Insufficient evidence is called out explicitly.
          </li>
        </ul>
        <div className="mt-5 rounded-xl border border-[#f2b86b]/15 bg-[#f2b86b]/[.05] p-3 text-[11px] leading-5 text-[#bda988]">
          AI assistance is not legal advice. Verify important decisions against
          the source document and your legal team.
        </div>
      </aside>
    </div>
  );
}

function VersionPanel({
  contract,
  compareTarget,
  setView,
}: {
  contract: Contract;
  compareTarget: string;
  setView: (view: View) => void;
}) {
  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="font-display text-[16px] font-semibold text-[#f0f1f5]">
            Version history
          </h2>
          <p className="mt-1 text-xs text-[#737984]">
            Track source documents and compare meaningful clause changes.
          </p>
        </div>
        <button
          onClick={() => setView("compare")}
          className="button-primary flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
        >
          <Compare size={14} />
          Compare versions
        </button>
      </div>
      <div className="mt-5 space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-[#7c87f4]/25 bg-[#5e6ad2]/[.06] p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5e6ad2]/15 text-[#aeb5ff]">
            <FileText size={16} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-[#e2e4eb]">
              {contract.document}
            </div>
            <div className="mt-1 text-[11px] text-[#808591]">
              Current version · uploaded {formatDate(contract.lastUpdated)} ·{" "}
              {contract.pageCount} pages
            </div>
          </div>
          <span className="badge badge-green">Current</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.02] p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[.05] text-[#858b98]">
            <FileText size={16} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-[#d0d3db]">
              {contract.name.replaceAll(" ", "_")}_v1.pdf
            </div>
            <div className="mt-1 text-[11px] text-[#757b87]">
              Previous version · indexed for comparison
            </div>
          </div>
          <span className="badge badge-gray">Archived</span>
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-dashed border-white/[.13] p-5 text-center">
        <Upload size={18} className="mx-auto text-[#737984]" />
        <div className="mt-2 text-xs text-[#9ea3ae]">
          Drop another version here to compare
        </div>
        <div className="mt-1 text-[10px] text-[#656b76]">
          PDF or DOCX · Max 25 MB
        </div>
      </div>
    </section>
  );
}

function AlertPanel({ contract }: { contract: Contract }) {
  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-[16px] font-semibold text-[#f0f1f5]">
            Contract alerts
          </h2>
          <p className="mt-1 text-xs text-[#737984]">
            Deadline signals generated from this contract.
          </p>
        </div>
        <button
          className="button-ghost flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
          onClick={() =>
            toast("Alert preferences are ready for the settings integration.")
          }
        >
          <Settings2 size={13} />
          Preferences
        </button>
      </div>
      <div className="mt-5 space-y-3">
        <div className="flex gap-3 rounded-xl border border-[#ed7a8b]/15 bg-[#ed7a8b]/[.045] p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#ff9aa8]" />
          <div className="flex-1">
            <div className="text-sm font-medium text-[#f0d8db]">
              Renewal notice deadline passed
            </div>
            <div className="mt-1 text-xs leading-5 text-[#a99ba0]">
              Confirm whether the non-renewal decision was documented for{" "}
              {contract.name}.
            </div>
            <div className="mt-2">
              <SourceLink page={13} section="Renewal" />
            </div>
          </div>
          <StatusBadge value="high" kind="priority" />
        </div>
        <div className="flex gap-3 rounded-xl border border-[#f2b86b]/15 bg-[#f2b86b]/[.045] p-4">
          <Clock3 size={16} className="mt-0.5 shrink-0 text-[#ffd18d]" />
          <div className="flex-1">
            <div className="text-sm font-medium text-[#f5e4c9]">
              Payment obligation due soon
            </div>
            <div className="mt-1 text-xs leading-5 text-[#b8a78b]">
              Monthly payment is due September 24, 2026.
            </div>
            <div className="mt-2">
              <SourceLink page={7} section="Fees and payment" />
            </div>
          </div>
          <StatusBadge value="medium" kind="priority" />
        </div>
      </div>
    </section>
  );
}

function SourceDocument({ contract }: { contract: Contract }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-[16px] font-semibold text-[#f0f1f5]">
              Source document
            </h2>
            <p className="mt-1 text-xs text-[#737984]">
              {contract.document} · page 7 of {contract.pageCount}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="button-ghost rounded-lg p-2"
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              className="button-ghost rounded-lg p-2"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        </div>
        <div className="mt-5 min-h-[480px] rounded-xl border border-white/[.08] bg-[#0a0a0d] p-8 shadow-inner sm:p-12">
          <div className="mx-auto max-w-[680px] rounded-sm bg-[#f7f7f2] p-8 text-[#262731] shadow-2xl sm:p-12">
            <div className="mb-8 flex items-start justify-between border-b border-[#d9d9d0] pb-5">
              <div>
                <div className="font-serif text-[11px] uppercase tracking-[.18em] text-[#77786f]">
                  Vertex Cloud Systems
                </div>
                <div className="mt-2 font-serif text-xl font-semibold">
                  Cloud Services Agreement
                </div>
              </div>
              <div className="font-mono text-[10px] text-[#77786f]">
                PAGE 07
              </div>
            </div>
            <div className="font-serif text-[13px] font-bold">
              4. FEES AND PAYMENT
            </div>
            <p className="mt-4 font-serif text-[12px] leading-6">
              Customer will pay undisputed invoices within thirty (30) days of
              the invoice date. Overdue amounts accrue interest at 1.0% per
              month.
            </p>
            <div className="mt-5 rounded border-l-2 border-[#5e6ad2] bg-[#eceeff] p-3 font-serif text-[12px] leading-6">
              Customer will pay undisputed invoices within{" "}
              <mark className="bg-[#d8dcff]">thirty (30) days</mark> of the
              invoice date.
            </div>
            <div className="mt-8 font-serif text-[12px] leading-6 text-[#55564f]">
              The parties acknowledge that timely payment supports continued
              service availability and reporting obligations under this
              Agreement.
            </div>
          </div>
        </div>
      </section>
      <aside className="glass-panel rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <Inbox size={15} className="text-[#aeb5ff]" />
          <h3 className="text-sm font-semibold text-[#e5e6eb]">
            Linked evidence
          </h3>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#737984]">
          Jump points generated from extracted insights.
        </p>
        <div className="mt-5 space-y-2">
          {contract.clauses.slice(0, 5).map(clause => (
            <button
              key={clause.id}
              className="flex w-full items-center gap-2 rounded-lg border border-white/[.07] bg-white/[.02] p-3 text-left hover:bg-white/[.05]"
            >
              <span className="font-mono text-[10px] text-[#aeb5ff]">
                p.{clause.page}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-[#c9ccd4]">
                {clause.title}
              </span>
              <ChevronRight size={13} className="text-[#666c77]" />
            </button>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-[#6bd7a4]/15 bg-[#6bd7a4]/[.045] p-3 text-[11px] leading-5 text-[#9fc5b0]">
          <ShieldCheck size={13} className="mb-1 inline" /> All displayed
          evidence is linked to a source page and clause.
        </div>
      </aside>
    </div>
  );
}

function ObligationsView({
  obligations,
  onOpenContract,
}: {
  obligations: (Obligation & { contractName: string })[];
  onOpenContract: (id: string) => void;
}) {
  const [filter, setFilter] = useState("all");
  const filtered = obligations.filter(
    item =>
      filter === "all" || item.status === filter || item.priority === filter
  );
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-[-.04em] text-[#f4f4f6]">
          Obligation tracker
        </h1>
        <p className="mt-1 text-sm text-[#858b98]">
          Stay ahead of every commitment, owner, and due date.
        </p>
      </div>
      <div className="glass-panel flex items-center gap-2 overflow-x-auto rounded-2xl p-3">
        <span className="ml-1 flex items-center gap-2 text-xs text-[#737984]">
          <Filter size={14} />
          Filter
        </span>
        {["all", "high", "due_soon", "upcoming", "completed"].map(item => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs capitalize ${filter === item ? "bg-[#5e6ad2]/20 text-[#c9ceff]" : "text-[#858b98] hover:bg-white/[.05]"}`}
          >
            {item.replaceAll("_", " ")}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map(item => (
          <div key={item.id} className="glass-panel hover-lift rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5e6ad2]/10 text-[#aeb5ff]">
                  <Check size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium leading-5 text-[#e3e4ea]">
                    {item.obligation}
                  </div>
                  <button
                    onClick={() => onOpenContract(item.contractId)}
                    className="mt-1 text-left text-[11px] text-[#aeb5ff] hover:text-white"
                  >
                    {item.contractName}
                  </button>
                </div>
              </div>
              <StatusBadge value={item.priority} kind="priority" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[.07] pt-4 text-xs">
              <div>
                <div className="text-[10px] uppercase tracking-[.1em] text-[#626874]">
                  Responsible
                </div>
                <div className="mt-1.5 text-[#c7cad2]">
                  {item.responsibleParty}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[.1em] text-[#626874]">
                  Due date
                </div>
                <div className="mt-1.5 text-[#c7cad2]">
                  {formatDate(item.dueDate)}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <StatusBadge value={item.status} />
              <SourceLink
                page={item.source.page}
                section={item.source.section}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineOverview({
  obligations,
}: {
  obligations: (Obligation & { contractName: string })[];
}) {
  const sorted = [...obligations].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate)
  );
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-[-.04em] text-[#f4f4f6]">
          Portfolio timeline
        </h1>
        <p className="mt-1 text-sm text-[#858b98]">
          One view of milestones across every tracked contract.
        </p>
      </div>
      <section className="glass-panel rounded-2xl p-5 sm:p-7">
        <div className="relative ml-3 border-l border-[#5e6ad2]/30 pl-7">
          {sorted.map((item, index) => (
            <div key={item.id} className="relative pb-8 last:pb-1">
              <div
                className={`absolute -left-[35px] top-1 h-4 w-4 rounded-full border-[3px] border-[#0a0a0d] ${item.status === "completed" ? "bg-[#6bd7a4]" : item.priority === "high" ? "bg-[#ed7a8b]" : "bg-[#f2b86b]"}`}
              />
              <div className="flex flex-col justify-between gap-3 rounded-xl border border-white/[.07] bg-white/[.02] p-4 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#e0e2e8]">
                    {item.obligation}
                  </div>
                  <div className="mt-1 text-xs text-[#777d88]">
                    {item.contractName} · {item.responsibleParty}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge value={item.status} />
                  <div className="text-right">
                    <div className="text-xs text-[#d0d2d9]">
                      {formatDate(item.dueDate)}
                    </div>
                    <div className="mt-1 text-[10px] text-[#6e7480]">
                      #{String(index + 1).padStart(2, "0")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AlertsView({ alerts }: { alerts: Alert[] }) {
  const [items, setItems] = useState(alerts);
  const acknowledge = (id: string) => {
    setItems(current =>
      current.map(item =>
        item.id === id ? { ...item, status: "acknowledged" as const } : item
      )
    );
    toast.success("Alert acknowledged");
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-.04em] text-[#f4f4f6]">
            Alerts
          </h1>
          <p className="mt-1 text-sm text-[#858b98]">
            Deadline signals generated from your contract obligations.
          </p>
        </div>
        <button
          onClick={() =>
            toast("Alert periods: 90, 60, 30, 14, 7, 3, and 1 day.")
          }
          className="button-ghost flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-xs"
        >
          <Settings2 size={14} />
          Alert settings
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Open alerts"
          value={items.filter(item => item.status === "open").length}
          note="Need acknowledgement"
          icon={Bell}
          tone="red"
        />
        <MetricCard
          label="High priority"
          value={items.filter(item => item.priority === "high").length}
          note="Act within 7 days"
          icon={AlertTriangle}
          tone="amber"
        />
        <MetricCard
          label="Acknowledged"
          value={items.filter(item => item.status === "acknowledged").length}
          note="Tracked by your team"
          icon={Check}
          tone="green"
        />
      </div>
      <section className="glass-panel overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[130px_1.1fr_1.5fr_98px_84px_100px] gap-4 px-5 py-3 text-[10px] font-semibold uppercase tracking-[.12em] text-[#626874]">
              <span>Type</span>
              <span>Contract</span>
              <span>Signal</span>
              <span>Deadline</span>
              <span>Priority</span>
              <span>Action</span>
            </div>
            {items.map(item => (
              <div
                key={item.id}
                className="table-row grid grid-cols-[130px_1.1fr_1.5fr_98px_84px_100px] items-center gap-4 px-5 py-4"
              >
                <div className="flex items-center gap-2 text-xs text-[#c7cad2]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5e6ad2]/10 text-[#aeb5ff]">
                    <Bell size={13} />
                  </span>
                  {item.type}
                </div>
                <div className="text-xs text-[#c7cad2]">
                  {item.contractName}
                </div>
                <div className="text-xs text-[#9da2ad]">{item.message}</div>
                <div className="text-xs text-[#c7cad2]">
                  {formatShortDate(item.deadline)}
                </div>
                <StatusBadge value={item.priority} kind="priority" />
                {item.status === "open" ? (
                  <button
                    onClick={() => acknowledge(item.id)}
                    className="button-ghost rounded-lg px-2.5 py-1.5 text-[11px]"
                  >
                    Acknowledge
                  </button>
                ) : (
                  <span className="text-[11px] text-[#6bd7a4]">
                    Acknowledged
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function CompareView({ contracts }: { contracts: Contract[] }) {
  const [leftId, setLeftId] = useState("cld-001");
  const [rightId, setRightId] = useState("sft-002");
  const input = useMemo(() => ({ leftId, rightId }), [leftId, rightId]);
  const { data: changes } = trpc.contracts.compare.useQuery(input);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-[-.04em] text-[#f4f4f6]">
          Compare versions
        </h1>
        <p className="mt-1 text-sm text-[#858b98]">
          See added, removed, modified, and unchanged language side by side.
        </p>
      </div>
      <section className="glass-panel rounded-2xl p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_40px_1fr]">
          <select
            value={leftId}
            onChange={event => setLeftId(event.target.value)}
            className="h-11 rounded-lg border border-white/[.09] bg-[#0a0a0d] px-3 text-sm text-[#e1e3e9] focus:border-[#7c87f4]/50 focus:outline-none"
          >
            {contracts.map(contract => (
              <option key={contract.id} value={contract.id}>
                {contract.name} · current
              </option>
            ))}
          </select>
          <div className="flex items-center justify-center text-[#737984]">
            ↔
          </div>
          <select
            value={rightId}
            onChange={event => setRightId(event.target.value)}
            className="h-11 rounded-lg border border-white/[.09] bg-[#0a0a0d] px-3 text-sm text-[#e1e3e9] focus:border-[#7c87f4]/50 focus:outline-none"
          >
            {contracts.map(contract => (
              <option key={contract.id} value={contract.id}>
                {contract.name} · previous
              </option>
            ))}
          </select>
        </div>
      </section>
      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-5 border-b border-white/[.07] px-5 py-4 text-[10px] font-semibold uppercase tracking-[.12em] text-[#626874]">
          <span>Clause</span>
          <span>Version A</span>
          <span>Version B</span>
        </div>
        {changes?.map(change => (
          <div
            key={change.title}
            className="grid grid-cols-[1.1fr_1fr_1fr] gap-5 border-b border-white/[.06] px-5 py-5 last:border-b-0"
          >
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-[#e2e4ea]">
                {change.title}
                <StatusBadge
                  value={
                    change.status === "modified" ? "review" : change.status
                  }
                />
              </div>
              <div className="mt-1 text-[11px] text-[#737984]">
                {change.category} · {change.detail}
              </div>
            </div>
            <div
              className={`rounded-lg p-3 text-xs leading-5 ${change.status === "modified" || change.status === "removed" ? "bg-[#ed7a8b]/[.06] text-[#c7a6ab]" : "bg-white/[.025] text-[#9da2ad]"}`}
            >
              {change.left}
            </div>
            <div
              className={`rounded-lg p-3 text-xs leading-5 ${change.status === "modified" || change.status === "added" ? "bg-[#6bd7a4]/[.06] text-[#a7cfb7]" : "bg-white/[.025] text-[#9da2ad]"}`}
            >
              {change.right}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsView({
  contracts,
  obligations,
}: {
  contracts: Contract[];
  obligations: (Obligation & { contractName: string })[];
}) {
  const statusCounts = ["active", "review", "expiring", "archived"].map(
    status => ({
      status,
      count: contracts.filter(contract => contract.status === status).length,
    })
  );
  const partyCounts = [
    {
      label: "Provider / vendor",
      count: obligations.filter(
        item =>
          item.responsibleParty.toLowerCase().includes("vertex") ||
          item.responsibleParty.toLowerCase().includes("nimbus")
      ).length,
    },
    {
      label: "Northstar / customer",
      count: obligations.filter(item =>
        item.responsibleParty.includes("Northstar")
      ).length,
    },
    {
      label: "Either party",
      count: obligations.filter(item =>
        item.responsibleParty.includes("Either")
      ).length,
    },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-[-.04em] text-[#f4f4f6]">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-[#858b98]">
          A focused view of portfolio health and operational load.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="glass-panel rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-[16px] font-semibold text-[#f0f1f5]">
            Contracts by status
          </h2>
          <p className="mt-1 text-xs text-[#737984]">
            Current portfolio composition
          </p>
          <div className="mt-7 space-y-5">
            {statusCounts.map(item => (
              <div key={item.status}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="capitalize text-[#bfc2cb]">
                    {item.status}
                  </span>
                  <span className="text-[#858b98]">{item.count} contracts</span>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${item.status === "review" ? "!bg-[#f2b86b]" : item.status === "expiring" ? "!bg-[#ed7a8b]" : ""}`}
                    style={{
                      width: `${Math.max((item.count / contracts.length) * 100, 4)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="glass-panel rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-[16px] font-semibold text-[#f0f1f5]">
            Obligations by party
          </h2>
          <p className="mt-1 text-xs text-[#737984]">
            Who owns the next action
          </p>
          <div className="mt-6 space-y-4">
            {partyCounts.map((item, index) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5e6ad2]/10 text-[11px] font-semibold text-[#aeb5ff]">
                  0{index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-[#c6c9d2]">{item.label}</div>
                  <div className="mt-2 progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.max((item.count / Math.max(obligations.length, 1)) * 100, 8)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-sm font-semibold text-[#e3e5ea]">
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="glass-panel rounded-2xl p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-[16px] font-semibold text-[#f0f1f5]">
                Activity over time
              </h2>
              <p className="mt-1 text-xs text-[#737984]">
                Indexed events and updates · September 2026
              </p>
            </div>
            <span className="badge badge-green">+18% vs Aug</span>
          </div>
          <div className="mt-8 flex h-48 items-end gap-2 border-b border-l border-white/[.08] px-3 pb-0 pt-4">
            {[
              22, 34, 30, 54, 45, 62, 58, 72, 66, 82, 70, 94, 78, 100, 90, 84,
              96, 88, 100, 92,
            ].map((height, index) => (
              <div
                key={index}
                className="chart-bar flex-1"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex justify-between px-2 text-[10px] text-[#626874]">
            <span>Sep 01</span>
            <span>Sep 07</span>
            <span>Sep 14</span>
            <span>Sep 19</span>
          </div>
        </section>
      </div>
    </div>
  );
}

function UploadDialog({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: (contractId: string) => void;
}) {
  const upload = trpc.contracts.upload.useMutation();
  const utils = trpc.useUtils();
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState("Ready to upload");
  const handleFile = (file?: File) => {
    if (!file) return;
    if (
      ![
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(file.type)
    ) {
      setStatus("Unsupported file. Choose a PDF or DOCX.");
      return;
    }
    setFileName(file.name);
    setStatus("Uploading securely...");
    const reader = new FileReader();
    reader.onerror = () =>
      setStatus("Could not read the file. Please try again.");
    reader.onload = () => {
      upload.mutate(
        {
          fileName: file.name,
          mimeType: file.type as
            | "application/pdf"
            | "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          fileSize: file.size,
          fileData:
            typeof reader.result === "string" ? reader.result : undefined,
        },
        {
          onSuccess: async result => {
            await Promise.all([
              utils.contracts.list.invalidate(),
              utils.dashboard.overview.invalidate(),
            ]);
            setStatus(
              `${result.fileName} saved. Contract details are ready to review.`
            );
            onUploaded(String(result.contractId));
          },
          onError: () => setStatus("Upload failed. Please try again."),
        }
      );
    };
    reader.readAsDataURL(file);
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Upload contract"
    >
      <div className="glass-panel-strong w-full max-w-lg rounded-2xl p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-[#5e6ad2]/15 p-2 text-[#aeb5ff]">
                <CloudUpload size={18} />
              </div>
              <h2 className="font-display text-lg font-semibold text-[#f2f2f5]">
                Upload contract
              </h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#858b98]">
              Add a PDF or DOCX to begin extraction, evidence linking, and
              obligation tracking.
            </p>
          </div>
          <button
            onClick={onClose}
            className="button-ghost rounded-lg p-2"
            aria-label="Close upload dialog"
          >
            <X size={16} />
          </button>
        </div>
        <label
          onDragOver={event => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={event => {
            event.preventDefault();
            setDragging(false);
            handleFile(event.dataTransfer.files[0]);
          }}
          className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 py-10 text-center transition ${dragging ? "border-[#7c87f4] bg-[#5e6ad2]/10" : "border-white/[.14] bg-white/[.02] hover:border-[#7c87f4]/50 hover:bg-white/[.035]"}`}
        >
          <input
            type="file"
            className="hidden"
            accept="application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={event => handleFile(event.target.files?.[0])}
          />
          <div className="rounded-full bg-[#5e6ad2]/12 p-3 text-[#abb2ff]">
            <Upload size={21} />
          </div>
          <div className="mt-4 text-sm font-medium text-[#e2e4ea]">
            Drop your contract here
          </div>
          <div className="mt-1 text-xs text-[#737984]">
            or click to browse · PDF or DOCX · max 25 MB
          </div>
          {fileName && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#6bd7a4]/15 bg-[#6bd7a4]/[.05] px-3 py-2 text-xs text-[#a7cfb7]">
              <FileText size={13} />
              {fileName}
            </div>
          )}
        </label>
        <div className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-[#737984]">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#6bd7a4]" />
          Upload processing is queued securely for this workspace. Document
          parsing and live AI extraction will run after processing is connected.
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-white/[.07] pt-4">
          <span
            className={`text-xs ${status.includes("Unsupported") || status.includes("failed") ? "text-[#ff9aa8]" : "text-[#858b98]"}`}
          >
            {status}
          </span>
          <button
            onClick={onClose}
            className="button-ghost rounded-lg px-3 py-2 text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsView() {
  const { user, logout } = useAuth();
  const utils = trpc.useUtils();
  const { data: account, isLoading: accountLoading } =
    trpc.auth.account.useQuery();
  const { data: settings, isLoading: settingsLoading } =
    trpc.settings.get.useQuery();
  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const profileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.auth.me.invalidate(),
        utils.auth.account.invalidate(),
      ]);
      toast.success("Profile updated");
      setSavingProfile(false);
    },
    onError: error => {
      toast.error(error.message);
      setSavingProfile(false);
    },
  });
  const settingsMutation = trpc.settings.update.useMutation({
    onSuccess: () => toast.success("Notification preferences saved"),
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    setName(account?.user?.name ?? user?.name ?? "");
  }, [account?.user?.name, user?.name]);

  const displayName = account?.user?.name || user?.name || "Guest user";
  const email = account?.user?.email || user?.email || "Not available";
  const workspaceName = account?.workspace?.name || "Workspace provisioning…";
  const profileInitials = initials(displayName);
  const toggleSetting = (
    key:
      | "emailNotifications"
      | "deadlineAlerts"
      | "renewalAlerts"
      | "overdueAlerts"
      | "weeklySummary"
  ) => {
    if (!settings) return;
    settingsMutation.mutate({ [key]: !settings[key] });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs text-[#858b98]">
          <Settings2 size={14} className="text-[#9ea7ff]" /> Account and
          workspace controls
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-[-.04em] text-[#f4f4f6] sm:text-3xl">
          Settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#858b98]">
          Manage your OAuth-backed account, workspace identity, and alert
          preferences. Changes are stored on the server.
        </p>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <section className="glass-panel rounded-2xl p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#232642] text-lg font-bold text-[#c8ccff]">
              {profileInitials}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold text-[#f0f1f5]">
                Account
              </h2>
              <p className="mt-1 text-xs text-[#737984]">
                Authenticated through Manus OAuth
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-4">
              <div className="text-[10px] uppercase tracking-[.14em] text-[#666c77]">
                OAuth identity
              </div>
              <div className="mt-2 truncate text-sm text-[#e4e5eb]">
                {accountLoading ? "Loading…" : email}
              </div>
              <div className="mt-1 text-[11px] text-[#737984]">
                Email is controlled by your provider
              </div>
            </div>
            <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-4">
              <div className="text-[10px] uppercase tracking-[.14em] text-[#666c77]">
                Workspace
              </div>
              <div className="mt-2 truncate text-sm text-[#e4e5eb]">
                {workspaceName}
              </div>
              <div className="mt-1 text-[11px] text-[#737984]">
                Private to your authenticated account
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-white/[.07] pt-5">
            <h3 className="text-sm font-medium text-[#e4e5eb]">Profile</h3>
            <p className="mt-1 text-xs text-[#737984]">
              Update the display name shown across your workspace.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={name}
                onChange={event => setName(event.target.value)}
                className="h-10 flex-1 rounded-lg border border-white/[.09] bg-[#0a0a0d] px-3 text-sm text-[#e4e5eb] outline-none transition focus:border-[#7c87f4]/60"
                placeholder="Your display name"
              />
              <button
                disabled={savingProfile || !name.trim()}
                onClick={() => {
                  setSavingProfile(true);
                  profileMutation.mutate({ name: name.trim() });
                }}
                className="button-primary rounded-lg px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingProfile ? "Saving…" : "Save profile"}
              </button>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.07] pt-5">
            <div>
              <div className="text-sm font-medium text-[#e4e5eb]">
                Session security
              </div>
              <div className="mt-1 text-xs text-[#737984]">
                Sign out this browser session and invalidate the server cookie.
              </div>
            </div>
            <button
              onClick={() =>
                logout().catch(error => toast.error(error.message))
              }
              className="button-ghost rounded-lg px-3 py-2 text-xs text-[#ff9aa8]"
            >
              Sign out
            </button>
          </div>
        </section>
        <section className="glass-panel rounded-2xl p-5 sm:p-6">
          <div>
            <h2 className="font-display text-base font-semibold text-[#f0f1f5]">
              Notifications
            </h2>
            <p className="mt-1 text-xs text-[#737984]">
              These preferences are persisted per account and control future
              alert delivery.
            </p>
          </div>
          <div className="mt-5 divide-y divide-white/[.07]">
            {(
              [
                [
                  "emailNotifications",
                  "Email notifications",
                  "Receive important contract activity updates.",
                ],
                [
                  "deadlineAlerts",
                  "Deadline alerts",
                  "Be notified before obligations come due.",
                ],
                [
                  "renewalAlerts",
                  "Renewal alerts",
                  "Track renewal and notice windows.",
                ],
                [
                  "overdueAlerts",
                  "Overdue obligation alerts",
                  "Escalate obligations that pass their due date.",
                ],
                [
                  "weeklySummary",
                  "Weekly contract summary",
                  "Receive a weekly portfolio digest.",
                ],
              ] as const
            ).map(([key, label, detail]) => {
              const enabled = settings?.[key] ?? false;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div>
                    <div className="text-sm font-medium text-[#e3e4ea]">
                      {label}
                    </div>
                    <div className="mt-1 text-xs text-[#737984]">{detail}</div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={enabled}
                    disabled={settingsLoading || settingsMutation.isPending}
                    onClick={() => toggleSetting(key)}
                    className={`relative h-6 w-11 shrink-0 rounded-full border transition ${enabled ? "border-[#7c87f4]/70 bg-[#5e6ad2]" : "border-white/[.14] bg-white/[.06]"}`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function ChatView({
  contracts,
  onUpload,
  onOpenContract,
}: {
  contracts: Contract[];
  onUpload: () => void;
  onOpenContract: (id: string) => void;
}) {
  const history = trpc.chat.history.useQuery();
  const ask = trpc.chat.ask.useMutation();
  const [question, setQuestion] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "assistant";
      content: string;
      sources?: Array<{
        contractId: number;
        contractName: string;
        documentName: string | null;
        section: string;
        page: number | null;
      }>;
    }>
  >([]);
  useEffect(() => {
    if (history.data?.messages) {
      setMessages(
        history.data.messages.map(message => ({
          role: message.role,
          content: message.content,
        }))
      );
    }
  }, [history.data]);
  const submit = () => {
    const trimmed = question.trim();
    if (!trimmed || ask.isPending) return;
    setMessages(current => [...current, { role: "user", content: trimmed }]);
    setQuestion("");
    ask.mutate(
      { question: trimmed, contractIds: selectedIds },
      {
        onSuccess: result =>
          setMessages(current => [
            ...current,
            {
              role: "assistant",
              content: result.answer,
              sources: result.sources,
            },
          ]),
        onError: error =>
          setMessages(current => [
            ...current,
            {
              role: "assistant",
              content:
                error.message || "I couldn't answer from your contracts.",
            },
          ]),
      }
    );
  };
  const toggleContract = (id: number) =>
    setSelectedIds(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id]
    );
  const suggestions = contracts.length
    ? [
        "Summarize my active contracts",
        "Which contracts are expiring soon?",
        "What obligations are still pending?",
        "Compare my uploaded contracts",
      ]
    : [
        "What contracts do I currently have?",
        "Summarize my active contracts",
        "What deadlines are coming up?",
      ];
  return (
    <div className="grid min-h-[calc(100vh-140px)] gap-5 lg:grid-cols-[260px_1fr]">
      <aside className="glass-panel rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#737984]">
              Knowledge source
            </div>
            <h2 className="mt-1 font-display text-base font-semibold text-[#f0f1f5]">
              My contracts
            </h2>
          </div>
          <button
            onClick={onUpload}
            className="button-ghost rounded-lg p-2"
            aria-label="Upload contract"
          >
            <Plus size={15} />
          </button>
        </div>
        <button
          onClick={() => setSelectedIds([])}
          className={`mt-5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs ${selectedIds.length === 0 ? "bg-[#5e6ad2]/20 text-[#d7d9ff]" : "text-[#9297a3] hover:bg-white/[.04]"}`}
        >
          <span
            className={`flex h-4 w-4 items-center justify-center rounded border ${selectedIds.length === 0 ? "border-[#8992ff] bg-[#6974e8]" : "border-white/[.18]"}`}
          >
            {selectedIds.length === 0 && <Check size={11} />}
          </span>
          All my contracts
        </button>
        <div className="mt-2 space-y-1">
          {contracts.map(contract => {
            const selected = selectedIds.includes(Number(contract.id));
            return (
              <button
                key={contract.id}
                onClick={() => toggleContract(Number(contract.id))}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs ${selected ? "bg-[#5e6ad2]/15 text-[#d7d9ff]" : "text-[#9297a3] hover:bg-white/[.04]"}`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? "border-[#8992ff] bg-[#6974e8]" : "border-white/[.18]"}`}
                >
                  {selected && <Check size={11} />}
                </span>
                <span className="truncate">{contract.name}</span>
              </button>
            );
          })}
        </div>
        {!contracts.length && (
          <div className="mt-5 rounded-xl border border-dashed border-white/[.12] p-3 text-xs leading-5 text-[#737984]">
            No uploaded contracts yet. Upload a PDF or DOCX to start asking
            questions.
          </div>
        )}
      </aside>
      <section className="glass-panel-strong flex min-h-[620px] flex-col rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/[.07] px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-[#aeb5ff]" />
              <h1 className="font-display text-lg font-semibold text-[#f3f3f6]">
                ContractLens AI
              </h1>
            </div>
            <p className="mt-1 text-xs text-[#737984]">
              Answers are restricted to your authenticated workspace.
            </p>
          </div>
          <button
            onClick={() => setMessages([])}
            className="button-ghost rounded-lg px-3 py-2 text-xs"
          >
            New chat
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {!messages.length && (
            <div className="mx-auto max-w-xl py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5e6ad2]/15 text-[#aeb5ff]">
                <MessageSquare size={24} />
              </div>
              <h2 className="mt-5 font-display text-2xl font-semibold text-[#f2f2f5]">
                Ask anything about your contracts
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#858b98]">
                Select one or more contracts on the left, or search your full
                library.
              </p>
              <div className="mt-7 grid gap-2 text-left sm:grid-cols-2">
                {suggestions.map(item => (
                  <button
                    key={item}
                    onClick={() => setQuestion(item)}
                    className="rounded-xl border border-white/[.08] bg-white/[.025] px-3 py-3 text-xs text-[#b8bcc8] transition hover:border-[#7c87f4]/40 hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-[#5e6ad2] text-white" : "border border-white/[.08] bg-white/[.03] text-[#d6d8e0]"}`}
              >
                {message.role === "assistant" ? (
                  <Streamdown>{message.content}</Streamdown>
                ) : (
                  message.content
                )}
                {message.sources?.length ? (
                  <div className="mt-4 border-t border-white/[.1] pt-3">
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[#858b98]">
                      Sources
                    </div>
                    {message.sources.map(source => (
                      <button
                        key={`${source.contractId}-${source.documentName}`}
                        onClick={() =>
                          onOpenContract(String(source.contractId))
                        }
                        className="mr-2 mb-1 inline-flex items-center gap-1 rounded-md bg-white/[.06] px-2 py-1 text-[11px] text-[#b8beff] hover:bg-white/[.1]"
                      >
                        <FileText size={11} />
                        {source.contractName}
                        {source.documentName ? ` · ${source.documentName}` : ""}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {ask.isPending && (
            <div className="text-xs text-[#858b98]">
              ContractLens is checking your workspace…
            </div>
          )}
        </div>
        <div className="border-t border-white/[.07] p-4">
          <div className="flex items-end gap-2 rounded-xl border border-white/[.1] bg-[#08080b] p-2 focus-within:border-[#7c87f4]/60">
            <textarea
              value={question}
              onChange={event => setQuestion(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask about your contracts…"
              rows={2}
              className="min-h-10 flex-1 resize-none bg-transparent px-2 py-1 text-sm text-[#e8e9ee] outline-none placeholder:text-[#5f6470]"
            />
            <button
              onClick={submit}
              disabled={!question.trim() || ask.isPending}
              className="button-primary rounded-lg p-2.5 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send question"
            >
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="mt-2 text-[10px] text-[#626874]">
            Contract-specific answers cite the source records available in your
            workspace.
          </div>
        </div>
      </section>
    </div>
  );
}

function AuthScreen({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070709] text-sm text-[#858b98]">
        Checking your secure session…
      </div>
    );
  }
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070709] px-5 text-center">
      <div className="ambient">
        <div className="ambient-blob one" />
        <div className="ambient-blob two" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7b86f5] to-[#414a9f] shadow-[0_8px_24px_rgba(94,106,210,.35)]">
          <FileCheck2 size={23} color="white" />
        </div>
        <div className="mt-6 text-[11px] font-semibold uppercase tracking-[.2em] text-[#7c87f4]">
          ContractLens
        </div>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-.06em] text-[#f4f4f6]">
          Understand every contract.
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#858b98]">
          Track every obligation with evidence-grounded intelligence built for
          modern teams.
        </p>
        <button
          onClick={() => startLogin()}
          className="button-primary mt-8 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
        >
          <ShieldCheck size={16} /> Continue with Manus
        </button>
        <p className="mt-5 text-[11px] text-[#626874]">
          Secure OAuth sign-in. ContractLens never stores your Google password.
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>(() =>
    typeof window !== "undefined" && window.location.pathname === "/chat"
      ? "chat"
      : "dashboard"
  );
  const [workspaceMode, setWorkspaceMode] = useState<"personal" | "demo">(
    "personal"
  );
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedContractId, setSelectedContractId] = useState<string | null>(
    null
  );
  const [uploadOpen, setUploadOpen] = useState(false);
  const { user, loading } = useAuth();
  const { data: account } = trpc.auth.account.useQuery();
  const userName = user?.name?.trim().split(/\s+/)[0] || "there";
  const isDemoWorkspace = workspaceMode === "demo";
  const workspaceName = isDemoWorkspace
    ? "Demo workspace"
    : account?.workspace?.name || "Your workspace";
  const listInput = useMemo(
    () => ({ search, status: "all", mode: workspaceMode }),
    [search, workspaceMode]
  );
  const dashboardInput = useMemo(
    () => ({ mode: workspaceMode }),
    [workspaceMode]
  );
  const { data: dashboard } = trpc.dashboard.overview.useQuery(dashboardInput);
  const { data: contracts = [] } = trpc.contracts.list.useQuery(listInput);
  const { data: obligations = [] } = trpc.obligations.list.useQuery({
    mode: workspaceMode,
  });
  const { data: alerts = [] } = trpc.alerts.list.useQuery({
    mode: workspaceMode,
  });
  const selectedInput = useMemo(
    () => ({ id: selectedContractId ?? "cld-001", mode: workspaceMode }),
    [selectedContractId, workspaceMode]
  );
  const { data: selectedContract } = trpc.contracts.get.useQuery(selectedInput);
  if (!loading && !user) return <AuthScreen loading={false} />;
  if (loading) return <AuthScreen loading />;
  const openContract = (id: string) => {
    setSelectedContractId(id);
    setView("contracts");
    setMobileMenu(false);
  };
  const openUpload = () => {
    if (isDemoWorkspace) {
      toast("Demo workspace is read-only. Switch to your workspace to upload.");
      return;
    }
    setUploadOpen(true);
  };
  const currentView =
    selectedContractId && view === "contracts" ? "contract-detail" : view;
  const renderView = () => {
    if (currentView === "contract-detail" && selectedContract)
      return (
        <ContractDetail
          contract={selectedContract}
          onBack={() => setSelectedContractId(null)}
          setView={setView}
        />
      );
    if (view === "dashboard" && dashboard)
      return (
        <DashboardView
          dashboard={dashboard}
          onOpenContract={openContract}
          setView={setView}
          userName={userName}
          workspaceName={workspaceName}
          onToggleWorkspace={() => {
            setWorkspaceMode(current =>
              current === "personal" ? "demo" : "personal"
            );
            setSelectedContractId(null);
          }}
        />
      );
    if (view === "contracts")
      return (
        <ContractListView
          contracts={contracts}
          search={search}
          setSearch={setSearch}
          onOpenContract={openContract}
          onUpload={openUpload}
        />
      );
    if (view === "obligations")
      return (
        <ObligationsView
          obligations={obligations}
          onOpenContract={openContract}
        />
      );
    if (view === "timeline")
      return <TimelineOverview obligations={obligations} />;
    if (view === "alerts") return <AlertsView alerts={alerts} />;
    if (view === "compare") return <CompareView contracts={contracts} />;
    if (view === "analytics")
      return <AnalyticsView contracts={contracts} obligations={obligations} />;
    if (view === "chat")
      return isDemoWorkspace ? (
        <div className="glass-panel rounded-2xl p-8 text-sm text-[#858b98]">
          AI Chat is connected to your personal workspace. Switch out of Demo
          workspace to search uploaded contracts.
        </div>
      ) : (
        <ChatView
          contracts={contracts}
          onUpload={openUpload}
          onOpenContract={openContract}
        />
      );
    if (view === "settings") return <SettingsView />;
    return (
      <div className="glass-panel rounded-2xl p-8 text-sm text-[#858b98]">
        Loading workspace…
      </div>
    );
  };
  return (
    <div className="app-shell">
      <div className="ambient">
        <div className="ambient-blob one" />
        <div className="ambient-blob two" />
      </div>
      <div className="app-content">
        <Sidebar
          view={view}
          setView={next => {
            setView(next);
            setSelectedContractId(null);
          }}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onUpload={openUpload}
          user={user}
          workspaceName={workspaceName}
        />
        <main
          className="workspace-main ml-[248px] min-h-screen transition-all duration-200"
          style={{ marginLeft: collapsed ? 76 : undefined }}
        >
          <Topbar
            view={view}
            onUpload={openUpload}
            onSearch={() => {
              setSelectedContractId(null);
              setView("contracts");
            }}
            onMobileMenu={() => setMobileMenu(!mobileMenu)}
          />
          {mobileMenu && (
            <div
              className="fixed inset-0 z-40 flex justify-start bg-black/60 md:hidden"
              onClick={() => setMobileMenu(false)}
            >
              <div
                className="h-full w-full max-w-[280px] shrink-0 overflow-y-auto border-r border-white/[.08] bg-[#09090c]"
                onClick={event => event.stopPropagation()}
              >
                <Sidebar
                  view={view}
                  setView={next => {
                    setView(next);
                    setSelectedContractId(null);
                    setMobileMenu(false);
                  }}
                  collapsed={false}
                  setCollapsed={() => undefined}
                  onUpload={() => {
                    openUpload();
                    setMobileMenu(false);
                  }}
                  user={user}
                  workspaceName={workspaceName}
                  mobile
                />
              </div>
            </div>
          )}
          <div className="mx-auto max-w-[1540px] p-5 md:p-8">
            {renderView()}
          </div>
        </main>
      </div>
      {uploadOpen && (
        <UploadDialog
          onClose={() => setUploadOpen(false)}
          onUploaded={contractId => {
            setUploadOpen(false);
            setSelectedContractId(contractId);
            setView("contracts");
          }}
        />
      )}
    </div>
  );
}
