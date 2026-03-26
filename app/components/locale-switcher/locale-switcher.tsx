"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const shortLabel: Record<string, string> = {
  ru: "RU",
  kk: "KZ",
  en: "EN",
};

export default function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold sm:text-xs"
      role="group"
      aria-label={t("label")}
    >
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => router.replace(pathname, { locale: l })}
          className={`rounded-md px-2 py-1 transition ${
            locale === l
              ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
              : "text-slate-500 hover:bg-slate-200/60 hover:text-slate-800"
          }`}
          aria-pressed={locale === l}
        >
          {shortLabel[l] ?? l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
