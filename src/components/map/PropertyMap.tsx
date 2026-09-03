import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSearch, SPEED_FACTORS, WorkplaceIcon } from "@/context/SearchContext";
import { Building2, GraduationCap, Stethoscope, Briefcase, MapPin, Navigation } from "lucide-react";

type Workplace = {
  label: string;
  lat: number;
  lng: number;
};

type PropertyMarker = {
  id: number;
  title: string;
  price: number;
  lat: number;
  lng: number;
  commuteMinutes: number;
  distanceKm: number;
};

type PropertyMapProps = {
  workplace: Workplace;
  properties: PropertyMarker[];
  focusedPropertyId: number | null;
  toCurrency: (price: number) => string;
  onPropertyFocus: (propertyId: number) => void;
  hideControls?: boolean;
};

type MapViewMode = "normal" | "satellite" | "hd";

// High-performance, gorgeous free tile endpoints (0 API keys required)
const TILE_SERVERS = {
  normal: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors &copy; <a href='https://carto.com/attributions'>CARTO</a>",
    subdomains: "abcd",
    maxZoom: 19,
  },
  hd: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors &copy; <a href='https://carto.com/attributions'>CARTO</a>",
    subdomains: "abcd",
    maxZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; <a href='https://www.esri.com/'>Esri</a>",
    subdomains: "",
    maxZoom: 18,
  },
};

