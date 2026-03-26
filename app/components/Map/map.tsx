"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// @ts-expect-error Leaflet+Next: дефолтные iconUrl ломаются при сборке
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapProps {
  location: { lat: number; lng: number };
  setLocation: (loc: { lat: number; lng: number }) => void;
  markers: { lat: number; lng: number; problem: string }[];
  onLocationSelect?: () => void;
  /** Человекочитаемый адрес выбранной точки (обратное геокодирование) */
  selectedAddress?: string | null;
  addressLoading?: boolean;
}

function LocationMarker({
  setLocation,
  onLocationSelect,
}: {
  setLocation: MapProps["setLocation"];
  onLocationSelect?: MapProps["onLocationSelect"];
}) {
  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      onLocationSelect?.();
    },
  });
  return null;
}

export default function Map({
  location,
  setLocation,
  markers,
  onLocationSelect,
  selectedAddress = null,
  addressLoading = false,
}: MapProps) {
  const t = useTranslations("Map");
  const tCommon = useTranslations("Common");
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setMapReady(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, []);

  if (!mapReady) {
    return (
      <div className="h-full min-h-[280px] w-full animate-pulse bg-slate-200/80" />
    );
  }

  return (
    <div className="relative z-0 isolate h-full min-h-[280px] w-full min-w-0">
      <LeafletMapContainer
        center={[location.lat, location.lng]}
        zoom={13}
        scrollWheelZoom
        className="h-full w-full min-h-[280px]"
        style={{ height: "100%", width: "100%", minHeight: 280 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationMarker
          setLocation={setLocation}
          onLocationSelect={onLocationSelect}
        />

        {location.lat != null && location.lng != null && (
          <Marker position={[location.lat, location.lng]} opacity={0.6}>
            <Popup>
              <strong>{t("selectedTitle")}</strong>
              <br />
              <span style={{ fontSize: 13, lineHeight: 1.35 }}>
                {addressLoading
                  ? tCommon("loadingAddress")
                  : selectedAddress ??
                    `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
              </span>
              <br />
              <span style={{ fontSize: 12, color: "#64748b" }}>{t("selectedHint")}</span>
            </Popup>
          </Marker>
        )}

        {markers.map((marker, index) => (
          <Marker key={index} position={[marker.lat, marker.lng]}>
            <Popup>
              <div className="font-sans">
                <div
                  style={{ color: "#dc2626", fontWeight: "bold", marginBottom: "4px" }}
                >
                  ⚠️ {t("incidentTitle")}
                </div>
                <div style={{ fontSize: "13px", lineHeight: "1.2" }}>
                  {marker.problem}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </LeafletMapContainer>
    </div>
  );
}
