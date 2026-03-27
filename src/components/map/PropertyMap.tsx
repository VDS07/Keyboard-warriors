import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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

// Tile providers
const TILE_LAYERS = {
  normal: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
  },
  hd: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; Esri'
  }
} as const;

type MapViewMode = keyof typeof TILE_LAYERS;

const MapController = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

const MapStyleToggle = ({ mode, onChange }: { mode: MapViewMode; onChange: (m: MapViewMode) => void }) => {
  const modes: { key: MapViewMode; label: string; emoji: string }[] = [
    { key: "normal", label: "Dark", emoji: "🌙" },
    { key: "satellite", label: "Satellite", emoji: "🛰️" },
    { key: "hd", label: "HD map", emoji: "🗺️" },
  ];

  return (
    <div className="pointer-events-auto absolute bottom-5 left-5 z-[1000] flex rounded-full bg-black/70 backdrop-blur-xl border border-white/15 shadow-2xl overflow-hidden">
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

const createCustomIcon = (isWorkplace: boolean, isFocused: boolean) => {
  const html = isWorkplace
    ? `<div class="h-4 w-4 rounded-full border-2 border-accent bg-accent shadow-[0_0_0_6px_hsl(var(--accent)/0.25)]"></div>`
    : `<div class="rounded-full border border-primary/90 bg-primary/85 transition-transform duration-200 hover:scale-110" style="width: ${isFocused ? '18px' : '14px'}; height: ${isFocused ? '18px' : '14px'}; box-shadow: ${isFocused ? '0 0 0 8px hsl(var(--primary) / 0.24)' : '0 0 0 5px hsl(var(--primary) / 0.18)'}"></div>`;
    
  return L.divIcon({
    className: 'custom-leaflet-marker bg-transparent border-none',
    html,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

export const PropertyMap = ({ workplace, properties, focusedPropertyId, toCurrency, onPropertyFocus }: PropertyMapProps) => {
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>("normal");
  const [popupPropertyId, setPopupPropertyId] = useState<number | null>(null);

  const focusedProperty = properties.find((property) => property.id === focusedPropertyId);
  const maxCommuteDistanceKm = useMemo(
    () => (properties.length ? Math.max(...properties.map((property) => property.distanceKm)) : 0),
    [properties]
  );
  
  const workplaceRadiusGeoJson = useMemo(
    () => createWorkplaceRadiusGeoJson(workplace, maxCommuteDistanceKm),
    [workplace, maxCommuteDistanceKm]
  );

  const polygonPositions = useMemo(() => {
    if (!workplaceRadiusGeoJson) return [];
    // Convert GeoJSON polygon to Leaflet LatLng arrays
    const coords = workplaceRadiusGeoJson.geometry.coordinates[0];
    return coords.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
  }, [workplaceRadiusGeoJson]);

  const workplaceAuraColor = useMemo(() => {
    if (typeof window === "undefined") return "hsl(258 84% 66%)";
    const accentToken = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    return accentToken ? `hsl(${accentToken})` : "hsl(258 84% 66%)";
  }, []);

  const center: [number, number] = focusedProperty 
    ? [focusedProperty.lat, focusedProperty.lng] 
    : [workplace.lat, workplace.lng];
    
  const zoom = focusedProperty ? 15 : 13.5;

  return (
    <div className="relative h-full w-full leaflet-dark-theme">
      <MapContainer
        center={[workplace.lat, workplace.lng]}
        zoom={13.5}
        zoomControl={false}
        scrollWheelZoom={true}
        className="h-full w-full bg-zinc-950 z-0"
      >
        <TileLayer
          url={TILE_LAYERS[mapViewMode].url}
          attribution={TILE_LAYERS[mapViewMode].attribution}
        />
        
        {/* Overlay Labels for Satellite mode */}
        {mapViewMode === "satellite" && (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
            attribution='&copy; CARTO Labels'
          />
        )}

        <MapController center={center} zoom={zoom} />

        {polygonPositions.length > 0 && (
          <Polygon 
            positions={polygonPositions} 
            pathOptions={{ 
              color: workplaceAuraColor, 
              weight: 2, 
              opacity: 0.6, 
              fillColor: workplaceAuraColor, 
              fillOpacity: 0.35 
            }} 
          />
        )}

        <Marker 
          position={[workplace.lat, workplace.lng]} 
          icon={createCustomIcon(true, false)}
          eventHandlers={{ click: () => setPopupPropertyId(-1) }}
        >
          {popupPropertyId === -1 && (
            <Popup className="map-dark-popup">
              <p className="text-sm font-semibold m-0 text-white">Workplace</p>
              <p className="text-xs text-white/70 m-0">{workplace.label}</p>
            </Popup>
          )}
        </Marker>

        {properties.map((property) => (
          <Marker 
            key={property.id} 
            position={[property.lat, property.lng]} 
            icon={createCustomIcon(false, focusedPropertyId === property.id)}
            eventHandlers={{ 
              click: () => {
                onPropertyFocus(property.id);
                setPopupPropertyId(property.id);
              } 
            }}
          >
            {popupPropertyId === property.id && (
              <Popup className="map-dark-popup auto-pan-off">
                <div className="space-y-1 p-1">
                  <p className="font-semibold text-white !m-0">{property.title}</p>
                  <p className="text-primary font-medium !m-0">{toCurrency(property.price)}</p>
                  <p className="text-white/70 text-xs !m-0">{property.commuteMinutes} min commute</p>
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>

      <MapStyleToggle mode={mapViewMode} onChange={setMapViewMode} />
    </div>
  );
};