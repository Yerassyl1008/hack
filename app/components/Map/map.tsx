"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type {
  IncidentMapMarker,
  MapFocusRequest,
} from "@/lib/incident-markers";
import type { Marker as LeafletMarker } from "leaflet";
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

const ERROR_MARKER_ICON = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapProps {
  location: { lat: number; lng: number };
  setLocation: (loc: { lat: number; lng: number }) => void;
  markers: IncidentMapMarker[];
  onLocationSelect?: () => void;
  selectedAddress?: string | null;
  addressLoading?: boolean;
  /** Центрирование на инциденте и открытие его балуна */
  mapFocusRequest?: MapFocusRequest | null;
  onMapFocusHandled?: () => void;
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

function MapFlyToPopup({
  request,
  markerByIdRef,
  onDone,
}: {
  request: MapFocusRequest | null;
  markerByIdRef: React.RefObject<globalThis.Map<string, LeafletMarker>>;
  onDone?: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!request) return;

    const { lat, lng, zoom, markerId } = request;
    let finished = false;
    let fallbackTimer: number | undefined;

    const onMoveEnd = () => {
      if (finished) return;
      finished = true;
      map.off("moveend", onMoveEnd);
      const tryOpen = () => markerByIdRef.current?.get(markerId)?.openPopup();
      tryOpen();
      fallbackTimer = window.setTimeout(() => {
        tryOpen();
        onDone?.();
      }, 220);
    };

    map.flyTo([lat, lng], zoom, { duration: 0.65 });
    map.once("moveend", onMoveEnd);

    return () => {
      map.off("moveend", onMoveEnd);
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
    };
  }, [map, request, markerByIdRef, onDone]);

  return null;
}

function MapInner({
  location,
  setLocation,
  markers,
  onLocationSelect,
  selectedAddress,
  addressLoading,
  mapFocusRequest,
  onMapFocusHandled,
}: MapProps) {
  const t = useTranslations("Map");
  const tCommon = useTranslations("Common");
  const markerByIdRef = useRef<globalThis.Map<string, LeafletMarker>>(
    new globalThis.Map()
  );

  const setMarkerRef = useCallback((id: string) => {
    return (instance: LeafletMarker | null) => {
      if (instance) markerByIdRef.current.set(id, instance);
      else markerByIdRef.current.delete(id);
    };
  }, []);

  const renderIncidentPopup = (marker: IncidentMapMarker) => (
    <Popup>
      <div className="font-sans" style={{ minWidth: 200, maxWidth: 280 }}>
        {marker.severity === "error" ? (
          <>
            <div
              style={{
                color: "#b91c1c",
                fontWeight: "bold",
                marginBottom: 6,
                fontSize: 13,
              }}
            >
              ⚠️ {t("incidentErrorTitle")}
            </div>
            <div style={{ fontSize: "13px", lineHeight: 1.35, color: "#1e293b" }}>
              {marker.problem}
            </div>
            {marker.recommendation ? (
              <div style={{ marginTop: 10 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: "#64748b",
                    marginBottom: 4,
                  }}
                >
                  {t("recommendationCaption")}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.35, color: "#334155" }}>
                  {marker.recommendation}
                </div>
              </div>
            ) : null}
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 8, lineHeight: 1.3 }}>
              {t("incidentErrorHint")}
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                color: "#0f766e",
                fontWeight: "bold",
                marginBottom: 6,
                fontSize: 13,
              }}
            >
              📍 {t("incidentRecordedTitle")}
            </div>
            <div style={{ fontSize: "13px", lineHeight: 1.35, color: "#1e293b" }}>
              {marker.problem}
            </div>
            {marker.recommendation ? (
              <div style={{ marginTop: 10 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: "#64748b",
                    marginBottom: 4,
                  }}
                >
                  {t("recommendationCaption")}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.35, color: "#334155" }}>
                  {marker.recommendation}
                </div>
              </div>
            ) : null}
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 8, lineHeight: 1.3 }}>
              {t("incidentRecordedHint")}
            </div>
          </>
        )}
      </div>
    </Popup>
  );

  return (
    <>
      <MapFlyToPopup
        request={mapFocusRequest ?? null}
        markerByIdRef={markerByIdRef}
        onDone={onMapFocusHandled}
      />

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

      {markers.map((marker) =>
        marker.severity === "error" ? (
          <Marker
            key={marker.id}
            ref={setMarkerRef(marker.id)}
            position={[marker.lat, marker.lng]}
            icon={ERROR_MARKER_ICON}
          >
            {renderIncidentPopup(marker)}
          </Marker>
        ) : (
          <Marker
            key={marker.id}
            ref={setMarkerRef(marker.id)}
            position={[marker.lat, marker.lng]}
          >
            {renderIncidentPopup(marker)}
          </Marker>
        )
      )}
    </>
  );
}

export default function Map({
  location,
  setLocation,
  markers,
  onLocationSelect,
  selectedAddress = null,
  addressLoading = false,
  mapFocusRequest = null,
  onMapFocusHandled,
}: MapProps) {
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
        <MapInner
          location={location}
          setLocation={setLocation}
          markers={markers}
          onLocationSelect={onLocationSelect}
          selectedAddress={selectedAddress}
          addressLoading={addressLoading}
          mapFocusRequest={mapFocusRequest}
          onMapFocusHandled={onMapFocusHandled}
        />
      </LeafletMapContainer>
    </div>
  );
}
