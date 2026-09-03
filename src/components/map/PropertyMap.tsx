import React, { Component, useEffect, useMemo, useRef, useState, type RefObject, type ReactNode } from "react";
import Map, { Layer, Marker, NavigationControl, Popup, Source, type MapRef, type MapLayerMouseEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { createWorkplaceRadiusGeoJson } from "./mapRadius";
import { useSearch, SPEED_FACTORS, WorkplaceIcon } from "@/context/SearchContext";
import { Search, MapPin, Building2, GraduationCap, Stethoscope, Briefcase, Navigation } from "lucide-react";

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

// Extremely reliable, fast retina raster styles — 0 external vector font/sprite network errors
const STYLE_NORMAL: any = {
  version: 8,
  sources: {
    "carto-dark": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© CARTO, © OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "carto-dark-layer",
      type: "raster",
      source: "carto-dark",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const STYLE_HD: any = {
  version: 8,
  sources: {
    "carto-voyager": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© CARTO, © OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "carto-voyager-layer",
      type: "raster",
      source: "carto-voyager",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const STYLE_SATELLITE: any = {
  version: 8,
  sources: {
    "esri-satellite": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© Esri",
    },
  },
  layers: [
    {
      id: "esri-satellite-layer",
      type: "raster",
      source: "esri-satellite",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

type MapViewMode = "normal" | "satellite" | "hd";

const getMapStyle = (mode: MapViewMode): any => {
  if (mode === "satellite") return STYLE_SATELLITE;
  if (mode === "hd") return STYLE_HD;
  return STYLE_NORMAL;
};

const renderWorkplaceIcon = (icon: WorkplaceIcon) => {
  switch (icon) {
    case "office": return <Building2 className="w-3.5 h-3.5 text-white" />;
    case "university": return <GraduationCap className="w-3.5 h-3.5 text-white" />;
    case "hospital": return <Stethoscope className="w-3.5 h-3.5 text-white" />;
    case "briefcase": return <Briefcase className="w-3.5 h-3.5 text-white" />;
    default: return <MapPin className="w-3.5 h-3.5 text-white" />;
  }
};

const CinematicZoomControls = ({ mapRef }: { mapRef: RefObject<MapRef> }) => {
  const handleZoom = (delta: number) => {
    try {
      const map = mapRef.current?.getMap();
      if (!map) return;
      const currentZoom = typeof map.getZoom === "function" ? map.getZoom() : 13.4;
      const nextZoom = Math.min(18, Math.max(10, currentZoom + delta));
      map.flyTo({
        center: map.getCenter(),
        zoom: nextZoom,
        duration: 0.8,
        essential: true,
      });
    } catch (err) {
      console.warn("Zoom error:", err);
    }
  };

  return (
    <div className="pointer-events-auto absolute bottom-5 right-5 z-[600] flex flex-col gap-2">
      <button
        type="button"
        aria-label="Zoom in"
        onClick={() => handleZoom(1)}
        className="glass-panel h-10 w-10 text-lg font-bold text-foreground transition-transform duration-200 hover:scale-105"
      >
        +
      </button>
      <button
        type="button"
        aria-label="Zoom out"
        onClick={() => handleZoom(-1)}
        className="glass-panel h-10 w-10 text-lg font-bold text-foreground transition-transform duration-200 hover:scale-105"
      >
        −
      </button>
    </div>
  );
};

const MapStyleToggle = ({ mode, onChange }: { mode: MapViewMode; onChange: (m: MapViewMode) => void }) => {
  const modes: { key: MapViewMode; label: string; emoji: string }[] = [
    { key: "normal", label: "Dark", emoji: "🌙" },
    { key: "satellite", label: "Satellite", emoji: "🛰️" },
    { key: "hd", label: "HD", emoji: "🏔️" },
  ];

  return (
    <div className="pointer-events-auto absolute bottom-5 left-5 z-[600] flex rounded-full bg-black/70 backdrop-blur-xl border border-white/15 shadow-2xl overflow-hidden">
      {modes.map(({ key, label, emoji }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-3 py-2 text-xs font-semibold transition-all ${
            mode === key
              ? "bg-white/15 text-white"
              : "text-white/50 hover:text-white/80 hover:bg-white/5"
          }`}
        >
          {emoji} {label}
        </button>
      ))}
    </div>
  );
};

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class MapErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("MapErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-950 p-6 text-center text-white">
          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-6 backdrop-blur-xl max-w-md">
            <h3 className="text-lg font-bold text-purple-300">🗺️ Map View Loading</h3>
            <p className="mt-2 text-xs text-zinc-400">
              Map instance encountered a canvas refresh. Click below to reload interactive map.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 rounded-full bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500"
            >
              Reload Map
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const BasePropertyMap = ({ workplace, properties, focusedPropertyId, toCurrency, onPropertyFocus, hideControls = false }: PropertyMapProps) => {
  const { setWorkplace, maxCommute, transportMode, workplaceIcon } = useSearch();
  const mapRef = useRef<MapRef>(null);
  const zoomTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [popupPropertyId, setPopupPropertyId] = useState<number | null>(null);
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>("normal");
  
  const focusedProperty = properties.find((property) => property.id === focusedPropertyId);
  const popupProperty = properties.find((property) => property.id === popupPropertyId);
  const activeProperty = focusedProperty || popupProperty;

  // Shortest Path Route Line GeoJSON Feature
  const routePolylineGeoJson = useMemo(() => {
    if (!activeProperty) return null;
    return {
      type: "Feature" as const,
      properties: {
        distanceKm: activeProperty.distanceKm,
        commuteMinutes: activeProperty.commuteMinutes,
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [workplace.lng, workplace.lat],
          [activeProperty.lng, activeProperty.lat],
        ],
      },
    };
  }, [workplace, activeProperty]);

  // Route Midpoint coordinates for Path Distance Badge
  const routeMidpoint = useMemo(() => {
    if (!activeProperty) return null;
    return {
      lng: (workplace.lng + activeProperty.lng) / 2,
      lat: (workplace.lat + activeProperty.lat) / 2,
    };
  }, [workplace, activeProperty]);

  // Calculate radius based on time radius: Max Commute * Speed constant
  const timeRadiusKm = useMemo(() => {
    return maxCommute * (SPEED_FACTORS[transportMode] || 0.35);
  }, [maxCommute, transportMode]);

  const workplaceRadiusGeoJson = useMemo(
    () => createWorkplaceRadiusGeoJson(workplace, timeRadiusKm),
    [workplace, timeRadiusKm],
  );

  const workplaceAuraColor = useMemo(() => {
    if (typeof window === "undefined") return "hsl(258 84% 66%)";
    const accentToken = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    return accentToken ? `hsl(${accentToken})` : "hsl(258 84% 66%)";
  }, []);

  // Handle map click to set workplace
  const handleMapClick = (e: MapLayerMouseEvent) => {
    const { lng, lat } = e.lngLat;
    setWorkplace({
      label: "Selected Location",
      lat,
      lng,
    });
  };

  useEffect(() => {
    try {
      const map = mapRef.current?.getMap();
      if (!map) return;

      if (zoomTimeout.current) {
        clearTimeout(zoomTimeout.current);
      }

      map.flyTo({
        center: [workplace.lng, workplace.lat],
        zoom: Math.max(10, (map.getZoom?.() ?? 13.4) - 1.5),
        duration: 900,
        essential: true,
      });

      zoomTimeout.current = setTimeout(() => {
        try {
          map.flyTo({
            center: [workplace.lng, workplace.lat],
            zoom: 13.4,
            duration: 1450,
            essential: true,
          });
        } catch {}
      }, 540);
    } catch (err) {
      console.warn("Map Workplace flyTo warning:", err);
    }

    return () => {
      if (zoomTimeout.current) {
        clearTimeout(zoomTimeout.current);
      }
    };
  }, [workplace]);

  useEffect(() => {
    try {
      const map = mapRef.current?.getMap();
      if (!map || !focusedProperty) return;

      map.flyTo({
        center: [focusedProperty.lng, focusedProperty.lat],
        zoom: 14.9,
        duration: 1100,
        essential: true,
      });
    } catch (err) {
      console.warn("Map FocusedProperty flyTo warning:", err);
    }
  }, [focusedProperty]);

  return (
    <div className="map-dark-theme relative h-full w-full group/map">

      <Map
        ref={mapRef}
        initialViewState={{ latitude: workplace.lat, longitude: workplace.lng, zoom: 13.4 }}
        mapStyle={getMapStyle(mapViewMode)}
        scrollZoom
        dragRotate={false}
        touchPitch={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
        onClick={handleMapClick}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {workplaceRadiusGeoJson && (
          <Source id="workplace-commute-radius" type="geojson" data={workplaceRadiusGeoJson}>
            {/* The outer aura / glow */}
            <Layer
              id="workplace-commute-radius-fill"
              type="fill"
              paint={{
                "fill-color": workplaceAuraColor,
                "fill-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  10, 0.15,
                  13.4, 0.25,
                  17, 0.1
                ],
              }}
            />
            {/* Soft blurred edge for the 'aura' effect */}
            <Layer
              id="workplace-commute-radius-outline"
              type="line"
              paint={{
                "line-color": workplaceAuraColor,
                "line-width": ["interpolate", ["linear"], ["zoom"], 10, 20, 13.4, 40, 17, 60],
                "line-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.2, 13.4, 0.3, 17, 0.1],
                "line-blur": ["interpolate", ["linear"], ["zoom"], 10, 10, 13.4, 20, 17, 30],
              }}
            />
            {/* Inner sharper ring */}
            <Layer
              id="workplace-commute-radius-ring"
              type="line"
              paint={{
                "line-color": workplaceAuraColor,
                "line-width": 2,
                "line-opacity": 0.5,
              }}
            />
          </Source>
        )}

        {/* Shortest Path Polyline Route Layer */}
        {routePolylineGeoJson && (
          <Source id="shortest-path-route" type="geojson" data={routePolylineGeoJson}>
            {/* Route Outer Glow */}
            <Layer
              id="shortest-path-route-glow"
              type="line"
              paint={{
                "line-color": "#a855f7",
                "line-width": 8,
                "line-opacity": 0.5,
                "line-blur": 4,
              }}
            />
            {/* Route Inner Sharp Line */}
            <Layer
              id="shortest-path-route-line"
              type="line"
              paint={{
                "line-color": "#ec4899",
                "line-width": 4,
                "line-dasharray": [2, 1],
              }}
            />
          </Source>
        )}

        {/* Route Midpoint Badge */}
        {activeProperty && routeMidpoint && (
          <Marker longitude={routeMidpoint.lng} latitude={routeMidpoint.lat} anchor="center">
            <div className="bg-black/90 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xl flex items-center gap-1 backdrop-blur-md">
              <Navigation className="w-2.5 h-2.5 text-pink-400 animate-pulse" />
              {activeProperty.distanceKm.toFixed(1)} km ({activeProperty.commuteMinutes} min)
            </div>
          </Marker>
        )}

        {/* Workplace Marker with Custom Pulsing Aura & Selected Icon */}
        <Marker longitude={workplace.lng} latitude={workplace.lat} anchor="center">
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring 1 */}
            <div className="absolute w-12 h-12 bg-accent/20 rounded-full animate-ping duration-[3000ms]" />
            {/* Pulsing ring 2 */}
            <div className="absolute w-8 h-8 bg-accent/30 rounded-full animate-pulse decoration-3000ms" />
            
            <button
              type="button"
              onClick={() => setPopupPropertyId(-1)}
              className="relative z-10 h-7 w-7 rounded-full border-2 border-white bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.8)] transition-transform hover:scale-125"
              aria-label="Workplace marker"
            >
              {renderWorkplaceIcon(workplaceIcon)}
            </button>
          </div>
        </Marker>

        {properties.map((property) => (
          <Marker key={property.id} longitude={property.lng} latitude={property.lat} anchor="center">
            <button
              type="button"
              onClick={() => {
                onPropertyFocus(property.id);
                setPopupPropertyId(property.id);
              }}
              className="rounded-full border border-primary/90 bg-primary/85 transition-transform duration-200 hover:scale-110 shadow-lg"
              style={{
                width: focusedPropertyId === property.id ? "18px" : "14px",
                height: focusedPropertyId === property.id ? "18px" : "14px",
                boxShadow:
                  focusedPropertyId === property.id
                    ? "0 0 0 8px hsl(var(--primary) / 0.24)"
                    : "0 0 0 5px hsl(var(--primary) / 0.18)",
              }}
              aria-label={property.title}
            />
          </Marker>
        ))}

        {popupPropertyId === -1 && (
          <Popup
            longitude={workplace.lng}
            latitude={workplace.lat}
            anchor="bottom"
            onClose={() => setPopupPropertyId(null)}
            closeButton
            className="map-dark-popup"
          >
            <p className="text-sm font-semibold">Workplace Anchor: {workplace.label}</p>
          </Popup>
        )}

        {popupPropertyId !== null && popupPropertyId !== -1 && (
          (() => {
            const selectedProperty = properties.find((property) => property.id === popupPropertyId);
            if (!selectedProperty) {
              return null;
            }

            return (
              <Popup
                longitude={selectedProperty.lng}
                latitude={selectedProperty.lat}
                anchor="bottom"
                onClose={() => setPopupPropertyId(null)}
                closeButton
                className="map-dark-popup"
              >
                <div className="space-y-1">
                  <p className="font-semibold">{selectedProperty.title}</p>
                  <p>{toCurrency(selectedProperty.price)}</p>
                  <p>{selectedProperty.commuteMinutes} min commute ({selectedProperty.distanceKm.toFixed(1)} km)</p>
                </div>
              </Popup>
            );
          })()
        )}
      </Map>

      {!hideControls && (
        <>
          <CinematicZoomControls mapRef={mapRef} />
          <MapStyleToggle mode={mapViewMode} onChange={setMapViewMode} />
        </>
      )}
    </div>
  );
};

export const PropertyMap = (props: PropertyMapProps) => (
  <MapErrorBoundary>
    <BasePropertyMap {...props} />
  </MapErrorBoundary>
);