const renderWorkplaceIconSvg = (icon: WorkplaceIcon) => {
  switch (icon) {
    case "office":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`;
    case "university":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`;
    case "hospital":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M4.8 2.3A.3.3 0 0 0 4.5 2.6V21.4a.3.3 0 0 0 .3.3h14.4a.3.3 0 0 0 .3-.3V2.6a.3.3 0 0 0-.3-.3z"/><path d="M10 9h4"/><path d="M12 7v4"/><path d="M8 15h8"/><path d="M8 18h8"/></svg>`;
    case "briefcase":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`;
  }
};

export const PropertyMap = ({
  workplace,
  properties,
  focusedPropertyId,
  toCurrency,
  onPropertyFocus,
  hideControls = false,
}: PropertyMapProps) => {
  const { setWorkplace, maxCommute, transportMode, workplaceIcon } = useSearch();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [mapViewMode, setMapViewMode] = useState<MapViewMode>("normal");
  const [popupPropertyId, setPopupPropertyId] = useState<number | null>(null);

  const activeProperty = properties.find((p) => p.id === focusedPropertyId) || properties.find((p) => p.id === popupPropertyId);

  // Calculate time radius in km
  const timeRadiusKm = useMemo(() => {
    return maxCommute * (SPEED_FACTORS[transportMode] || 0.35);
  }, [maxCommute, transportMode]);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [workplace.lat, workplace.lng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true,
      touchZoom: true,
    });

    const initialServer = TILE_SERVERS.normal;
    const tileLayer = L.tileLayer(initialServer.url, {
      subdomains: initialServer.subdomains,
      maxZoom: initialServer.maxZoom,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    // Handle map click to pick workplace location
    map.on("click", (e: L.LeafletMouseEvent) => {
      setWorkplace({
        label: "Selected Location",
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    });

    mapRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle tile style switching
  useEffect(() => {
    if (!mapRef.current) return;
    const config = TILE_SERVERS[mapViewMode];
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    const newTileLayer = L.tileLayer(config.url, {
      subdomains: config.subdomains,
      maxZoom: config.maxZoom,
    }).addTo(mapRef.current);
    tileLayerRef.current = newTileLayer;
  }, [mapViewMode]);

  // Center map when workplace changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([workplace.lat, workplace.lng], 13, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [workplace.lat, workplace.lng]);

  // Fly to focused property
  useEffect(() => {
    if (!mapRef.current || !focusedPropertyId) return;
    const focused = properties.find((p) => p.id === focusedPropertyId);
    if (focused) {
      mapRef.current.flyTo([focused.lat, focused.lng], 15, {
        duration: 1.0,
      });
    }
  }, [focusedPropertyId, properties]);

  // Render Workplace Marker, Commute Radius, Properties & Route Lines
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    const group = markersLayerRef.current;
    group.clearLayers();

    // 1. Commute Radius Circle
    const radiusMeters = timeRadiusKm * 1000;
    const circle = L.circle([workplace.lat, workplace.lng], {
      radius: radiusMeters,
      color: "#a855f7",
      fillColor: "#a855f7",
      fillOpacity: 0.15,
      weight: 2,
      dashArray: "4, 4",
    }).addTo(group);
    radiusCircleRef.current = circle;

    const workplaceIconHtml = `
      <div class="relative flex items-center justify-center pointer-events-auto">
        <div class="absolute -inset-3 bg-purple-500/30 rounded-full animate-ping"></div>
        <div class="absolute -inset-1.5 bg-purple-600/40 rounded-full animate-pulse"></div>
        <div class="relative h-8 w-8 rounded-full border-2 border-white bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.9)] transition-transform hover:scale-125 cursor-pointer">
          ${renderWorkplaceIconSvg(workplaceIcon)}
        </div>
      </div>
    `;

    const wpIcon = L.divIcon({
      html: workplaceIconHtml,
      className: "custom-workplace-marker",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const wpMarker = L.marker([workplace.lat, workplace.lng], { icon: wpIcon }).addTo(group);
    wpMarker.bindPopup(`<div class="p-1 font-semibold text-xs text-white">Workplace Anchor: ${workplace.label}</div>`, {
      className: "leaflet-dark-popup",
    });

    // 3. Property Markers
    properties.forEach((property) => {
      const isFocused = property.id === focusedPropertyId;

      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-125">
          <div className="rounded-full border shadow-lg" style="
            width: ${isFocused ? "20px" : "14px"};
            height: ${isFocused ? "20px" : "14px"};
            background-color: ${isFocused ? "#ec4899" : "#a855f7"};
            border: 2px solid white;
            border-radius: 9999px;
            box-shadow: ${isFocused ? "0 0 16px rgba(236,72,153,0.9)" : "0 0 10px rgba(168,85,247,0.7)"};
          "></div>
        </div>
      `;

      const pIcon = L.divIcon({
        html: markerHtml,
        className: "custom-property-marker",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const pMarker = L.marker([property.lat, property.lng], { icon: pIcon }).addTo(group);

      const popupHtml = `
        <div class="space-y-1 text-xs text-white p-1">
          <p class="font-bold text-sm text-purple-300">${property.title}</p>
          <p class="font-semibold text-pink-400">${toCurrency(property.price)}</p>
          <p class="text-zinc-300">⏱️ ${property.commuteMinutes} min commute (${property.distanceKm.toFixed(1)} km)</p>
        </div>
      `;

      pMarker.bindPopup(popupHtml, { className: "leaflet-dark-popup" });

      pMarker.on("click", () => {
        onPropertyFocus(property.id);
        setPopupPropertyId(property.id);
      });
    });

    // 4. Shortest Path Route Line if active property selected
    if (activeProperty) {
      const routePolyline = L.polyline(
        [
          [workplace.lat, workplace.lng],
          [activeProperty.lat, activeProperty.lng],
        ],
        {
          color: "#ec4899",
          weight: 4,
          dashArray: "6, 6",
          opacity: 0.9,
        }
      ).addTo(group);
      routePolylineRef.current = routePolyline;

      // Midpoint distance badge
      const midLat = (workplace.lat + activeProperty.lat) / 2;
      const midLng = (workplace.lng + activeProperty.lng) / 2;

      const badgeHtml = `
        <div class="bg-black/90 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xl flex items-center gap-1 backdrop-blur-md whitespace-nowrap">
          ⚡ ${activeProperty.distanceKm.toFixed(1)} km (${activeProperty.commuteMinutes} min)
        </div>
      `;

      const badgeIcon = L.divIcon({
        html: badgeHtml,
        className: "route-midpoint-badge",
        iconSize: [120, 24],
        iconAnchor: [60, 12],
      });

      L.marker([midLat, midLng], { icon: badgeIcon, interactive: false }).addTo(group);
    }
  }, [workplace, properties, focusedPropertyId, popupPropertyId, timeRadiusKm, workplaceIcon, activeProperty]);

  // Zoom In / Out Handlers
  const handleZoom = (delta: number) => {
    if (!mapRef.current) return;
    if (delta > 0) {
      mapRef.current.zoomIn();
    } else {
      mapRef.current.zoomOut();
    }
  };

  return (
    <div className="relative h-full w-full bg-zinc-950 overflow-hidden select-none">
      {/* Leaflet Map Div Container */}
      <div ref={containerRef} className="h-full w-full z-0" />

      {/* Dark Leaflet Popup Styling Override */}
      <style>{`
        .leaflet-dark-popup .leaflet-popup-content-wrapper {
          background: rgba(9, 9, 11, 0.92) !important;
          backdrop-filter: blur(16px) !important;
          border: 1px solid rgba(168, 85, 247, 0.4) !important;
          border-radius: 16px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7) !important;
          color: white !important;
        }
        .leaflet-dark-popup .leaflet-popup-tip {
          background: rgba(9, 9, 11, 0.92) !important;
          border: 1px solid rgba(168, 85, 247, 0.4) !important;
        }
        .leaflet-dark-popup .leaflet-popup-close-button {
          color: rgba(255, 255, 255, 0.7) !important;
          font-size: 16px !important;
          padding: 6px 8px 0 0 !important;
        }
        .leaflet-dark-popup .leaflet-popup-close-button:hover {
          color: white !important;
        }
        .leaflet-container {
          background: #09090b !important;
          font-family: inherit !important;
        }
      `}</style>

      {/* Floating Controls */}
      {!hideControls && (
        <>
          {/* Zoom Controls */}
          <div className="pointer-events-auto absolute bottom-5 right-5 z-[600] flex flex-col gap-2">
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => handleZoom(1)}
              className="h-10 w-10 rounded-full bg-black/80 text-lg font-bold text-white border border-white/20 backdrop-blur-xl shadow-2xl transition-transform hover:scale-110 active:scale-95 flex items-center justify-center"
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => handleZoom(-1)}
              className="h-10 w-10 rounded-full bg-black/80 text-lg font-bold text-white border border-white/20 backdrop-blur-xl shadow-2xl transition-transform hover:scale-110 active:scale-95 flex items-center justify-center"
            >
              −
            </button>
          </div>

          {/* Map Style Toggle */}
          <div className="pointer-events-auto absolute bottom-5 left-5 z-[600] flex rounded-full bg-black/80 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden p-0.5">
            {[
              { key: "normal" as MapViewMode, label: "Dark", emoji: "🌙" },
              { key: "satellite" as MapViewMode, label: "Satellite", emoji: "🛰️" },
              { key: "hd" as MapViewMode, label: "HD", emoji: "🏔️" },
            ].map(({ key, label, emoji }) => (
              <button
                key={key}
                onClick={() => setMapViewMode(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  mapViewMode === key
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};