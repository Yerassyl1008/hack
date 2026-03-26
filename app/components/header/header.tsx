"use client";

import { useState } from "react";
import { Bell, CircleUser, Menu, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import LocaleSwitcher from "@/app/components/locale-switcher/locale-switcher";

const accent = "text-[#1a9b7a]";
const muted = "text-slate-500";

type TabId = "global" | "health";

type HeaderProps = {
  onMenuClick?: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const t = useTranslations("Header");
  const tCommon = useTranslations("Common");
  const [activeTab, setActiveTab] = useState<TabId>("global");

  return (
    <header className="z-20 flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b border-slate-200/80 bg-white px-3 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)] sm:gap-4 sm:px-6 lg:gap-8 rounded-tr-2xl">
      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          className="shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
          aria-label={tCommon("openMenu")}
        >
          <Menu className="h-6 w-6" strokeWidth={2} aria-hidden />
        </button>
      )}
      {/* Search */}
      <div className="relative min-w-0 w-full max-w-xs shrink-0 sm:max-w-sm">
        <Search
          className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${muted}`}
          strokeWidth={2}
          aria-hidden
        />
        <input
          type="search"
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-full border-0 bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none ring-1 ring-slate-200/60 transition focus:bg-white focus:ring-2 focus:ring-[#1a9b7a]/25"
        />
      </div>

      {/* Center tabs */}
      <nav
        className="flex flex-1 items-end justify-center gap-10 sm:gap-14"
        aria-label={t("tabsNavAria")}
      >
        <button
          type="button"
          onClick={() => setActiveTab("global")}
          className={`relative pb-2 text-sm font-medium transition-colors ${
            activeTab === "global" ? accent : `${muted} hover:text-slate-700`
          }`}
          aria-current={activeTab === "global" ? "page" : undefined}
        >
          {t("tabGlobal")}
          {activeTab === "global" && (
            <span
              className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[#1a9b7a]"
              aria-hidden
            />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("health")}
          className={`relative pb-2 text-sm font-medium transition-colors ${
            activeTab === "health" ? accent : `${muted} hover:text-slate-700`
          }`}
          aria-current={activeTab === "health" ? "page" : undefined}
        >
          {t("tabHealth")}
          {activeTab === "health" && (
            <span
              className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[#1a9b7a]"
              aria-hidden
            />
          )}
        </button>
      </nav>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <LocaleSwitcher />
        <button
          type="button"
          className={`text-sm font-medium ${accent} transition hover:opacity-80`}
        >
          {t("exportData")}
        </button>
        <span className="hidden h-5 w-px bg-slate-200 sm:block" aria-hidden />
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={`rounded-lg p-1.5 ${muted} transition hover:bg-slate-100 hover:text-slate-700`}
            aria-label={t("notifications")}
          >
            <Bell className="h-5 w-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            className={`rounded-full p-1 ${muted} transition hover:bg-slate-100 hover:text-slate-700`}
            aria-label={t("account")}
          >
            <CircleUser className="h-6 w-6" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  );
}
