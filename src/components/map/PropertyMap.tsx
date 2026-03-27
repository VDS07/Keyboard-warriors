import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, NavigationControl, Popup, Source, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { createWorkplaceRadiusGeoJson } from "./mapRadius";

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
};

const MAP_STYLES = {
  normal: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  hd: "mapbox://styles/mapbox/outdoors-v12",
} as const;

type MapViewMode = keyof typeof MAP_STYLES;

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? "pk.custom-style-token";

const CinematicZoomControls = ({ mapRef }: { mapRef: React.RefObject<MapRef> }) => {

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

export const PropertyMap = ({ workplace, properties, focusedPropertyId, toCurrency, onPropertyFocus }: PropertyMapProps) => {
  const mapRef = useRef<MapRef>(null);
  const zoomTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [popupPropertyId, setPopupPropertyId] = useState<number | null>(null);
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>("normal");
  const focusedProperty = properties.find((property) => property.id === focusedPropertyId);
  const maxCommuteDistanceKm = useMemo(
    () => (properties.length ? Math.max(...properties.map((property) => property.distanceKm)) : 0),
    [properties],
  );
  const workplaceRadiusGeoJson = useMemo(
    () => createWorkplaceRadiusGeoJson(workplace, maxCommuteDistanceKm),
    [workplace, maxCommuteDistanceKm],
  );
  const workplaceAuraColor = useMemo(() => {
    if (typeof window === "undefined") {
      return "hsl(258 84% 66%)";
    }

    const accentToken = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    return accentToken ? `hsl(${accentToken})` : "hsl(258 84% 66%)";
  }, []);

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
    <div className="map-dark-theme relative h-full w-full">
      <Map
        ref={mapRef}
        initialViewState={{ latitude: workplace.lat, longitude: workplace.lng, zoom: 13.4 }}
        mapStyle={MAP_STYLES[mapViewMode]}
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        scrollZoom
        dragRotate={false}
        touchPitch={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {workplaceRadiusGeoJson && (
          <Source id="workplace-commute-radius" type="geojson" data={workplaceRadiusGeoJson}>
            <Layer
              id="workplace-commute-radius-fill"
              type="fill"
              paint={{
                "fill-color": workplaceAuraColor,
                "fill-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  10,
                  0.26,
                  13.4,
                  0.4,
                  17,
                  0.22,
                ],
              }}
            />
            <Layer
              id="workplace-commute-radius-outline"
              type="line"
              paint={{
                "line-color": workplaceAuraColor,
                "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.2, 13.4, 2, 17, 3.2],
                "line-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.35, 13.4, 0.55, 17, 0.7],
                "line-blur": ["interpolate", ["linear"], ["zoom"], 10, 1.8, 13.4, 1, 17, 0.4],
              }}
            />
          </Source>
        )}

        <Marker longitude={workplace.lng} latitude={workplace.lat} anchor="center">
          <button
            type="button"
            onClick={() => setPopupPropertyId(-1)}
            className="h-4 w-4 rounded-full border-2 border-accent bg-accent shadow-[0_0_0_6px_hsl(var(--accent)/0.25)]"
            aria-label="Workplace marker"
          />
        </Marker>

        {properties.map((property) => (
          <Marker key={property.id} longitude={property.lng} latitude={property.lat} anchor="center">
            <button
              type="button"
              onClick={() => {
                onPropertyFocus(property.id);
                setPopupPropertyId(property.id);
              }}
              className="rounded-full border border-primary/90 bg-primary/85 transition-transform duration-200 hover:scale-110"
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

      <CinematicZoomControls mapRef={mapRef} />
      <MapStyleToggle mode={mapViewMode} onChange={setMapViewMode} />
    </div>
  );
};