import React, { useEffect, useRef } from "react";

interface RouteMapProps {
  driverCoords?: { lat: number; lng: number } | null;
  city?: string;
  height?: string;
}

// City center coords for fallback centering
const CITY_CENTERS: Record<string, [number, number]> = {
  "Bangalore": [12.9716, 77.5946],
  "Kolkata": [22.5726, 88.3639],
  "Mumbai": [19.0760, 72.8777],
  "Delhi NCR": [28.6139, 77.2090],
  "Delhi": [28.6139, 77.2090],
};

export default function RouteMap({ driverCoords, city = "Bangalore", height = "300px" }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically load Leaflet CSS + JS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = (window as any).L;
      if (!mapRef.current || mapInstanceRef.current) return;

      const center = driverCoords
        ? [driverCoords.lat, driverCoords.lng]
        : CITY_CENTERS[city] || [20.5937, 78.9629];

      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView(center, 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom green driver icon
      const icon = L.divIcon({
        html: `<div style="background:#16A34A;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🛺</div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (driverCoords) {
        markerRef.current = L.marker([driverCoords.lat, driverCoords.lng], { icon })
          .addTo(map)
          .bindPopup("<b>Driver Live Location</b>")
          .openPopup();
      }

      mapInstanceRef.current = map;
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker when coords change
  useEffect(() => {
    if (!mapInstanceRef.current || !driverCoords) return;
    const L = (window as any).L;
    if (!L) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([driverCoords.lat, driverCoords.lng]);
    } else {
      const icon = L.divIcon({
        html: `<div style="background:#16A34A;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🛺</div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      markerRef.current = L.marker([driverCoords.lat, driverCoords.lng], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup("<b>Driver Live Location</b>");
    }
    mapInstanceRef.current.panTo([driverCoords.lat, driverCoords.lng]);
  }, [driverCoords]);

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <div className="bg-[#1B3A6B] text-white px-4 py-2.5 flex items-center gap-2">
        <span className="text-sm">📡</span>
        <span className="text-xs font-bold tracking-wide">
          {driverCoords ? "Live Driver Location" : `Campaign Zone — ${city}`}
        </span>
        {driverCoords && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full font-mono">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
            LIVE
          </span>
        )}
      </div>
      <div ref={mapRef} style={{ height, width: "100%" }} />
    </div>
  );
}
