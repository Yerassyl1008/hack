"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import AnalyticsWorkQueue from "@/app/components/analytics-work-queue/analytics-work-queue";
import Header from "@/app/components/header/header";
import IncidentList from "@/app/components/incident-list/incident-list";
import MapLoading from "@/app/components/map-loading";
import Sidebar, { type NavId } from "@/app/components/sidebar/sidebar";
import WasteScanner from "@/app/components/waste-scanner/waste-scanner";
import {
  loadPersistedMarkers,
  newMarkerId,
  savePersistedMarkers,
  type IncidentMapMarker,
  type MapFocusRequest,
} from "@/lib/incident-markers";
import { useReverseGeocode } from "@/lib/use-reverse-geocode";

const LeafletMap = dynamic(() => import("@/app/components/Map/map"), {
  ssr: false,
  loading: () => <MapLoading />,
});

export default function Dashboard() {
  const tIncidents = useTranslations("Incidents");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const [activeNav, setActiveNav] = useState<NavId>("waste-scanner");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);

  const handleNavigate = (id: NavId) => {
    setActiveNav(id);
    setSidebarOpen(false);
  };

  const [location, setLocation] = useState({ lat: 42.3417, lng: 69.5901 });

  const { address: placeLabel, loading: addressLoading } = useReverseGeocode(
    location.lat,
    location.lng,
    locationSelected,
    locale
  );

  const [incidentMarkers, setIncidentMarkers] = useState<IncidentMapMarker[]>(
    () => loadPersistedMarkers()
  );

  useEffect(() => {
    savePersistedMarkers(incidentMarkers);
  }, [incidentMarkers]);

  const [mapFocusRequest, setMapFocusRequest] = useState<MapFocusRequest | null>(
    null
  );

  const handleMapFocusHandled = useCallback(() => {
    setMapFocusRequest(null);
  }, []);

  const openMarkerOnCityMap = useCallback((m: IncidentMapMarker) => {
    setLocation({ lat: m.lat, lng: m.lng });
    setLocationSelected(true);
    setMapFocusRequest({
      lat: m.lat,
      lng: m.lng,
      zoom: 17,
      markerId: m.id,
      token: Date.now(),
    });
    setActiveNav("city-map");
    setSidebarOpen(false);
  }, []);

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
                onMapIncident={({ summary, severity }) =>
                  setIncidentMarkers((prev) => [
                    ...prev,
                    {
                      id: newMarkerId(),
                      lat: location.lat,
                      lng: location.lng,
                      problem: summary,
                      severity,
                      createdAt: Date.now(),
                      ...(placeLabel ? { address: placeLabel } : {}),
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
                mapFocusRequest={mapFocusRequest}
                onMapFocusHandled={handleMapFocusHandled}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          {activeNav === "city-map" && (
            <div className="relative z-0 flex min-h-0 min-w-0 flex-1">
              <LeafletMap
                location={location}
                setLocation={setLocation}
                markers={incidentMarkers}
                onLocationSelect={() => setLocationSelected(true)}
                selectedAddress={placeLabel}
                addressLoading={addressLoading}
                mapFocusRequest={mapFocusRequest}
                onMapFocusHandled={handleMapFocusHandled}
              />
            </div>
          )}
          {activeNav === "incident-reports" && (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden bg-slate-50 px-4 py-4 sm:px-6 sm:py-6">
              <header className="shrink-0">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  {tIncidents("title")}
                </h1>
                <p className="mt-1 text-sm text-slate-500">{tIncidents("subtitle")}</p>
              </header>
              <IncidentList
                markers={incidentMarkers}
                locale={locale}
                onShowOnMap={openMarkerOnCityMap}
              />
            </div>
          )}
          {activeNav === "analytics" && (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-50 px-4 py-4 sm:px-6 sm:py-6">
              <AnalyticsWorkQueue
                markers={incidentMarkers}
                locale={locale}
                onDelete={(id) =>
                  setIncidentMarkers((prev) => prev.filter((x) => x.id !== id))
                }
                onClearAll={() => setIncidentMarkers([])}
                onShowOnMap={openMarkerOnCityMap}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
