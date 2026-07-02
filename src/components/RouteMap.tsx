import React, { useEffect, useRef } from "react";

interface DriverPos {
  id?: string;
  lat: number;
  lng: number;
  name?: string;
  autoNumber?: string;
  state?: string;
}

interface RouteMapProps {
  driverCoords?: { lat: number; lng: number } | null;
  allDrivers?: Record<string, DriverPos>;
  city?: string;
  height?: string;
}

const CITY_CENTERS: Record<string, [number, number]> = {
  "Bangalore": [12.9716, 77.5946],
  "Kolkata":   [22.5726, 88.3639],
  "Mumbai":    [19.0760, 72.8777],
  "Delhi NCR": [28.6139, 77.2090],
  "Delhi":     [28.6139, 77.2090],
};

function makeIcon(L: any, isTracking: boolean, name: string) {
  const bg    = isTracking ? "#16A34A" : "#64748B";
  const pulse = isTracking
    ? `<span style="position:absolute;top:-4px;left:-4px;width:40px;height:40px;border-radius:50%;background:${bg};opacity:.35;animation:ping 1.2s cubic-bezier(0,0,.2,1) infinite"></span>`
    : "";
  return L.divIcon({
    html: `<div style="position:relative;width:32px;height:32px">
      ${pulse}
      <div style="position:relative;background:${bg};color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:15px;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,.4)">🛺</div>
    </div>`,
    className: "",
    iconSize:   [32, 32],
    iconAnchor: [16, 16],
    popupAnchor:[0, -18],
  });
}

export default function RouteMap({ driverCoords, allDrivers, city = "Kolkata", height = "300px" }: RouteMapProps) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInstRef  = useRef<any>(null);
  const markersRef  = useRef<Record<string, any>>({});
  const loadedRef   = useRef(false);

  // Count live drivers
  const liveCount = allDrivers
    ? Object.values(allDrivers).filter(d => d.state === "tracking").length
    : (driverCoords ? 1 : 0);

  function initMap() {
    const L = (window as any).L;
    if (!mapRef.current || mapInstRef.current || !L) return;

    const center: [number, number] = CITY_CENTERS[city] || [22.5726, 88.3639];

    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false })
      .setView(center, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://openstreetmap.org">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstRef.current = map;
    renderMarkers();
  }

  function renderMarkers() {
    const L = (window as any).L;
    const map = mapInstRef.current;
    if (!L || !map) return;

    if (allDrivers && Object.keys(allDrivers).length > 0) {
      const entries = Object.entries(allDrivers);
      entries.forEach(([id, d]) => {
        const icon = makeIcon(L, d.state === "tracking", d.name || id);
        const popup = `<b>${d.name || "Driver"}</b><br/><span style="font-size:11px;color:#555">${d.autoNumber || ""}</span><br/><span style="font-size:10px;color:${d.state === "tracking" ? "#16A34A" : "#888"}">${d.state === "tracking" ? "🟢 Live Tracking" : "⚪ Standby"}</span>`;
        if (markersRef.current[id]) {
          markersRef.current[id].setLatLng([d.lat, d.lng]).setIcon(icon);
        } else {
          markersRef.current[id] = L.marker([d.lat, d.lng], { icon })
            .addTo(map).bindPopup(popup);
        }
      });
      // Fit map to show all markers
      const latlngs = entries.map(([, d]) => [d.lat, d.lng]);
      if (latlngs.length > 1) {
        map.fitBounds(latlngs, { padding: [30, 30], maxZoom: 14 });
      } else if (latlngs.length === 1) {
        map.setView(latlngs[0] as [number, number], 14);
      }
    } else if (driverCoords) {
      const id = "__single__";
      const icon = makeIcon(L, true, "Driver");
      if (markersRef.current[id]) {
        markersRef.current[id].setLatLng([driverCoords.lat, driverCoords.lng]);
      } else {
        markersRef.current[id] = L.marker([driverCoords.lat, driverCoords.lng], { icon })
          .addTo(map).bindPopup("<b>Live Driver</b>").openPopup();
      }
      map.panTo([driverCoords.lat, driverCoords.lng]);
    }
  }

  // Load Leaflet once
  useEffect(() => {
    if (!mapRef.current) return;
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id  = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (!(window as any).L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => { loadedRef.current = true; initMap(); };
      document.head.appendChild(script);
    } else {
      loadedRef.current = true;
      initMap();
    }
    return () => {
      if (mapInstRef.current) { mapInstRef.current.remove(); mapInstRef.current = null; }
      markersRef.current = {};
    };
  }, []);

  // Re-render markers when positions change
  useEffect(() => {
    if (mapInstRef.current) renderMarkers();
  }, [allDrivers, driverCoords]);

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="bg-[#0B1F4D] text-white px-4 py-2.5 flex items-center gap-2">
        <span className="text-sm">📡</span>
        <span className="text-xs font-bold tracking-wide">
          Live Auto Fleet — {city}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {liveCount > 0 ? (
            <span className="flex items-center gap-1.5 text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full font-mono">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block"></span>
              {liveCount} LIVE
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono">No autos tracking</span>
          )}
        </div>
      </div>
      {/* Ping keyframe injected once */}
      <style>{`@keyframes ping{75%,100%{transform:scale(2);opacity:0}}`}</style>
      <div ref={mapRef} style={{ height, width: "100%" }} />
    </div>
  );
}
