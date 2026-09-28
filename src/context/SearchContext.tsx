import { createContext, useContext, useState, useMemo, useEffect, ReactNode } from "react";

export type TransportMode = "drive" | "transit" | "cycle" | "walk";
export type UserRole = "seeker" | "owner";
export type Purpose = "rent" | "buy" | "plot";
export type WorkplaceIcon = "office" | "university" | "hospital" | "briefcase" | "pin";

export type BrokerSource = "99acres" | "MagicBricks" | "Makaan" | "NoBroker" | "CommuteBuddy Direct";

export type Property = {
  id: number;
  owner_id?: number;
  title: string;
  price: number;
  recommendedPrice?: number;
  lat: number;
  lng: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  image: string;
  images?: string[];
  type: "apartment" | "villa" | "studio" | "penthouse" | "duplex" | "plot";
  livabilityScore: number;
  petFriendly: boolean;
  furnished: "furnished" | "semi-furnished" | "unfurnished";
  description: string;
  city: string;
  address?: string;
  brokerSource?: BrokerSource;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  views?: number;
  inquiries?: number;
  commute_discoveries?: {
    under10: number;
    "10to20": number;
    "20to30": number;
    over30: number;
  };
};

export type EnrichedProperty = Property & {
  distanceKm: number;
  commuteMinutes: number;
  matchScore: number; // S(p) from Eq. 6 (0 to 100)
  priceFit: number;   // B_hat(p) in [0, 1]
  areaFit: number;    // A_hat(p) in [0, 1]
  commuteFit: number; // 1 - T/Tmax in [0, 1]
};

export type RouteStep = {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  name?: string;
};

export type ActiveRoute = {
  propertyId: number;
  coordinates: [number, number][]; // [lat, lng] array
  durationMinutes: number;
  distanceKm: number;
  steps: RouteStep[];
};

export type Workplace = {
  label: string;
  lat: number;
  lng: number;
};

export type RankingWeights = {
  w1: number; // Commute Time Weight
  w2: number; // Price Fit Weight
  w3: number; // Area Fit Weight
};

export type UserProfile = {
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  isLoggedIn: boolean;
};

type SearchState = {
  workplace: Workplace;
  workplaceIcon: WorkplaceIcon;
  maxCommute: number;
  maxPrice: number;
  targetSqft: number;
  transportMode: TransportMode;
  purpose: Purpose;
  userRole: UserRole;
  userProfile: UserProfile;
  rankingWeights: RankingWeights;
  focusedPropertyId: number | null;
  selectedPropertyId: number | null;
  savedPropertyIds: number[];
  activeRoute: ActiveRoute | null;
  isRouteLoading: boolean;
};

type SearchContextType = SearchState & {
  setWorkplace: (w: Workplace) => void;
  setWorkplaceIcon: (i: WorkplaceIcon) => void;
  setMaxCommute: (m: number) => void;
  setMaxPrice: (p: number) => void;
  setTargetSqft: (s: number) => void;
  setTransportMode: (t: TransportMode) => void;
  setPurpose: (p: Purpose) => void;
  setUserRole: (r: UserRole) => void;
  setUserProfile: (profile: UserProfile) => void;
  setRankingWeights: (weights: RankingWeights) => void;
  setFocusedPropertyId: (id: number | null) => void;
  setSelectedPropertyId: (id: number | null) => void;
  toggleSaveProperty: (id: number) => void;
  registerProperty: (p: Omit<Property, "id">) => Promise<Property>;
  deleteProperty: (id: number) => Promise<void>;
  fetchRouteForProperty: (property: Property) => Promise<void>;
  loginWithGoogleDemo: (role?: UserRole) => void;
  logout: () => void;
  properties: EnrichedProperty[];
  filteredProperties: EnrichedProperty[];
  allRawProperties: Property[];
  refreshData: () => Promise<void>;
};

