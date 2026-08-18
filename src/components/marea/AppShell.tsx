import { useState, type ReactNode } from "react";
import {
  Activity,
  BellRing,
  FlaskConical,
  LayoutDashboard,
  LineChart,
  Menu,
  Radio,
  UploadCloud,
  Settings2,
  Waves,
  X,
} from "lucide-react";
import { BRAND, SITE_CONTEXT } from "@/data/marea";
import { AskMarea } from "./AskMarea";
import { cn } from "@/lib/utils";

export type PageId =
  | "overview"
  | "monitoring"
  | "alerts"
  | "sensors"
  | "import"
  | "analytics"
  | "research"
  | "settings";

export interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "Operations" | "Research" | "System";
  badge?: number;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "Operations" },
  { id: "monitoring", label: "Monitoring", icon: Activity, group: "Operations" },
  { id: "alerts", label: "Alerts", icon: BellRing, group: "Operations" },
  { id: "sensors", label: "Sensors & Fleet", icon: Radio, group: "Operations" },
  { id: "import", label: "Import Data", icon: UploadCloud, group: "Operations" },
  { id: "analytics", label: "Analytics", icon: LineChart, group: "Research" },
  { id: "research", label: "Data & Provenance", icon: FlaskConical, group: "Research" },
  { id: "settings", label: "Settings & Simulator", icon: Settings2, group: "System" },
];

function NavList({
  currentPage,
  onNavigate,
  unreadAlertCount = 0,
}: {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  unreadAlertCount?: number;
}) {
  const groups: Array<"Operations" | "Research" | "System"> = ["Operations", "Research", "System"];

  return (
    <nav aria-label="Main" className="space-y-6">
      {groups.map((group) => {
        const items = NAV_ITEMS.filter((item) => item.group === group);
        if (items.length === 0) return null;

        return (
          <div key={group}>
            <p className="eyebrow px-3 pb-2 text-ink-muted">{group}</p>
            <ul className="space-y-0.5">
              {items.map(({ id, label, icon: Icon }) => {
                const active = currentPage === id;
                const isAlert = id === "alerts" && unreadAlertCount > 0;

                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(id)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex w-full min-h-10 items-center justify-between gap-3 rounded-lg px-3 text-sm font-medium transition-colors text-left",
                        active
                          ? "bg-ink-foreground/10 text-ink-foreground shadow-xs font-semibold"
                          : "text-ink-muted hover:bg-ink-foreground/5 hover:text-ink-foreground",
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={cn("size-4 shrink-0", active ? "text-primary-foreground" : "text-ink-muted")} />
                        <span className="truncate">{label}</span>
                      </div>
                      {isAlert ? (
                        <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-[0.65rem] font-bold text-white">
                          {unreadAlertCount}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function RailContent({
  currentPage,
  onNavigate,
  unreadAlertCount = 0,
}: {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  unreadAlertCount?: number;
}) {
  return (
    <div className="flex h-full flex-col bg-ink text-ink-foreground">
      {/* Brand header */}
      <div className="flex items-center gap-3 border-b border-ink-border px-5 py-5">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-ink-border bg-ink-foreground/8"
        >
          <Waves className="size-5 text-ink-foreground" />
        </span>
        <div className="min-w-0">
          <p className="text-base font-bold tracking-[0.14em] text-ink-foreground">{BRAND.name}</p>
          <p className="text-[0.7rem] leading-snug text-ink-muted truncate">{BRAND.tagline}</p>
        </div>
      </div>

      {/* Navigation menu */}
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <NavList
          currentPage={currentPage}
          onNavigate={onNavigate}
          unreadAlertCount={unreadAlertCount}
        />
      </div>

      {/* Footer controls & live status */}
      <div className="space-y-3 border-t border-ink-border p-3">
        <AskMarea />
        <div className="rounded-lg border border-ink-border bg-ink-foreground/5 px-3 py-2.5">
          <p className="text-[0.65rem] uppercase font-semibold tracking-wider text-ink-muted">Site Location</p>
          <p className="mt-0.5 text-xs font-medium text-ink-foreground truncate">{SITE_CONTEXT.name}</p>
          <div className="mt-1 flex items-center justify-between text-[0.65rem] text-ink-muted">
            <span className="flex items-center gap-1.5 text-positive-foreground">
              <span className="size-1.5 rounded-full bg-positive" />
              Node Ready
            </span>
            <span className="tabular">{SITE_CONTEXT.coordinates}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  currentPage,
  onNavigate,
  unreadAlertCount = 0,
  children,
}: {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  unreadAlertCount?: number;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMobileNavigate = (page: PageId) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* Desktop sidebar rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-ink-border lg:block">
        <RailContent
          currentPage={currentPage}
          onNavigate={onNavigate}
          unreadAlertCount={unreadAlertCount}
        />
      </aside>

      {/* Mobile top navigation header */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-ink-border bg-ink px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <Waves aria-hidden className="size-5 text-ink-foreground" />
          <span className="text-base font-bold tracking-[0.12em] text-ink-foreground">{BRAND.name}</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          className="flex size-10 items-center justify-center rounded-lg border border-ink-border text-ink-foreground hover:bg-ink-foreground/10"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 top-[57px] z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-foreground/30 backdrop-blur-xs"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-raised">
            <RailContent
              currentPage={currentPage}
              onNavigate={handleMobileNavigate}
              unreadAlertCount={unreadAlertCount}
            />
          </div>
        </div>
      ) : null}

      {/* Main content container */}
      <main id="main" className="lg:pl-64">
        <div className="mx-auto w-full max-w-[86rem] space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
