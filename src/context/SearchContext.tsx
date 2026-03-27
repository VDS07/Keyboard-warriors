import { createContext, useContext, useState, useMemo, ReactNode } from "react";

export type TransportMode = "drive" | "transit" | "cycle" | "walk";
export type UserRole = "buyer" | "owner" | null;

export type Property = {
  id: number;
  title: string;
  price: number;
  lat: number;
  lng: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  image: string;
  type: "apartment" | "villa" | "studio" | "penthouse" | "duplex";
  livabilityScore: number;
  petFriendly: boolean;
  furnished: "furnished" | "semi-furnished" | "unfurnished";
  description: string;
};

export type EnrichedProperty = Property & {
  distanceKm: number;
  commuteMinutes: number;
};

type Workplace = {
  label: string;
  lat: number;
  lng: number;
};

type SearchState = {
  workplace: Workplace;
  maxCommute: number;
  maxPrice: number;
  transportMode: TransportMode;
  userRole: UserRole;
  focusedPropertyId: number | null;
  selectedPropertyId: number | null;
};

type SearchContextType = SearchState & {
  setWorkplace: (w: Workplace) => void;
  setMaxCommute: (m: number) => void;
  setMaxPrice: (p: number) => void;
  setTransportMode: (t: TransportMode) => void;
  setUserRole: (r: UserRole) => void;
  setFocusedPropertyId: (id: number | null) => void;
  setSelectedPropertyId: (id: number | null) => void;
  properties: EnrichedProperty[];
  filteredProperties: EnrichedProperty[];
};

const DEFAULT_WORKPLACE: Workplace = {
  label: "Times Square, New York",
  lat: 40.758,
  lng: -73.9855,
};

// Speed multipliers (km per minute) for different transport modes
const SPEED_FACTORS: Record<TransportMode, number> = {
  drive: 0.6,
  transit: 0.42,
  cycle: 0.28,
  walk: 0.08,
};

const getDistanceKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const earthRadius = 6371;
  const degToRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = degToRad(bLat - aLat);
  const dLng = degToRad(bLng - aLng);
  const m =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(aLat)) * Math.cos(degToRad(bLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * earthRadius * Math.atan2(Math.sqrt(m), Math.sqrt(1 - m));
};

const estimateCommuteMinutes = (distanceKm: number, mode: TransportMode) =>
  Math.round(distanceKm / SPEED_FACTORS[mode]);

export const PROPERTY_LIST: Property[] = [
  { id: 1, title: "Harborview Studio", price: 2100, lat: 40.7449, lng: -73.9952, bedrooms: 0, bathrooms: 1, sqft: 450, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400", type: "studio", livabilityScore: 82, petFriendly: false, furnished: "furnished", description: "Cozy studio with harbor views and modern finishes." },
  { id: 2, title: "Riverside Loft", price: 2980, lat: 40.7323, lng: -74.0079, bedrooms: 1, bathrooms: 1, sqft: 720, image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400", type: "apartment", livabilityScore: 88, petFriendly: true, furnished: "semi-furnished", description: "Sunlit loft with exposed brick and river proximity." },
  { id: 3, title: "Chelsea Corner", price: 2650, lat: 40.7465, lng: -74.0014, bedrooms: 1, bathrooms: 1, sqft: 680, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400", type: "apartment", livabilityScore: 91, petFriendly: true, furnished: "furnished", description: "Prime Chelsea location with gallery district access." },
  { id: 4, title: "Midtown Nest", price: 3200, lat: 40.7558, lng: -73.9845, bedrooms: 2, bathrooms: 1, sqft: 850, image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400", type: "apartment", livabilityScore: 76, petFriendly: false, furnished: "unfurnished", description: "Spacious 2BR in the heart of Midtown Manhattan." },
  { id: 5, title: "Union Square Flat", price: 2875, lat: 40.7359, lng: -73.9911, bedrooms: 1, bathrooms: 1, sqft: 600, image: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400", type: "apartment", livabilityScore: 93, petFriendly: true, furnished: "furnished", description: "Steps from Union Square park and farmers market." },
  { id: 6, title: "Williamsburg View", price: 2790, lat: 40.7126, lng: -73.9574, bedrooms: 2, bathrooms: 1, sqft: 900, image: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400", type: "apartment", livabilityScore: 85, petFriendly: true, furnished: "semi-furnished", description: "Trendy Williamsburg with rooftop access." },
  { id: 7, title: "Astoria Garden Apt", price: 2420, lat: 40.7642, lng: -73.9235, bedrooms: 2, bathrooms: 1, sqft: 820, image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400", type: "apartment", livabilityScore: 79, petFriendly: true, furnished: "unfurnished", description: "Quiet garden apartment in family-friendly Astoria." },
  { id: 8, title: "Downtown One-Bed", price: 3360, lat: 40.7092, lng: -74.0107, bedrooms: 1, bathrooms: 1, sqft: 580, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400", type: "apartment", livabilityScore: 72, petFriendly: false, furnished: "furnished", description: "Modern high-rise downtown with gym and doorman." },
  { id: 9, title: "Park Slope Home", price: 2580, lat: 40.6726, lng: -73.9772, bedrooms: 2, bathrooms: 2, sqft: 1050, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400", type: "duplex", livabilityScore: 95, petFriendly: true, furnished: "semi-furnished", description: "Beautiful brownstone duplex near Prospect Park." },
  { id: 10, title: "Prospect Heights", price: 2480, lat: 40.6807, lng: -73.9682, bedrooms: 1, bathrooms: 1, sqft: 650, image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400", type: "apartment", livabilityScore: 87, petFriendly: false, furnished: "unfurnished", description: "Near Brooklyn Museum and Botanic Garden." },
  { id: 11, title: "Long Island City", price: 3150, lat: 40.7444, lng: -73.9489, bedrooms: 2, bathrooms: 2, sqft: 980, image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400", type: "apartment", livabilityScore: 81, petFriendly: true, furnished: "furnished", description: "Skyline views and quick subway access to Manhattan." },
  { id: 12, title: "Upper West Residence", price: 3040, lat: 40.7879, lng: -73.9754, bedrooms: 2, bathrooms: 1, sqft: 870, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400", type: "apartment", livabilityScore: 90, petFriendly: true, furnished: "semi-furnished", description: "Classic UWS charm near Central Park." },
  { id: 13, title: "Morningside Retreat", price: 2380, lat: 40.8091, lng: -73.9625, bedrooms: 1, bathrooms: 1, sqft: 560, image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400", type: "apartment", livabilityScore: 74, petFriendly: false, furnished: "unfurnished", description: "Peaceful retreat near Columbia University." },
  { id: 14, title: "DUMBO Skyline", price: 3480, lat: 40.7033, lng: -73.9881, bedrooms: 2, bathrooms: 2, sqft: 1100, image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400", type: "penthouse", livabilityScore: 96, petFriendly: true, furnished: "furnished", description: "Premium penthouse with Brooklyn Bridge views." },
  { id: 15, title: "Greenpoint Condo", price: 2720, lat: 40.7296, lng: -73.9549, bedrooms: 1, bathrooms: 1, sqft: 700, image: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=400", type: "apartment", livabilityScore: 83, petFriendly: true, furnished: "semi-furnished", description: "Artsy Greenpoint with waterfront parks nearby." },
  { id: 16, title: "Jackson Heights", price: 2290, lat: 40.7551, lng: -73.8854, bedrooms: 2, bathrooms: 1, sqft: 800, image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400", type: "apartment", livabilityScore: 70, petFriendly: false, furnished: "unfurnished", description: "Diverse, affordable neighborhood with great food." },
  { id: 17, title: "Bed-Stuy Duplex", price: 2360, lat: 40.6876, lng: -73.9416, bedrooms: 3, bathrooms: 2, sqft: 1200, image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400", type: "duplex", livabilityScore: 78, petFriendly: true, furnished: "unfurnished", description: "Spacious family duplex with backyard." },
  { id: 18, title: "Bay Ridge Apartment", price: 2190, lat: 40.6261, lng: -74.0327, bedrooms: 2, bathrooms: 1, sqft: 850, image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400", type: "apartment", livabilityScore: 68, petFriendly: false, furnished: "semi-furnished", description: "Quiet Bay Ridge with waterfront promenade." },
];

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [workplace, setWorkplace] = useState(DEFAULT_WORKPLACE);
  const [maxCommute, setMaxCommute] = useState(30);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [transportMode, setTransportMode] = useState<TransportMode>("transit");
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [focusedPropertyId, setFocusedPropertyId] = useState<number | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

  const properties: EnrichedProperty[] = useMemo(() => {
    return PROPERTY_LIST.map((property) => {
      const distanceKm = getDistanceKm(workplace.lat, workplace.lng, property.lat, property.lng);
      return {
        ...property,
        distanceKm,
        commuteMinutes: estimateCommuteMinutes(distanceKm, transportMode),
      };
    }).sort((a, b) => a.commuteMinutes - b.commuteMinutes);
  }, [workplace, transportMode]);

  const filteredProperties = useMemo(
    () => properties.filter((p) => p.commuteMinutes <= maxCommute && p.price <= maxPrice),
    [properties, maxCommute, maxPrice],
  );

  return (
    <SearchContext.Provider
      value={{
        workplace, setWorkplace,
        maxCommute, setMaxCommute,
        maxPrice, setMaxPrice,
        transportMode, setTransportMode,
        userRole, setUserRole,
        focusedPropertyId, setFocusedPropertyId,
        selectedPropertyId, setSelectedPropertyId,
        properties,
        filteredProperties,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}
