"use client";

import React, { useState } from "react";
import { MapPin, ShieldAlert, Upload, AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import Header from "@/app/components/header/header";
import MapLoading from "@/app/components/map-loading";
import Sidebar, { type NavId } from "@/app/components/sidebar/sidebar";
import WasteScanner from "@/app/components/waste-scanner/waste-scanner";
import { analyzeImage } from "@/lib/api";
import { useReverseGeocode } from "@/lib/use-reverse-geocode";

const LeafletMap = dynamic(() => import("@/app/components/Map/map"), {
  ssr: false,
  loading: () => <MapLoading />,
});

type Urgency = "high" | "medium" | "low";

export default function Dashboard() {
  const t = useTranslations("Dashboard");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const [activeNav, setActiveNav] = useState<NavId>("waste-scanner");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);

  const handleNavigate = (id: NavId) => {
    setActiveNav(id);
    setSidebarOpen(false);
  };

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    problem: string;
    category: string;
    urgency: Urgency;
    recommendation: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const [location, setLocation] = useState({ lat: 42.3417, lng: 69.5901 });

  const { address: placeLabel, loading: addressLoading } = useReverseGeocode(
    location.lat,
    location.lng,
    locationSelected,
    locale
  );

  const [incidentMarkers, setIncidentMarkers] = useState<
    { lat: number; lng: number; problem: string }[]
  >([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysis(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;
    setLoading(true);

    try {
      const { analysis: data } = await analyzeImage(
        selectedImage,
        location.lat,
        location.lng
      );
      if (data) {
        setAnalysis({
          problem: data.title,
          category: data.category,
          urgency: "medium",
          recommendation: data.description,
        });
        setIncidentMarkers((prev) => [
          ...prev,
          {
            lat: location.lat,
            lng: location.lng,
            problem: data.title,
          },
        ]);
      }
    } catch (err) {
      console.error("Error analyzing image:", err);
    } finally {
      setLoading(false);
    }
  };

  const urgencyClass =
    analysis?.urgency === "high"
      ? "text-red-600"
      : analysis?.urgency === "medium"
        ? "text-orange-500"
        : "text-green-600";

  return (
    <div className="relative flex h-screen min-h-0 w-full bg-slate-50 font-sans text-slate-900">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label={tCommon("closeMenu")}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar activeId={activeNav} onNavigate={handleNavigate} mobileOpen={sidebarOpen} />
      {activeNav === "waste-scanner" ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <div className="flex min-h-0 min-w-0 shrink-0 flex-col overflow-hidden border-b border-slate-200/90 bg-slate-50 max-md:flex-none md:w-[35%] md:min-w-[12rem] md:max-w-xl md:border-b-0 md:border-r">
              <WasteScanner
                location={location}
                locationReady={locationSelected}
                placeLabel={placeLabel}
                placeLoading={addressLoading}
                onAnalysisSuccess={(summary) =>
                  setIncidentMarkers((prev) => [
                    ...prev,
                    {
                      lat: location.lat,
                      lng: location.lng,
                      problem: summary,
                    },
                  ])
                }
              />
            </div>
            <div className="relative z-0 min-h-0 min-w-0 flex-1 max-md:min-h-[40vh]">
              <LeafletMap
                location={location}
                setLocation={setLocation}
                markers={incidentMarkers}
                onLocationSelect={() => setLocationSelected(true)}
                selectedAddress={placeLabel}
                addressLoading={addressLoading}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          {activeNav === "dashboard" && (
            <div className="flex min-h-0 flex-1">
              <div className="relative z-0 min-h-0 flex-1">
                <LeafletMap
                  location={location}
                  setLocation={setLocation}
                  markers={incidentMarkers}
                  onLocationSelect={() => setLocationSelected(true)}
                />
              </div>

              <div className="z-10 flex h-full min-h-0 w-[450px] flex-col overflow-y-auto border-l bg-white shadow-xl">
                <div className="bg-slate-900 p-6 text-white">
                  <h2 className="flex items-center gap-2 text-xl font-bold">
                    <ShieldAlert className="h-6 w-6 text-red-500" />
                    {t("smartCityTitle")}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">{t("smartCitySubtitle")}</p>
                </div>

                <div className="flex flex-1 flex-col gap-6 p-6">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      {t("uploadEvidence")}
                    </label>
                    <div className="relative cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-4 text-center transition hover:bg-slate-50">
                      <input
                        type="file"
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        onChange={handleImageChange}
                        accept="image/*"
                      />
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={t("previewAlt")}
                          className="mx-auto max-h-48 rounded object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center py-4 text-slate-500">
                          <Upload className="mb-2 h-8 w-8 opacity-50" />
                          <span className="text-sm">{t("clickOrDrag")}</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={!selectedImage || loading}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded bg-blue-600 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:bg-slate-300"
                    >
                      {loading ? t("analyzing") : t("startAnalysis")}
                    </button>
                  </div>

                  {analysis && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 border-t pt-6">
                      <div className="mb-4 flex items-center gap-2 font-bold text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        {t("criticalAlert")}
                      </div>

                      <div className="mb-4">
                        <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">
                          {t("photoAnalyzed")}
                        </p>
                        <h3 className="text-lg font-bold leading-tight">{analysis.problem}</h3>
                      </div>

                      <div className="mb-6 grid grid-cols-2 gap-2">
                        <div className="rounded bg-slate-100 p-3">
                          <p className="text-[10px] font-bold uppercase text-slate-400">
                            {t("category")}
                          </p>
                          <p className="text-sm font-semibold capitalize">{analysis.category}</p>
                        </div>
                        <div className="rounded bg-slate-100 p-3">
                          <p className="text-[10px] font-bold uppercase text-slate-400">
                            {t("urgency")}
                          </p>
                          <p className={`text-sm font-semibold uppercase ${urgencyClass}`}>
                            {t(`urgencyLevels.${analysis.urgency}`)}
                          </p>
                        </div>

                        <div className="col-span-2 flex items-start justify-between gap-2 rounded bg-slate-100 p-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                              {t("locationPlace")}
                            </p>
                            {addressLoading ? (
                              <p className="mt-1 text-sm text-slate-600">
                                {tCommon("loadingAddress")}
                              </p>
                            ) : (
                              <p
                                className={`mt-1 text-sm font-semibold text-slate-800 ${
                                  placeLabel ? "" : "font-mono"
                                }`}
                              >
                                {placeLabel ??
                                  `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
                              </p>
                            )}
                          </div>
                          <MapPin className="h-5 w-5 shrink-0 text-slate-400" />
                        </div>
                      </div>

                      <div className="mb-6 rounded-r border-l-4 border-red-600 bg-red-50 p-4">
                        <p className="mb-1 text-[10px] font-bold uppercase text-red-600">
                          {t("autoRecommendation")}
                        </p>
                        <p className="text-sm leading-relaxed text-slate-700">
                          {analysis.recommendation}
                        </p>
                      </div>

                      <div className="mt-auto flex gap-2">
                        <button
                          type="button"
                          className="flex-1 rounded bg-slate-900 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-slate-800"
                        >
                          {t("ignoreCase")}
                        </button>
                        <button
                          type="button"
                          className="flex-1 rounded bg-[#007F5F] py-3 text-sm font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-emerald-700"
                        >
                          {t("dispatchTeam")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeNav !== "dashboard" && (
            <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-50 p-8 text-center text-slate-500">
              <p className="text-sm font-medium">{tCommon("sectionInDevelopment")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
