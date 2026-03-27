import { useEffect, useMemo, useRef, useState, type RefObject, type FormEvent } from "react";
import Map, { Layer, Marker, NavigationControl, Popup, Source, type MapRef, type MapLayerMouseEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { createWorkplaceRadiusGeoJson } from "./mapRadius";
import { useSearch, SPEED_FACTORS } from "@/context/SearchContext";
import { Search, MapPin, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";

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

// Free tile styles — no API key required
const STYLE_NORMAL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const STYLE_HD = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

// ESRI World Imagery (free, no key needed) as a raster style
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

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? "pk.placeholder";

const CinematicZoomControls = ({ mapRef }: { mapRef: RefObject<MapRef> }) => {

  const handleZoom = (delta: number) => {
    if (!mapRef.current) {
      return;
    }

    const nextZoom = Math.min(18, Math.max(10, mapRef.current.getZoom() + delta));
    mapRef.current.flyTo({
      center: mapRef.current.getCenter(),
      zoom: nextZoom,
      duration: 0.8,
      essential: true,
    });
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

export const PropertyMap = ({ workplace, properties, focusedPropertyId, toCurrency, onPropertyFocus, hideControls = false }: PropertyMapProps) => {
  const { setWorkplace, maxCommute, transportMode } = useSearch();
  const mapRef = useRef<MapRef>(null);
  const zoomTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [popupPropertyId, setPopupPropertyId] = useState<number | null>(null);
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>("normal");
  
  const focusedProperty = properties.find((property) => property.id === focusedPropertyId);

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
    if (!mapRef.current) {
      return;
    }

    if (zoomTimeout.current) {
      clearTimeout(zoomTimeout.current);
    }

    mapRef.current.flyTo({
      center: [workplace.lng, workplace.lat],
      zoom: Math.max(10, mapRef.current.getZoom() - 1.5),
      duration: 900,
      essential: true,
    });

    zoomTimeout.current = setTimeout(() => {
      mapRef.current?.flyTo({
        center: [workplace.lng, workplace.lat],
        zoom: 13.4,
        duration: 1450,
        essential: true,
      });
    }, 540);

    return () => {
      if (zoomTimeout.current) {
        clearTimeout(zoomTimeout.current);
      }
    };
  }, [workplace]);

  useEffect(() => {
    if (!mapRef.current || !focusedProperty) {
      return;
    }

    mapRef.current.flyTo({
      center: [focusedProperty.lng, focusedProperty.lat],
      zoom: 14.9,
      duration: 1100,
      essential: true,
    });
  }, [focusedProperty]);

  return (
    <div className="map-dark-theme relative h-full w-full group/map">

      <Map
        ref={mapRef}
        initialViewState={{ latitude: workplace.lat, longitude: workplace.lng, zoom: 13.4 }}
        mapStyle={getMapStyle(mapViewMode)}
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
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

        {/* Workplace Marker with Custom Pulsing Aura */}
        <Marker longitude={workplace.lng} latitude={workplace.lat} anchor="center">
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring 1 */}
            <div className="absolute w-12 h-12 bg-accent/20 rounded-full animate-ping duration-[3000ms]" />
            {/* Pulsing ring 2 */}
            <div className="absolute w-8 h-8 bg-accent/30 rounded-full animate-pulse decoration-3000ms" />
            
            <button
              type="button"
              onClick={() => setPopupPropertyId(-1)}
              className="relative z-10 h-5 w-5 rounded-full border-2 border-white bg-accent shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-transform hover:scale-125"
              aria-label="Workplace marker"
            >
              <MapPin className="w-3 h-3 text-white mx-auto" />
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
            <p className="text-sm">Workplace: {workplace.label}</p>
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
                  <p>{selectedProperty.commuteMinutes} min commute</p>
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