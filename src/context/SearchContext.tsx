import { createContext, useContext, useState, useMemo, ReactNode } from "react";

export type TransportMode = "drive" | "transit" | "cycle" | "walk";
export type UserRole = "buyer" | "owner" | null;
export type Purpose = "rent" | "buy" | "plot";
export type WorkplaceIcon = "office" | "university" | "hospital" | "briefcase" | "pin";

export type BrokerSource = "MagicBricks" | "Housing.com" | "NoBroker" | "99acres";

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
  city: string;
  brokerSource?: BrokerSource;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
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
  workplace2: Workplace | null;
  workplaceIcon: WorkplaceIcon;
  maxCommute: number;
  maxPrice: number;
  transportMode: TransportMode;
  purpose: Purpose;
  userRole: UserRole;
  focusedPropertyId: number | null;
  selectedPropertyId: number | null;
  savedPropertyIds: number[];
};

type SearchContextType = SearchState & {
  setWorkplace: (w: Workplace) => void;
  setWorkplace2: (w: Workplace | null) => void;
  setWorkplaceIcon: (i: WorkplaceIcon) => void;
  setMaxCommute: (m: number) => void;
  setMaxPrice: (p: number) => void;
  setTransportMode: (t: TransportMode) => void;
  setPurpose: (p: Purpose) => void;
  setUserRole: (r: UserRole) => void;
  setFocusedPropertyId: (id: number | null) => void;
  setSelectedPropertyId: (id: number | null) => void;
  toggleSaveProperty: (id: number) => void;
  registerProperty: (p: Omit<Property, "id">) => void;
  properties: EnrichedProperty[];
  filteredProperties: EnrichedProperty[];
};

const DEFAULT_WORKPLACE: Workplace = {
  label: "Nagpur Railway Station, Nagpur",
  lat: 21.1458,
  lng: 79.0882,
};

// Speed multipliers (km per minute) for different transport modes
export const SPEED_FACTORS: Record<TransportMode, number> = {
  drive: 0.55,
  transit: 0.35,
  cycle: 0.22,
  walk: 0.07,
};

export const getDistanceKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const earthRadius = 6371;
  const degToRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = degToRad(bLat - aLat);
  const dLng = degToRad(bLng - aLng);
  const m =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(aLat)) * Math.cos(degToRad(bLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * earthRadius * Math.atan2(Math.sqrt(m), Math.sqrt(1 - m));
};

export const estimateCommuteMinutes = (distanceKm: number, mode: TransportMode) =>
  Math.round(distanceKm / SPEED_FACTORS[mode]);

// Curated Images for realistic property listings
const IMAGES = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400",
];

const BROKERS: BrokerSource[] = ["MagicBricks", "Housing.com", "NoBroker", "99acres"];

