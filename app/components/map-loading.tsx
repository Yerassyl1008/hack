"use client";

import { useTranslations } from "next-intl";

export default function MapLoading() {
  const t = useTranslations("Map");
  return (
    <div className="flex h-full min-h-[280px] w-full items-center justify-center animate-pulse bg-slate-100">
      {t("loading")}
    </div>
  );
}