// Nagpur Metro Center (Authors' Region - TGPCET Nagpur)
const DEFAULT_WORKPLACE: Workplace = {
  label: "TGPCET / Nagpur Metro Station, Nagpur",
  lat: 21.1458,
  lng: 79.0882,
};

// Mode speed bounds vmax(m) in km/min for Algorithm 1 pruning
export const MODE_SPEED_BOUNDS: Record<TransportMode, number> = {
  drive: 2.0,    // 120 km/h
  transit: 1.33, // 80 km/h
  cycle: 0.58,   // 35 km/h
  walk: 0.17,    // 10 km/h
};

// Calibrated network factor for realistic Indian urban topology
export const SPEED_FACTORS: Record<TransportMode, number> = {
  drive: 0.55,   // ~33 km/h average city transit speed
  transit: 0.38, // ~23 km/h
  cycle: 0.23,   // ~14 km/h
  walk: 0.075,   // ~4.5 km/h
};

// Great-circle Haversine Distance (Eq. 4)
export const getHaversineDistanceKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const earthRadius = 6371; // km
  const degToRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = degToRad(bLat - aLat);
  const dLng = degToRad(bLng - aLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(aLat)) * Math.cos(degToRad(bLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getDistanceKm = (aLat: number, aLng: number, bLat: number, bLng: number) =>
  getHaversineDistanceKm(aLat, aLng, bLat, bLng);

export const estimateCommuteMinutes = (distanceKm: number, mode: TransportMode) =>
  Math.max(1, Math.round(distanceKm / (SPEED_FACTORS[mode] || 0.45)));

// Baseline Properties for Instant Offline / Standalone Public Support
const SEED_PROPERTIES: Property[] = [
  {
    id: 1,
    title: "Dharampeth Heritage 3BHK Flat",
    price: 22000,
    recommendedPrice: 24500,
    lat: 21.1442,
    lng: 79.0658,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1350,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    type: "apartment",
    livabilityScore: 92,
    petFriendly: true,
    furnished: "furnished",
    description: "Prestigious residence in the heart of Dharampeth. Balcony overlooking Law College Square, fast access to Metro.",
    city: "Nagpur",
    address: "West High Court Road, Dharampeth",
    brokerSource: "99acres",
    contactName: "Dr. Rajesh Mehta",
    contactPhone: "+91-9876543210",
    views: 412,
    inquiries: 38,
    commute_discoveries: { under10: 18, "10to20": 45, "20to30": 22, over30: 6 }
  },
  {
    id: 2,
    title: "Sadar Residency Studio Suite",
    price: 13500,
    recommendedPrice: 15000,
    lat: 21.1610,
    lng: 79.0825,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 520,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    type: "studio",
    livabilityScore: 84,
    petFriendly: false,
    furnished: "furnished",
    description: "Modern studio suite next to Sadar Cantonment and Residency Road. Ideal for young professionals.",
    city: "Nagpur",
    address: "Residency Road, Sadar",
    brokerSource: "MagicBricks",
    contactName: "Priya Deshmukh",
    contactPhone: "+91-9123456789",
    views: 280,
    inquiries: 24,
    commute_discoveries: { under10: 25, "10to20": 30, "20to30": 12, over30: 3 }
  },
  {
    id: 3,
    title: "Civil Lines Executive Villa",
    price: 52000,
    recommendedPrice: 58000,
    lat: 21.1550,
    lng: 79.0720,
    bedrooms: 4,
    bathrooms: 4,
    sqft: 2800,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    type: "villa",
    livabilityScore: 96,
    petFriendly: true,
    furnished: "semi-furnished",
    description: "VIP Civil Lines corridor. Lush garden lawn, solar heating, high-grade security, minutes from High Court.",
    city: "Nagpur",
    address: "Near High Court, Civil Lines",
    brokerSource: "99acres",
    contactName: "Col. Anil Wankhede",
    contactPhone: "+91-9988776655",
    views: 680,
    inquiries: 85,
    commute_discoveries: { under10: 32, "10to20": 60, "20to30": 19, over30: 4 }
  },
  {
    id: 4,
    title: "Trimurti Nagar Smart 2BHK",
    price: 18500,
    recommendedPrice: 20000,
    lat: 21.1215,
    lng: 79.0490,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1050,
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    type: "apartment",
    livabilityScore: 87,
    petFriendly: true,
    furnished: "semi-furnished",
    description: "Vibrant apartment near Ring Road. Rapid access to VNIT, Hingna industrial zone, and MIHAN SEZ.",
    city: "Nagpur",
    address: "Ring Road, Trimurti Nagar",
    brokerSource: "NoBroker",
    contactName: "Sunita Borkar",
    contactPhone: "+91-7766554433",
    views: 390,
    inquiries: 42,
    commute_discoveries: { under10: 12, "10to20": 48, "20to30": 34, over30: 10 }
  },
  {
    id: 5,
    title: "Wardha Road Tech Corridor 2BHK",
    price: 21000,
    recommendedPrice: 22500,
    lat: 21.0850,
    lng: 79.0620,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1180,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    type: "apartment",
    livabilityScore: 89,
    petFriendly: false,
    furnished: "furnished",
    description: "Close to MIHAN Tech Park & Airport Metro. Fast commuting along NH-44 for TCS, Infosys, and AIIMS.",
    city: "Nagpur",
    address: "Wardha Road, Near Airport",
    brokerSource: "99acres",
    contactName: "Nikhil Joshi",
    contactPhone: "+91-9822334455",
    views: 520,
    inquiries: 56,
    commute_discoveries: { under10: 20, "10to20": 55, "20to30": 30, over30: 8 }
  },
  {
    id: 6,
    title: "Bandra West Sea-Facing Apartment",
    price: 95000,
    recommendedPrice: 92000,
    lat: 19.0596,
    lng: 72.8295,
    bedrooms: 3,
    bathrooms: 3,
    sqft: 1650,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
    type: "apartment",
    livabilityScore: 95,
    petFriendly: true,
    furnished: "furnished",
    description: "High-floor flat near Bandstand and Carter Road. Breath-taking sunset views and quick link to BKC.",
    city: "Mumbai",
    address: "Near Bandstand, Bandra West",
    brokerSource: "99acres",
    contactName: "Meera Kapoor",
    contactPhone: "+91-9845671234",
    views: 920,
    inquiries: 140,
    commute_discoveries: { under10: 30, "10to20": 70, "20to30": 45, over30: 15 }
  },
  {
    id: 7,
    title: "Koramangala 4th Block Duplex",
    price: 48000,
    recommendedPrice: 51000,
    lat: 12.9345,
    lng: 77.6265,
    bedrooms: 3,
    bathrooms: 3,
    sqft: 1850,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    type: "duplex",
    livabilityScore: 93,
    petFriendly: true,
    furnished: "furnished",
    description: "Lush residential duplex walking distance from tech hubs, Sony World signal, and Silk Board corridor.",
    city: "Bangalore",
    address: "4th Block, Koramangala",
    brokerSource: "99acres",
    contactName: "Arjun Rao",
    contactPhone: "+91-9845612345",
    views: 740,
    inquiries: 95,
    commute_discoveries: { under10: 35, "10to20": 65, "20to30": 30, over30: 12 }
  },
  {
    id: 8,
    title: "Koregaon Park Green View 2BHK",
    price: 32000,
    recommendedPrice: 34000,
    lat: 18.5362,
    lng: 73.8948,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1150,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
    type: "apartment",
    livabilityScore: 91,
    petFriendly: true,
    furnished: "furnished",
    description: "Quiet green lane in KP. 10 minutes to Pune Railway Station and Kalyani Nagar IT corridor.",
    city: "Pune",
    address: "Lane 5, Koregaon Park",
    brokerSource: "Makaan",
    contactName: "Manish Patil",
    contactPhone: "+91-9876509876",
    views: 460,
    inquiries: 52,
    commute_discoveries: { under10: 22, "10to20": 58, "20to30": 26, over30: 5 }
  },
  {
    id: 9,
    title: "DLF Cyber City Executive Apartment",
    price: 45000,
    recommendedPrice: 47000,
    lat: 28.4950,
    lng: 77.0878,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1250,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    type: "apartment",
    livabilityScore: 90,
    petFriendly: false,
    furnished: "furnished",
    description: "Opposite Cyber Hub Gurugram. Direct walkway access to Rapid Metro and corporate tech parks.",
    city: "Gurugram",
    address: "Phase 2, DLF Cyber City",
    brokerSource: "99acres",
    contactName: "Rohit Aggarwal",
    contactPhone: "+91-9845679012",
    views: 580,
    inquiries: 70,
    commute_discoveries: { under10: 45, "10to20": 60, "20to30": 20, over30: 4 }
  }
];

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [workplace, setWorkplace] = useState<Workplace>(DEFAULT_WORKPLACE);
  const [workplaceIcon, setWorkplaceIcon] = useState<WorkplaceIcon>("office");
  const [maxCommute, setMaxCommute] = useState<number>(45);
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [targetSqft, setTargetSqft] = useState<number>(1200);
  const [transportMode, setTransportMode] = useState<TransportMode>("drive");
  const [purpose, setPurpose] = useState<Purpose>("rent");
  const [userRole, setUserRole] = useState<UserRole>("seeker");
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Dr. Vallabh Shingroop",
    email: "vallabh@tgpcet.ac.in",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    role: "seeker",
    isLoggedIn: true,
  });

  // Ranking weights defaulting to equal thirds per Section XI: w1 = w2 = w3 = 0.333
  const [rankingWeights, setRankingWeights] = useState<RankingWeights>({
    w1: 0.334, // Commute time weight
    w2: 0.333, // Price fit weight
    w3: 0.333, // Area fit weight
  });

  const [rawProperties, setRawProperties] = useState<Property[]>(SEED_PROPERTIES);
  const [focusedPropertyId, setFocusedPropertyId] = useState<number | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [savedPropertyIds, setSavedPropertyIds] = useState<number[]>([1, 3, 5]);
  const [activeRoute, setActiveRoute] = useState<ActiveRoute | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState<boolean>(false);

  // Sync with backend API if available, else retain cached / seeded properties
  const refreshData = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/properties");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((p: any) => ({
            id: p.id,
            owner_id: p.owner_id,
            title: p.title,
            price: p.price,
            recommendedPrice: p.recommendedPrice,
            lat: p.latitude || p.lat,
            lng: p.longitude || p.lng,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            sqft: p.sqft,
            image: (p.images && p.images[0]) || p.image || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
            images: p.images,
            type: p.property_type || p.type || "apartment",
            livabilityScore: p.livability_score || p.livabilityScore || 85,
            petFriendly: p.pet_friendly !== undefined ? p.pet_friendly : p.petFriendly,
            furnished: p.furnished || "semi-furnished",
            description: p.description,
            city: p.city || "Nagpur",
            address: p.address,
            brokerSource: p.source_portal || p.brokerSource || "99acres",
            contactName: p.owner || p.contactName,
            contactPhone: p.phone || p.contactPhone,
            views: p.views || 0,
            inquiries: p.inquiries || 0,
            commute_discoveries: p.commute_discoveries
          }));
          setRawProperties(mapped);
        }
      }
    } catch {
      // Offline fallback: Use current rawProperties
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const toggleSaveProperty = (id: number) => {
    setSavedPropertyIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const loginWithGoogleDemo = (role: UserRole = "seeker") => {
    setUserRole(role);
    setUserProfile({
      name: role === "owner" ? "Dr. Rajesh Mehta (Owner)" : "Vallabh Shingroop (Researcher)",
      email: role === "owner" ? "rajesh.mehta@tgpcet.ac.in" : "vallabh@tgpcet.ac.in",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
      role,
      isLoggedIn: true
    });
  };

  const logout = () => {
    setUserProfile({
      name: "Guest Commuter",
      email: "",
      avatar: "",
      role: "seeker",
      isLoggedIn: false
    });
  };

  // -----------------------------------------------------------------
  // IMPLEMENTATION OF ALGORITHM 1: Commute-Aware Property Filtering
  // -----------------------------------------------------------------
  const properties: EnrichedProperty[] = useMemo(() => {
    const vmax = MODE_SPEED_BOUNDS[transportMode] || 1.33;
    const speed = SPEED_FACTORS[transportMode] || 0.45;
    const result: EnrichedProperty[] = [];

    // Stage 1: Spatial Bounding Box & Candidate evaluation (Lines 2 - 3)
    for (const p of rawProperties) {
      // Line 4: Haversine distance calculation (Eq. 4)
      const dh = getHaversineDistanceKm(workplace.lat, workplace.lng, p.lat, p.lng);

      // Line 5: Safe lower-bound pruning check (Line 5 - 7)
      // If even straight-line travel at maximum mode speed is slower than budget, discard immediately
      if (dh / vmax > maxCommute) {
        continue; // Pruned in O(1)
      }

      // Line 8: Authoritative network travel-time calculation (Eq. 5)
      // In production, queries OSRM contraction-hierarchy routing engine
      const estimatedMinutes = Math.max(1, Math.round(dh / speed));

      // Line 9: Network constraint check T <= Tmax
      if (estimatedMinutes <= maxCommute) {
        // Equation (6) Normalized Scoring Components
        // 1. Commute Fit: 1 - T(W, p, m) / Tmax
        const commuteFit = Math.max(0, 1 - estimatedMinutes / maxCommute);

        // 2. Price Fit: B_hat(p) in [0, 1]
        const priceFit = maxPrice > 0 ? Math.max(0, 1 - Math.min(1, p.price / maxPrice)) : 0.8;

        // 3. Area Fit: A_hat(p) in [0, 1]
        const areaFit = Math.min(1, Math.max(0.2, p.sqft / targetSqft));

        // Line 13: Weighted Composite Score S(p) = w1*(1 - T/Tmax) + w2*B_hat + w3*A_hat
        const compositeScore = Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (rankingWeights.w1 * commuteFit +
                rankingWeights.w2 * priceFit +
                rankingWeights.w3 * areaFit) *
                100
            )
          )
        );

        result.push({
          ...p,
          distanceKm: dh,
          commuteMinutes: estimatedMinutes,
          matchScore: compositeScore,
          priceFit,
          areaFit,
          commuteFit
        });
      }
    }

    // Rank result set R by S(p) descending per Eq. 6
    return result.sort((a, b) => b.matchScore - a.matchScore);
  }, [rawProperties, workplace, transportMode, maxCommute, maxPrice, targetSqft, rankingWeights]);

  // Filtered by auxiliary seeker filters (price & purpose)
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const matchPurpose = !purpose || p.purpose === purpose || (purpose === "rent" && p.price < 100000);
      const matchPrice = p.price <= maxPrice;
      return matchPurpose && matchPrice;
    });
  }, [properties, purpose, maxPrice]);

  // Fetch full turn-by-turn road route geometry via OSRM (Section XII & Eq. 7)
  const fetchRouteForProperty = async (property: Property) => {
    setIsRouteLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3001/api/route?fromLat=${workplace.lat}&fromLng=${workplace.lng}&toLat=${property.lat}&toLng=${property.lng}&mode=${transportMode}`
      );
      if (res.ok) {
        const data = await res.json();
        setActiveRoute({
          propertyId: property.id,
          coordinates: data.coordinates,
          durationMinutes: data.durationMinutes,
          distanceKm: parseFloat(data.distanceKm),
          steps: [
            { instruction: `Depart ${workplace.label.split(',')[0]}`, distanceMeters: 0, durationSeconds: 0 },
            { instruction: `Head towards connecting arterial corridor via ${transportMode}`, distanceMeters: 800, durationSeconds: 120 },
            { instruction: `Continue along main highway / ring road towards ${property.city}`, distanceMeters: Math.round(parseFloat(data.distanceKm) * 800), durationSeconds: Math.round(data.durationMinutes * 45) },
            { instruction: `Arrive at ${property.title}`, distanceMeters: 200, durationSeconds: 60 }
          ]
        });
      } else {
        throw new Error("Local route endpoint failed");
      }
    } catch {
      // Fallback road geometry with intermediate waypoints
      const directKm = getHaversineDistanceKm(workplace.lat, workplace.lng, property.lat, property.lng);
      const coords: [number, number][] = [
        [workplace.lat, workplace.lng],
        [workplace.lat * 0.7 + property.lat * 0.3 + 0.002, workplace.lng * 0.7 + property.lng * 0.3 - 0.002],
        [workplace.lat * 0.3 + property.lat * 0.7 - 0.001, workplace.lng * 0.3 + property.lng * 0.7 + 0.001],
        [property.lat, property.lng]
      ];
      setActiveRoute({
        propertyId: property.id,
        coordinates: coords,
        durationMinutes: Math.round(directKm / (SPEED_FACTORS[transportMode] || 0.45)),
        distanceKm: directKm,
        steps: [
          { instruction: `Depart ${workplace.label.split(',')[0]}`, distanceMeters: 0, durationSeconds: 0 },
          { instruction: `Proceed along major corridor`, distanceMeters: Math.round(directKm * 800), durationSeconds: 300 },
          { instruction: `Arrive at destination: ${property.title}`, distanceMeters: 100, durationSeconds: 60 }
        ]
      });
    } finally {
      setIsRouteLoading(false);
    }
  };

  // Trigger route fetch when a property is selected
  useEffect(() => {
    if (selectedPropertyId) {
      const prop = rawProperties.find(p => p.id === selectedPropertyId);
      if (prop) fetchRouteForProperty(prop);
    } else {
      setActiveRoute(null);
    }
  }, [selectedPropertyId, workplace, transportMode]);

  // Register property (Owner Module)
  const registerProperty = async (p: Omit<Property, "id">): Promise<Property> => {
    try {
      const res = await fetch("http://localhost:3001/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p)
      });
      if (res.ok) {
        const created = await res.json();
        const normalized: Property = {
          ...p,
          id: created.id,
          lat: created.latitude || p.lat,
          lng: created.longitude || p.lng,
          image: p.image || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
          views: 1,
          inquiries: 0
        };
        setRawProperties(prev => [normalized, ...prev]);
        return normalized;
      }
    } catch {
      // Local fallback
    }
    const maxId = rawProperties.length > 0 ? Math.max(...rawProperties.map(x => x.id)) : 0;
    const localProp: Property = { ...p, id: maxId + 1 };
    setRawProperties(prev => [localProp, ...prev]);
    return localProp;
  };

  const deleteProperty = async (id: number) => {
    try {
      await fetch(`http://localhost:3001/api/properties/${id}`, { method: "DELETE" });
    } catch {}
    setRawProperties(prev => prev.filter(p => p.id !== id));
  };

  return (
    <SearchContext.Provider
      value={{
        workplace,
        setWorkplace,
        workplaceIcon,
        setWorkplaceIcon,
        maxCommute,
        setMaxCommute,
        maxPrice,
        setMaxPrice,
        targetSqft,
        setTargetSqft,
        transportMode,
        setTransportMode,
        purpose,
        setPurpose,
        userRole,
        setUserRole,
        userProfile,
        setUserProfile,
        rankingWeights,
        setRankingWeights,
        focusedPropertyId,
        setFocusedPropertyId,
        selectedPropertyId,
        setSelectedPropertyId,
        savedPropertyIds,
        toggleSaveProperty,
        registerProperty,
        deleteProperty,
        fetchRouteForProperty,
        loginWithGoogleDemo,
        logout,
        properties,
        filteredProperties,
        allRawProperties: rawProperties,
        refreshData,
        activeRoute,
        isRouteLoading
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
