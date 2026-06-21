"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { MissionFeedItem } from "@/types/mission";
import { AlertTriangle, MapPin } from "lucide-react";

type Props = {
  missions: MissionFeedItem[];
  userLocation: { lat: number; lng: number } | null;
  onReserve: (missionId: string) => void;
};

function escapeHtml(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function MissionMap({ missions, userLocation, onReserve }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!mapContainerRef.current || mapRef.current) return;

      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const defaultCenter: [number, number] = [45.5017, -73.5673];
      const center: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : defaultCenter;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView(center, 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      if (userLocation) {
        const userIcon = L.divIcon({
          className: "workon-user-location-marker",
          html: '<div style="background:#134021;border:3px solid white;border-radius:999px;width:24px;height:24px;box-shadow:0 8px 22px rgba(19,64,33,.28);"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup("<strong>Votre position</strong>");
      }

      const bounds: [number, number][] = [];

      missions.forEach((mission) => {
        if (mission.latitude === null || mission.longitude === null) return;

        const lat = mission.latitude;
        const lng = mission.longitude;
        bounds.push([lat, lng]);

        const missionIcon = L.divIcon({
          className: "workon-mission-marker",
          html: `
            <div style="background:#0B2F1D;border:3px solid #fff;border-radius:18px;min-width:46px;height:34px;display:flex;align-items:center;justify-content:center;padding:0 8px;color:#E8BF73;font-size:11px;font-weight:900;box-shadow:0 12px 28px rgba(11,47,29,.28);">
              ${escapeHtml(formatMoney(mission.priceCents))}
            </div>
          `,
          iconSize: [46, 34],
          iconAnchor: [23, 34],
        });

        const marker = L.marker([lat, lng], { icon: missionIcon }).addTo(map);
        const missionId = escapeHtml(mission.id);
        const popupContent = `
          <div style="min-width:220px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px;">
              <div>
                <p style="margin:0 0 4px;color:#8A8175;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;">Mission ouverte</p>
                <h3 style="margin:0;color:#1B1A18;font-size:16px;font-weight:850;line-height:1.2;">${escapeHtml(mission.title)}</h3>
              </div>
              <strong style="color:#134021;white-space:nowrap;">${escapeHtml(formatMoney(mission.priceCents))}</strong>
            </div>
            ${mission.distance !== null ? `<p style="margin:0 0 6px;color:#5D564F;font-size:13px;">Distance: ${escapeHtml(String(mission.distance))} km</p>` : ""}
            ${mission.city ? `<p style="margin:0 0 10px;color:#5D564F;font-size:13px;">Lieu: ${escapeHtml(mission.city)}</p>` : ""}
            <button
              onclick="window.dispatchEvent(new CustomEvent('reserve-mission', {detail: '${missionId}'}))"
              style="width:100%;background:#134021;color:white;padding:10px;border-radius:12px;border:none;font-weight:800;cursor:pointer;"
            >
              Réserver cette mission
            </button>
          </div>
        `;

        marker.bindPopup(popupContent);
      });

      if (bounds.length > 0) {
        if (userLocation) bounds.push([userLocation.lat, userLocation.lng]);
        map.fitBounds(bounds, { padding: [42, 42] });
      }

      mapRef.current = map;
    };

    void initMap();

    const handleReserveEvent = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      onReserve(customEvent.detail);
    };

    window.addEventListener("reserve-mission", handleReserveEvent as EventListener);

    return () => {
      window.removeEventListener("reserve-mission", handleReserveEvent as EventListener);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [missions, userLocation, onReserve]);

  return (
    <section className="overflow-hidden rounded-[28px] border border-workon-border bg-workon-surface shadow-sm">
      <div className="flex flex-col gap-3 border-b border-workon-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-workon-stone">
            <MapPin className="h-3.5 w-3.5 text-workon-copper" />
            Carte terrain
          </p>
          <h2 className="mt-1 font-heading text-xl font-black text-workon-ink">
            Opportunités autour de toi
          </h2>
        </div>
        <p className="rounded-full bg-workon-primary-subtle px-3 py-1 text-xs font-bold text-workon-primary">
          {missions.length} mission{missions.length > 1 ? "s" : ""}
        </p>
      </div>

      <div
        ref={mapContainerRef}
        className="h-[560px] w-full"
        style={{ zIndex: 0 }}
        aria-label="Carte des missions disponibles"
      />

      {!userLocation && (
        <div className="flex items-center justify-center gap-2 border-t border-workon-gold/35 bg-workon-gold/12 p-4 text-center text-sm text-workon-ink">
          <AlertTriangle className="h-4 w-4 text-workon-copper" />
          Active la géolocalisation pour voir ta position exacte.
        </div>
      )}
    </section>
  );
}
