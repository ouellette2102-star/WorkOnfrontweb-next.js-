"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import type { MissionResponse } from "@/lib/api-client";
import "leaflet/dist/leaflet.css";

/**
 * Leaflet map component for displaying missions.
 *
 * Uses the imperative Leaflet API (not react-leaflet) so we have direct
 * control over the create/destroy lifecycle. react-leaflet 4 throws
 * "Map container is already initialized." under React 19 StrictMode in
 * dev and after Next 16 client-cache back-nav, both of which replay a
 * mount on the same DOM that still carries a stale `_leaflet_id`.
 *
 * Pin overlap handling: many seed missions share the exact same lat/lng
 * (the Montreal centroid 45.5017,-73.5673). When 2+ missions land on
 * one cell we spread them in a tight ring around the original point so
 * every pin stays clickable instead of stacking into one.
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

/**
 * Spread pins that share an identical (lat,lng) cell on a tight ring so
 * each pin stays clickable. The first mission stays on the original
 * point; siblings 2..N go around it on a small circle expressed in
 * degrees, scaled by zoom so the ring shrinks as the user zooms in.
 */
function spreadOverlappingPins(
  missions: MissionResponse[],
  zoom: number,
): Array<MissionResponse & { displayLat: number; displayLng: number }> {
  const ringRadiusDeg = 0.0006 * Math.pow(2, Math.max(0, 12 - zoom));
  const buckets = new Map<string, MissionResponse[]>();
  for (const m of missions) {
    if (typeof m.latitude !== "number" || typeof m.longitude !== "number") {
      continue;
    }
    const key = `${m.latitude.toFixed(4)}_${m.longitude.toFixed(4)}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(m);
    buckets.set(key, bucket);
  }

  const spread: Array<
    MissionResponse & { displayLat: number; displayLng: number }
  > = [];
  for (const bucket of buckets.values()) {
    if (bucket.length === 1) {
      spread.push({
        ...bucket[0],
        displayLat: bucket[0].latitude,
        displayLng: bucket[0].longitude,
      });
      continue;
    }
    bucket.forEach((m, i) => {
      if (i === 0) {
        spread.push({ ...m, displayLat: m.latitude, displayLng: m.longitude });
        return;
      }
      const angle = (2 * Math.PI * (i - 1)) / Math.max(1, bucket.length - 1);
      spread.push({
        ...m,
        displayLat: m.latitude + ringRadiusDeg * Math.cos(angle),
        displayLng: m.longitude + ringRadiusDeg * Math.sin(angle),
      });
    });
  }
  return spread;
}

function radiusToZoom(radiusKm: number): number {
  if (radiusKm <= 5) return 14;
  if (radiusKm <= 10) return 13;
  if (radiusKm <= 25) return 11;
  if (radiusKm <= 50) return 10;
  return 9;
}

export default function MissionMap({
  missions,
  center,
  radiusKm,
  onPinClick,
}: MissionMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const onPinClickRef = useRef(onPinClick);

  // Keep the callback fresh for marker handlers without re-binding them.
  useEffect(() => {
    onPinClickRef.current = onPinClick;
  }, [onPinClick]);

  // Mount once per component lifecycle; teardown owns the cleanup.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Defensive: if a previous mount didn't fully clean up (e.g. dev
    // HMR), strip the marker that makes Leaflet refuse to re-init.
    const stamped = el as HTMLDivElement & { _leaflet_id?: number };
    if (stamped._leaflet_id) {
      delete stamped._leaflet_id;
    }

    const map = L.map(el, {
      center,
      zoom: radiusToZoom(radiusKm),
      scrollWheelZoom: true,
      zoomControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      },
    ).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = markersLayer;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      if (stamped._leaflet_id) {
        delete stamped._leaflet_id;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Recenter when the parent moves the camera.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView(center, map.getZoom());
  }, [center]);

  // Re-zoom when the radius filter changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setZoom(radiusToZoom(radiusKm));
  }, [radiusKm]);

  const displayMissions = useMemo(
    () => spreadOverlappingPins(missions, radiusToZoom(radiusKm)),
    [missions, radiusKm],
  );

  // Re-render markers whenever the spread set changes.
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const m of displayMissions) {
      const marker = L.marker([m.displayLat, m.displayLng], {
        icon: isBoosted(m) ? boostedMissionIcon : missionIcon,
      });
      marker.on("click", () => {
        onPinClickRef.current?.(m);
      });
      marker.addTo(layer);
    }
  }, [displayMissions]);

  return (
    <div
      ref={containerRef}
      className="h-[50vh] w-full rounded-2xl overflow-hidden border border-workon-border"
    />
  );
}
