"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import type { MissionResponse } from "@/lib/api-client";
import "leaflet/dist/leaflet.css";

/**
 * Leaflet map component for displaying missions.
 *
 * Uses CartoDB Positron tiles (light, clean) matching the Emergent design.
 * Custom DivIcon pins (green default, orange-red for boosted/urgent).
 * Pin click invokes parent-provided `onPinClick(mission)` — parent is
 * responsible for rendering the detail UI (bottom sheet on mobile).
 *
 * QA report C1 / Sprint 2: this previously crashed with
 * "Map container is already initialized" under React 19 StrictMode
 * + Next.js 16 because the underlying <div> kept its `_leaflet_id`
 * across the StrictMode double-mount. Fixed by holding a ref to the
 * Leaflet `Map` instance and explicitly calling `remove()` on unmount,
 * plus a stable `mapKey` so React never reuses the same DOM node
 * between mount cycles.
 */

function createMissionIcon(boosted = false) {
  const color = boosted ? "#C96646" : "#134021";
  return L.divIcon({
    className: "mission-pin",
    html: `<div style="
      width: 32px; height: 32px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      cursor: pointer;
    "><div style="
      width: 8px; height: 8px;
      background: white;
      border-radius: 50%;
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
    "></div></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

const missionIcon = createMissionIcon(false);
const boostedMissionIcon = createMissionIcon(true);

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prevRef = useRef({ lat, lng });

  useEffect(() => {
    if (prevRef.current.lat !== lat || prevRef.current.lng !== lng) {
      prevRef.current = { lat, lng };
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);

  return null;
}

interface MissionMapProps {
  missions: MissionResponse[];
  center: [number, number];
  radiusKm: number;
  onPinClick?: (mission: MissionResponse) => void;
}

function isBoosted(m: MissionResponse): boolean {
  const boostedUntil = (m as unknown as { boostedUntil?: string | null })
    .boostedUntil;
  const urgentUntil = (m as unknown as { urgentUntil?: string | null })
    .urgentUntil;
  const isUrgent = (m as unknown as { isUrgent?: boolean }).isUrgent;
  const now = Date.now();
  if (isUrgent && (!urgentUntil || new Date(urgentUntil).getTime() > now)) {
    return true;
  }
  if (boostedUntil && new Date(boostedUntil).getTime() > now) {
    return true;
  }
  return false;
}

export default function MissionMap({
  missions,
  center,
  radiusKm,
  onPinClick,
}: MissionMapProps) {
  const zoom =
    radiusKm <= 5
      ? 14
      : radiusKm <= 10
        ? 13
        : radiusKm <= 25
          ? 11
          : radiusKm <= 50
            ? 10
            : 9;

  // Stable per-instance key. React StrictMode mounts the component
  // twice in dev — without a fresh key, the second mount tries to
  // attach Leaflet to the same DOM node that still carries the
  // first mount's _leaflet_id, throwing "Map container is already
  // initialized". useState lazy-init guarantees the key is computed
  // exactly once per real mount cycle (not once per render).
  const [mapKey] = useState(
    () => `mm-${Math.random().toString(36).slice(2, 11)}`,
  );

  // Hold the Leaflet Map instance so we can dispose it explicitly
  // on unmount, freeing the underlying <div> from _leaflet_id.
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <MapContainer
      key={mapKey}
      ref={(instance) => {
        if (instance) {
          mapRef.current = instance;
        }
      }}
      center={center}
      zoom={zoom}
      className="h-[50vh] w-full rounded-2xl overflow-hidden border border-workon-border"
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <RecenterMap lat={center[0]} lng={center[1]} />

      {missions.map((m) => (
        <Marker
          key={m.id}
          position={[m.latitude, m.longitude]}
          icon={isBoosted(m) ? boostedMissionIcon : missionIcon}
          eventHandlers={{
            click: () => {
              onPinClick?.(m);
            },
          }}
        />
      ))}
    </MapContainer>
  );
}
