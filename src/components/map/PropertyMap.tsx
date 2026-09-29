import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSearch, SPEED_FACTORS, WorkplaceIcon, EnrichedProperty } from "@/context/SearchContext";
import { Building2, GraduationCap, Stethoscope, Briefcase, MapPin, Navigation, Compass, Layers, Zap } from "lucide-react";

type Workplace = {
  label: string;
  lat: number;
  lng: number;
};

type PropertyMapProps = {
  workplace: Workplace;
  properties: EnrichedProperty[];
  focusedPropertyId: number | null;
  toCurrency: (price: number) => string;
  onPropertyFocus: (propertyId: number) => void;
  onOpenDetails?: (propertyId: number) => void;
  hideControls?: boolean;
};

export type MapViewMode = "osm" | "streets" | "topo" | "satellite";

const TILE_SERVERS: Record<MapViewMode, { label: string; url: string; attribution: string; subdomains: string; maxZoom: number }> = {
  osm: {
    label: "OSM Standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    subdomains: "abc",
    maxZoom: 19,
  },
  streets: {
    label: "Esri Streets",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    subdomains: "",
    maxZoom: 19,
  },
  topo: {
    label: "Esri Topo",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Sources: GEBCO, USGS, NOAA",
    subdomains: "",
    maxZoom: 19,
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
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
  onOpenDetails,
  hideControls = false,
}: PropertyMapProps) => {
  const { setWorkplace, maxCommute, transportMode, workplaceIcon, activeRoute, isRouteLoading, setSelectedPropertyId, isWorkplaceLocked } = useSearch();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const isLockedRef = useRef(isWorkplaceLocked);

  useEffect(() => {
    isLockedRef.current = isWorkplaceLocked;
    if (mapRef.current) {
      const container = mapRef.current.getContainer();
      if (isWorkplaceLocked) {
        container.style.cursor = "";
      } else {
        container.style.cursor = "crosshair";
      }
    }
  }, [isWorkplaceLocked]);

  const [mapViewMode, setMapViewMode] = useState<MapViewMode>("osm");
  const [popupPropertyId, setPopupPropertyId] = useState<number | null>(null);

  const activeProperty = properties.find((p) => p.id === focusedPropertyId) || properties.find((p) => p.id === popupPropertyId);

  // Time radius in km (speed bound buffer)
  const timeRadiusKm = useMemo(() => {
    return maxCommute * (SPEED_FACTORS[transportMode] || 0.45);
  }, [maxCommute, transportMode]);

  // Initialize Leaflet Map
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

    const initialServer = TILE_SERVERS.osm;
    const tileLayer = L.tileLayer(initialServer.url, {
      subdomains: initialServer.subdomains,
      maxZoom: initialServer.maxZoom,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Route layer below markers
    const routeGroup = L.layerGroup().addTo(map);
    routeLayerRef.current = routeGroup;

    // Markers layer
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    // Reverse-geocode map-click to set Workplace Anchor (only when unlocked)
    map.on("click", async (e: L.LeafletMouseEvent) => {
      if (isLockedRef.current) {
        return; // Locked: do not change workplace when interacting or hovering
      }

      // Guard against clicks that hit markers or popups
      const target = e.originalEvent.target as HTMLElement;
      if (target?.closest(".leaflet-marker-icon, .leaflet-popup, .leaflet-control")) {
        return;
      }

      const { lat, lng } = e.latlng;
      setWorkplace({
        label: `Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        lat,
        lng,
      });

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&countrycodes=in&lat=${lat}&lon=${lng}`, {
          headers: { "Accept-Language": "en" }
        });
        if (res.ok) {
          const data = await res.json();
          setWorkplace({
            label: data.display_name ? data.display_name.split(",").slice(0, 3).join(",") : `Anchor (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            lat,
            lng,
          });
          return;
        }
      } catch {
        // Fallback
      }
      setWorkplace({
        label: `Anchor (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        lat,
        lng,
      });
    });

    mapRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

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
      mapRef.current.flyTo([focused.lat, focused.lng], 14, {
        duration: 0.8,
      });
    }
  }, [focusedPropertyId, properties]);

  // Render Workplace Marker, Commute Radius & Property Markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    const group = markersLayerRef.current;
    group.clearLayers();

    // 1. Commute Reachable Envelope Buffer (Isochrone Approximation)
    const radiusMeters = timeRadiusKm * 1000;
    L.circle([workplace.lat, workplace.lng], {
      radius: radiusMeters,
      color: "#a855f7",
      fillColor: "#a855f7",
      fillOpacity: 0.12,
      weight: 2,
      dashArray: "5, 5",
    }).addTo(group);

    // 2. Pulsing Workplace Anchor Marker (Section VIII)
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
    wpMarker.bindPopup(`
      <div class="p-1.5 font-sans">
        <div class="text-[10px] uppercase font-bold text-purple-400">Workplace Anchor</div>
        <div class="font-bold text-xs text-white">${workplace.label}</div>
        <div class="text-[10px] text-zinc-400 mt-1">Starting point for all commute calculations</div>
      </div>
    `, {
      className: "leaflet-dark-popup",
    });

    // 3. Property Markers (Feasible Set R per Eq. 3)
    properties.forEach((property) => {
      const isFocused = property.id === focusedPropertyId;

      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-125">
          <div style="
            width: ${isFocused ? "24px" : "16px"};
            height: ${isFocused ? "24px" : "16px"};
            background-color: ${isFocused ? "#ec4899" : "#a855f7"};
            border: 2px solid white;
            border-radius: 9999px;
            box-shadow: ${isFocused ? "0 0 20px rgba(236,72,153,0.95)" : "0 0 10px rgba(168,85,247,0.7)"};
          "></div>
        </div>
      `;

      const pIcon = L.divIcon({
        html: markerHtml,
        className: "custom-property-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const pMarker = L.marker([property.lat, property.lng], { icon: pIcon }).addTo(group);

      const popupHtml = `
        <div class="space-y-1.5 text-xs text-white p-1 font-sans min-w-[220px] max-w-[250px]">
          <div class="relative h-24 w-full rounded-xl overflow-hidden mb-1">
            <img src="${property.image}" class="w-full h-full object-cover" />
            <div class="absolute top-1.5 left-1.5 bg-black/80 text-[9px] px-1.5 py-0.5 rounded text-purple-300 font-semibold border border-purple-500/30">
              🌐 ${property.brokerSource || "99acres"}
            </div>
            <div class="absolute bottom-1.5 right-1.5 bg-black/80 text-[9px] px-1.5 py-0.5 rounded text-zinc-300 font-mono">
              📷 ${(property.images && property.images.length) || 5} photos
            </div>
          </div>
          <div class="flex items-center justify-between gap-1.5">
            <span class="font-bold text-xs text-white truncate">${property.title}</span>
            <span class="text-[9px] bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded font-mono font-bold whitespace-nowrap">${property.matchScore}%</span>
          </div>
          ${property.societyName ? `<div class="text-[10px] text-purple-300 truncate">🏢 ${property.societyName}</div>` : ""}
          <div class="flex items-baseline justify-between">
            <span class="font-bold text-pink-400 text-xs">${toCurrency(property.price)}/mo</span>
            <span class="text-[10px] text-zinc-400 font-mono">${property.sqft} sqft • ${property.bedrooms}BHK</span>
          </div>
          <div class="text-zinc-300 flex items-center justify-between text-[10px] pt-0.5 border-t border-white/10">
            <span>⏱️ <strong>${property.commuteMinutes} min</strong></span>
            <span class="text-purple-300 font-mono">${property.distanceKm.toFixed(1)} km</span>
          </div>
          <button id="view-details-btn-${property.id}" class="w-full mt-1 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1 cursor-pointer">
            <span>View Photos & Source Data</span> →
          </button>
        </div>
      `;

      pMarker.bindPopup(popupHtml, { className: "leaflet-dark-popup" });

      pMarker.on("popupopen", () => {
        const btn = document.getElementById(`view-details-btn-${property.id}`);
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            if (onOpenDetails) onOpenDetails(property.id);
          };
        }
      });

      pMarker.on("click", () => {
        onPropertyFocus(property.id);
        setSelectedPropertyId(property.id);
        setPopupPropertyId(property.id);
      });
    });
  }, [workplace, properties, focusedPropertyId, popupPropertyId, timeRadiusKm, workplaceIcon, onOpenDetails]);

  // -----------------------------------------------------------------
  // Render OSRM Road Route Geometry Polyline (Section XII & Eq. 7)
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!mapRef.current || !routeLayerRef.current) return;

    const group = routeLayerRef.current;
    group.clearLayers();

    if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length > 1) {
      // 1. Glowing background stroke
      L.polyline(activeRoute.coordinates, {
        color: "#a855f7",
        weight: 8,
        opacity: 0.35,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(group);

      // 2. High-precision foreground route path
      const routeLine = L.polyline(activeRoute.coordinates, {
        color: "#ec4899",
        weight: 4,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(group);

      // 3. Midpoint floating route badge
      const midIndex = Math.floor(activeRoute.coordinates.length / 2);
      const midCoord = activeRoute.coordinates[midIndex];

      if (midCoord) {
        const badgeHtml = `
          <div class="bg-black/95 text-purple-300 border border-purple-500/60 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-2xl flex items-center gap-1.5 backdrop-blur-xl whitespace-nowrap animate-pulse">
            <span class="text-pink-400">🛣️</span>
            <span>${activeRoute.distanceKm.toFixed(1)} km</span>
            <span>•</span>
            <span class="text-white">${activeRoute.durationMinutes} min (${transportMode})</span>
          </div>
        `;

        const badgeIcon = L.divIcon({
          html: badgeHtml,
          className: "route-midpoint-badge",
          iconSize: [160, 28],
          iconAnchor: [80, 14],
        });

        L.marker(midCoord, { icon: badgeIcon, interactive: false }).addTo(group);
      }

      // Fit map bounds smoothly around route
      mapRef.current.fitBounds(routeLine.getBounds(), {
        padding: [60, 60],
        maxZoom: 15,
        animate: true,
        duration: 0.9,
      });
    }
  }, [activeRoute, transportMode]);

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
          background: rgba(9, 9, 11, 0.94) !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(168, 85, 247, 0.5) !important;
          border-radius: 18px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85) !important;
          color: white !important;
        }
        .leaflet-dark-popup .leaflet-popup-tip {
          background: rgba(9, 9, 11, 0.94) !important;
          border: 1px solid rgba(168, 85, 247, 0.5) !important;
        }
        .leaflet-dark-popup .leaflet-popup-close-button {
          color: rgba(255, 255, 255, 0.7) !important;
          font-size: 16px !important;
          padding: 6px 8px 0 0 !important;
        }
        .leaflet-container {
          background: #09090b !important;
          font-family: inherit !important;
        }
      `}</style>

      {/* Floating Controls */}
      {!hideControls && (
        <>
          {/* Zoom Controls (Docked cleanly on the left above layer switcher) */}
          <div className="pointer-events-auto absolute bottom-20 left-6 z-[500] flex flex-col gap-1.5">
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => handleZoom(1)}
              className="h-9 w-9 rounded-xl bg-black/85 text-base font-bold text-white border border-white/20 backdrop-blur-xl shadow-xl transition-transform hover:scale-110 active:scale-95 flex items-center justify-center hover:bg-purple-600 hover:border-purple-500/50"
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => handleZoom(-1)}
              className="h-9 w-9 rounded-xl bg-black/85 text-base font-bold text-white border border-white/20 backdrop-blur-xl shadow-xl transition-transform hover:scale-110 active:scale-95 flex items-center justify-center hover:bg-purple-600 hover:border-purple-500/50"
            >
              −
            </button>
          </div>

          {/* Map Layer Switcher */}
          <div className="pointer-events-auto absolute bottom-6 left-6 z-[500] flex items-center gap-1.5 p-1 rounded-full bg-black/80 border border-white/10 backdrop-blur-xl shadow-2xl">
            {(["osm", "streets", "topo", "satellite"] as MapViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setMapViewMode(mode)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  mapViewMode === mode
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {TILE_SERVERS[mode].label}
              </button>
            ))}
          </div>

          {/* Route Computing Spinner */}
          {isRouteLoading && (
            <div className="pointer-events-none absolute top-28 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/90 border border-purple-500/50 text-xs text-purple-300 shadow-2xl backdrop-blur-md animate-pulse">
              <Compass className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>Computing OSRM Shortest Path...</span>
            </div>
          )}

          {/* Unlocked Workplace Hint Banner */}
          {!isWorkplaceLocked && (
            <div className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 z-[450] flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/95 text-zinc-950 text-xs font-extrabold shadow-2xl backdrop-blur-md border border-amber-300 animate-bounce">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-950 animate-ping" />
              <span>📍 Click anywhere on map to set workplace, then click 'Set & Lock'</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};