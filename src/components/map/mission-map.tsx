"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { MissionResponse } from "@/lib/api-client";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

/**
 * Leaflet map component for displaying missions.
 *
 * Uses CartoDB Positron tiles (light, clean) matching the Emergent design.
 * Custom green DivIcon pins for mission markers.
 * Rich popups with title, city, budget, distance, and "Voir détails" link.
 */

// Custom green pin icon matching WorkOn primary color
function createMissionIcon() {
  return L.divIcon({
    className: "mission-pin",
    html: `<div style="
      width: 32px; height: 32px;
      background: #134021;
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(19,64,33,0.3);
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

const missionIcon = createMissionIcon();

// Helper component to recenter map when center prop changes
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface MissionMapProps {
  missions: MissionResponse[];
  center: [number, number];
  radiusKm: number;
}

export default function MissionMap({ missions, center, radiusKm }: MissionMapProps) {
  // Adjust zoom based on radius
  const zoom =
    radiusKm <= 5 ? 14 :
    radiusKm <= 10 ? 13 :
    radiusKm <= 25 ? 11 :
    radiusKm <= 50 ? 10 : 9;

  return (
    <MapContainer
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
      <RecenterMap center={center} />

      {missions.map((m) => (
        <Marker
          key={m.id}
          position={[m.latitude, m.longitude]}
          icon={missionIcon}
        >
          <Popup>
            <div className="min-w-[200px] p-1">
              <p className="font-semibold text-sm text-gray-900">{m.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{m.city}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-green-800">${m.price}</span>
                {m.distanceKm != null && (
                  <span className="text-xs text-gray-400">{m.distanceKm.toFixed(1)} km</span>
                )}
              </div>
              <Link
                href={`/missions/${m.id}`}
                className="block mt-2 text-center text-xs font-medium text-white bg-[#134021] rounded-lg py-1.5 hover:bg-[#0F3319]"
              >
                Voir détails
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
