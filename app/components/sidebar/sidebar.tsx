"use client";

import {
  AlertOctagon,
  BarChart2,
  HelpCircle,
  LayoutGrid,
  Map,
  Plus,
  ScanLine,
  Settings,
} from "lucide-react";

export type NavId =
  | "dashboard"
  | "analytics"
  | "waste-scanner"
  | "city-map"
  | "incident-reports";

const navItems: { id: NavId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "waste-scanner", label: "Waste Scanner", icon: ScanLine },
  { id: "city-map", label: "City Map", icon: Map },
  { id: "incident-reports", label: "Incident Reports", icon: AlertOctagon },
];

type SidebarProps = {
  activeId: NavId;
  onNavigate: (id: NavId) => void;
  /** Открыт ли выезд на мобильных (на lg+ не используется) */
  mobileOpen?: boolean;
};

export default function Sidebar({ activeId, onNavigate, mobileOpen = false }: SidebarProps) {
  return (
    <aside
      className={`flex h-screen w-[min(18rem,85vw)] shrink-0 flex-col border-r border-slate-200/90 bg-slate-50 transition-transform duration-200 ease-out lg:relative lg:z-0 lg:w-[15%] lg:min-w-[11rem] lg:max-w-[20rem] lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } fixed inset-y-0 left-0 z-50 lg:static`}
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <h1 className="text-lg font-bold tracking-tight text-emerald-800">
          Tactical Ecology
        </h1>
        <p className="mt-1 text-sm text-gray-500">City Monitoring v2.1</p>
      </div>

      {/* Primary nav */}
      <nav className="flex flex-col gap-0.5 px-3" aria-label="Application">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = activeId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={active ? "page" : undefined}
              className={`relative flex w-full items-center gap-3 rounded-lg border-r-4 py-2.5 pl-3 pr-3 text-left text-sm font-medium transition-colors ${
                active
                  ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                  : "border-transparent text-gray-500 hover:bg-slate-100/80 hover:text-gray-700"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${active ? "text-emerald-700" : "text-gray-500"}`}
                strokeWidth={active ? 2.25 : 2}
                aria-hidden
              />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="min-h-6 flex-1" aria-hidden />

      {/* Bottom */}
      <div className="border-t border-slate-200/90 px-3 pb-6 pt-5">
        <button
          type="button"
          className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          <span className="items-center justify-center">
          New Incident
          </span>
        </button>

        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg py-2.5 pl-3 pr-4 text-left text-sm font-medium text-gray-500 transition hover:bg-slate-100/80 hover:text-gray-700"
          >
            <Settings className="h-5 w-5 shrink-0 text-gray-500" strokeWidth={2} aria-hidden />
            Settings
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg py-2.5 pl-3 pr-4 text-left text-sm font-medium text-gray-500 transition hover:bg-slate-100/80 hover:text-gray-700"
          >
            <HelpCircle className="h-5 w-5 shrink-0 text-gray-500" strokeWidth={2} aria-hidden />
            Support
          </button>
        </div>
      </div>
    </aside>
  );
}