// Helper to generate dynamic live surrounding listings for ANY searched location
const generateLiveListingsForLocation = (wp: Workplace): Property[] => {
  const cityName = wp.label.split(",").reverse()[1]?.trim() || wp.label.split(",")[0] || "Metropolitan";
  
  // Create relative coordinate offsets around the workplace (from 1 km to 25 km out to support up to 4+ hour commute ranges)
  const offsets = [
    { title: "Grand Heritage Heights", latOffset: 0.012, lngOffset: 0.015, price: 22000, beds: 2, sqft: 1100, type: "apartment" as const },
    { title: "Greenwood Residency", latOffset: -0.018, lngOffset: 0.022, price: 16500, beds: 1, sqft: 750, type: "apartment" as const },
    { title: "Royal Palms Penthouse", latOffset: 0.025, lngOffset: -0.019, price: 65000, beds: 3, sqft: 2100, type: "penthouse" as const },
    { title: "Metroview Studio Suites", latOffset: -0.008, lngOffset: -0.011, price: 12500, beds: 0, sqft: 420, type: "studio" as const },
    { title: "Sunrise Vista Duplex", latOffset: 0.035, lngOffset: 0.040, price: 34000, beds: 3, sqft: 1750, type: "duplex" as const },
    { title: "Lakeside Eco Villa", latOffset: -0.042, lngOffset: -0.035, price: 48000, beds: 4, sqft: 2400, type: "villa" as const },
    { title: "Central Park Apartments", latOffset: 0.005, lngOffset: -0.006, price: 19500, beds: 2, sqft: 980, type: "apartment" as const },
    { title: "Skyline Tower Luxury 2BHK", latOffset: -0.028, lngOffset: 0.030, price: 28000, beds: 2, sqft: 1250, type: "apartment" as const },
    { title: "Orchard Enclave Row House", latOffset: 0.050, lngOffset: -0.045, price: 42000, beds: 3, sqft: 1900, type: "villa" as const },
    { title: "Urban Edge Smart Homes", latOffset: -0.015, lngOffset: 0.008, price: 14000, beds: 1, sqft: 650, type: "apartment" as const },
    { title: "Suburban Green Meadows", latOffset: 0.085, lngOffset: 0.090, price: 11500, beds: 2, sqft: 900, type: "apartment" as const },
    { title: "Valley View Country Estates", latOffset: -0.120, lngOffset: 0.110, price: 38000, beds: 3, sqft: 1800, type: "villa" as const },
  ];

  return offsets.map((item, idx) => ({
    id: idx + 1,
    title: `${item.title} (${cityName})`,
    price: item.price,
    lat: wp.lat + item.latOffset,
    lng: wp.lng + item.lngOffset,
    bedrooms: item.beds,
    bathrooms: Math.max(1, item.beds),
    sqft: item.sqft,
    image: IMAGES[idx % IMAGES.length],
    type: item.type,
    livabilityScore: 72 + ((idx * 7) % 25),
    petFriendly: idx % 2 === 0,
    furnished: idx % 3 === 0 ? "furnished" : idx % 3 === 1 ? "semi-furnished" : "unfurnished",
    description: `Live property listing located in ${cityName} near ${wp.label}. Verified listing fetched via ${BROKERS[idx % BROKERS.length]}. Features 24/7 security and high transport connectivity.`,
    city: cityName,
    brokerSource: BROKERS[idx % BROKERS.length],
    contactName: idx % 2 === 0 ? "Rajesh Sharma (Owner)" : "Priya Deshmukh (Broker)",
    contactPhone: `+91-9876${(10000 + idx * 321).toString().substring(0, 6)}`,
    contactEmail: `contact.property${idx + 1}@realestate.in`,
  }));
};

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [workplace, setWorkplace] = useState(DEFAULT_WORKPLACE);
  const [workplace2, setWorkplace2] = useState<Workplace | null>(null);
  const [workplaceIcon, setWorkplaceIcon] = useState<WorkplaceIcon>("office");
  const [maxCommute, setMaxCommute] = useState(45);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [transportMode, setTransportMode] = useState<TransportMode>("transit");
  const [purpose, setPurpose] = useState<Purpose>("rent");
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [ownerProperties, setOwnerProperties] = useState<Property[]>([]);
  const [focusedPropertyId, setFocusedPropertyId] = useState<number | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [savedPropertyIds, setSavedPropertyIds] = useState<number[]>([1, 4, 7]);

  // Dynamically generate live surrounding listings relative to current workplace location
  const liveBaseProperties = useMemo(() => generateLiveListingsForLocation(workplace), [workplace]);

  const toggleSaveProperty = (id: number) => {
    setSavedPropertyIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const properties: EnrichedProperty[] = useMemo(() => {
    const combinedList = [...liveBaseProperties, ...ownerProperties];
    return combinedList.map((property) => {
      const distanceKm = getDistanceKm(workplace.lat, workplace.lng, property.lat, property.lng);
      return {
        ...property,
        distanceKm,
        commuteMinutes: estimateCommuteMinutes(distanceKm, transportMode),
      };
    }).sort((a, b) => a.commuteMinutes - b.commuteMinutes);
  }, [liveBaseProperties, workplace, transportMode, ownerProperties]);

  const registerProperty = (p: Omit<Property, "id">) => {
    const allPropertyIds = [...liveBaseProperties.map(pl => pl.id), ...ownerProperties.map(op => op.id)];
    const newId = allPropertyIds.length > 0 ? Math.max(...allPropertyIds) + 1 : 1;
    setOwnerProperties(prev => [...prev, { ...p, id: newId } as Property]);
  };

  const filteredProperties = useMemo(
    () => properties.filter((p) => p.commuteMinutes <= maxCommute && p.price <= maxPrice),
    [properties, maxCommute, maxPrice],
  );

  return (
    <SearchContext.Provider
      value={{
        workplace, setWorkplace,
        workplace2, setWorkplace2,
        workplaceIcon, setWorkplaceIcon,
        maxCommute, setMaxCommute,
        maxPrice, setMaxPrice,
        transportMode, setTransportMode,
        purpose, setPurpose,
        userRole, setUserRole,
        focusedPropertyId, setFocusedPropertyId,
        selectedPropertyId, setSelectedPropertyId,
        savedPropertyIds, toggleSaveProperty,
        registerProperty,
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

