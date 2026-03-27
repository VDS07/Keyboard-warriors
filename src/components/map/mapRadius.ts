type Workplace = {
  lat: number;
  lng: number;
};

type GeoJsonPolygonFeature = {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
  properties: {
    radiusKm: number;
  };
};

const EARTH_RADIUS_KM = 6371;

const destinationPoint = (lat: number, lng: number, bearingDeg: number, distanceKm: number) => {
  const bearing = (bearingDeg * Math.PI) / 180;
  const angularDistance = distanceKm / EARTH_RADIUS_KM;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  const destLat = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing),
  );

  const destLng =
    lngRad +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(destLat),
    );

  return {
    lat: (destLat * 180) / Math.PI,
    lng: ((destLng * 180) / Math.PI + 540) % 360 - 180,
  };
};

export const createWorkplaceRadiusGeoJson = (
  workplace: Workplace,
  radiusKm: number,
  points = 72,
): GeoJsonPolygonFeature | null => {
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
    return null;
  }

  const coordinates: number[][] = [];

  for (let i = 0; i <= points; i += 1) {
    const bearing = (i / points) * 360;
    const point = destinationPoint(workplace.lat, workplace.lng, bearing, radiusKm);
    coordinates.push([point.lng, point.lat]);
  }

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coordinates],
    },
    properties: {
      radiusKm,
    },
  };
};