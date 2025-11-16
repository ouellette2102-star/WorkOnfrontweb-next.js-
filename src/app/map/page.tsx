"use client";

import { useEffect, useRef, useState } from "react";
import { MissionCard } from "@/components/mission-card";
import { Card, CardContent } from "@/components/ui/card";

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // TODO: Initialize Mapbox
    // const mapboxgl = require("mapbox-gl");
    // mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    // if (mapContainer.current) {
    //   const map = new mapboxgl.Map({
    //     container: mapContainer.current,
    //     style: "mapbox://styles/mapbox/dark-v11",
    //     center: [-73.5673, 45.5017], // Montréal
    //     zoom: 11,
    //   });
    //   setMapLoaded(true);
    // }
    setMapLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="flex h-screen">
        {/* Map */}
        <div className="flex-1 relative">
          <div
            ref={mapContainer}
            className="absolute inset-0 bg-neutral-800"
          >
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/50">Chargement de la carte...</p>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-96 border-l border-white/10 bg-neutral-900 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Missions à proximité</h2>
            <div className="space-y-4">
              {/* Placeholder missions */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-white/70">
                    Les missions apparaîtront ici une fois la carte chargée.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

