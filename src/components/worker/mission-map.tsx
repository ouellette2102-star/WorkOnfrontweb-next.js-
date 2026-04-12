"use client";

import { useEffect, useRef } from "react";
import type { MissionFeedItem } from "@/types/mission";

type Props = {
  missions: MissionFeedItem[];
  userLocation: { lat: number; lng: number } | null;
  onReserve: (missionId: string) => void;
};

export function MissionMap({ missions, userLocation, onReserve }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    // Vérifier que Leaflet est disponible (dynamique import pour SSR)
    if (typeof window === "undefined") return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      // Importer le CSS dynamiquement
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!mapContainerRef.current || mapRef.current) return;

      // Définir les icônes par défaut de Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Centre par défaut (Montréal)
      const defaultCenter: [number, number] = [45.5017, -73.5673];
      const center: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : defaultCenter;

      // Créer la carte
      const map = L.map(mapContainerRef.current).setView(center, 12);

      // Ajouter les tuiles OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Ajouter le marqueur de l'utilisateur
      if (userLocation) {
        const userIcon = L.divIcon({
          className: "user-location-marker",
          html: '<div style="background: #3b82f6; border: 3px solid white; border-radius: 50%; width: 24px; height: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup("<b>📍 Vous êtes ici</b>");
      }

      // Ajouter les marqueurs des missions
      const bounds: [number, number][] = [];

      missions.forEach((mission) => {
        if (mission.latitude !== null && mission.longitude !== null) {
          const lat = mission.latitude;
          const lng = mission.longitude;

          bounds.push([lat, lng]);

          const missionIcon = L.divIcon({
            className: "mission-marker",
            html: '<div style="background: #10b981; border: 3px solid white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">💼</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          });

          const marker = L.marker([lat, lng], { icon: missionIcon }).addTo(map);

          const popupContent = `
            <div style="min-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 8px; color: #1f2937;">${mission.title}</h3>
              ${mission.distance !== null ? `<p style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">📍 ${mission.distance} km</p>` : ""}
              ${mission.hourlyRate ? `<p style="color: #10b981; font-weight: 600; margin-bottom: 8px;">💰 ${mission.hourlyRate.toFixed(2)} $ / heure</p>` : ""}
              <button 
                onclick="window.dispatchEvent(new CustomEvent('reserve-mission', {detail: '${mission.id}'}))"
                style="width: 100%; background: #3b82f6; color: white; padding: 8px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer;"
              >
                Réserver
              </button>
            </div>
          `;

          marker.bindPopup(popupContent);
        }
      });

      // Ajuster la vue pour inclure tous les marqueurs
      if (bounds.length > 0) {
        if (userLocation) {
          bounds.push([userLocation.lat, userLocation.lng]);
        }
        map.fitBounds(bounds, { padding: [50, 50] });
      }

      mapRef.current = map;
    };

    initMap();

    // Écouter l'événement de réservation depuis le popup
    const handleReserveEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
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
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
      <div
        ref={mapContainerRef}
        className="h-[600px] w-full"
        style={{ zIndex: 0 }}
      />
      {!userLocation && (
        <div className="border-t border-yellow-500/30 bg-amber-100 p-4 text-center text-sm text-amber-600">
          ⚠️ Activez la géolocalisation pour voir votre position sur la carte
        </div>
      )}
    </div>
  );
}
