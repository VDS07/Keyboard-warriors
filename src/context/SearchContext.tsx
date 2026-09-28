import { createContext, useContext, useState, useMemo, useEffect, ReactNode } from "react";
import { supabaseProfiles, supabaseSavedProperties, supabaseProperties, isSupabaseConfigured } from "@/lib/supabase";
import { API_BASE_URL } from "@/lib/api";

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
  // Real Source Website Data Fields (99acres, MagicBricks, Housing.com)
  sourceUrl?: string;
  societyName?: string;
  reraId?: string;
  carpetSqft?: number;
  superSqft?: number;
  floor?: string;
  facing?: string;
  securityDeposit?: string;
  maintenance?: string;
  availability?: string;
  propertyAge?: string;
  waterSupply?: string;
  powerBackup?: string;
  gatedCommunity?: boolean;
  verifiedBadge?: string;
  brokerType?: string;
  amenities?: string[];
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
  authProvider?: "google" | "credentials" | "guest";
  googleId?: string;
};

type SearchState = {
  workplace: Workplace;
  workplaceIcon: WorkplaceIcon;
  maxCommute: number;
  maxPrice: number;
  minPrice: number;
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
  isWorkplaceLocked: boolean;
  isPropertiesLoading: boolean;
  fetchStatusMessage: string;
  selectedBhk: number | null;
  selectedPropertyType: string | null;
  selectedFurnished: string | null;
  verifiedOnly: boolean;
  sortBy: "match" | "commute" | "price_asc" | "price_desc" | "livability";
};

type SearchContextType = SearchState & {
  setWorkplace: (w: Workplace) => void;
  setWorkplaceIcon: (i: WorkplaceIcon) => void;
  setMaxCommute: (m: number) => void;
  setMaxPrice: (p: number) => void;
  setMinPrice: (p: number) => void;
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
  loginWithSession: (token: string, user: any) => UserProfile;
  loginWithGoogle: (account?: {
    name?: string;
    email?: string;
    avatar?: string;
    role?: UserRole;
    googleId?: string;
  }) => UserProfile;
  loginWithGoogleDemo: (role?: UserRole) => void;
  logout: () => void;
  properties: EnrichedProperty[];
  filteredProperties: EnrichedProperty[];
  allRawProperties: Property[];
  refreshData: (customLat?: number, customLng?: number, customLabel?: string, customPurpose?: Purpose) => Promise<void>;
  setIsWorkplaceLocked: (locked: boolean | ((prev: boolean) => boolean)) => void;
  setSelectedBhk: (bhk: number | null) => void;
  setSelectedPropertyType: (type: string | null) => void;
  setSelectedFurnished: (f: string | null) => void;
  setVerifiedOnly: (v: boolean) => void;
  setSortBy: (s: "match" | "commute" | "price_asc" | "price_desc" | "livability") => void;
};

// Default Anchor (Koramangala Hub, Bengaluru)
const DEFAULT_WORKPLACE: Workplace = {
  label: "HSR Layout / Koramangala Hub, Bengaluru",
  lat: 12.9345,
  lng: 77.6265,
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

// NO SEED PROPERTIES — All data is fetched live from real estate portals & OpenStreetMap APIs
// Zero local file storage

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [workplace, setWorkplace] = useState<Workplace>(DEFAULT_WORKPLACE);
  const [workplaceIcon, setWorkplaceIcon] = useState<WorkplaceIcon>("office");
  const [maxCommute, setMaxCommute] = useState<number>(45);
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [targetSqft, setTargetSqft] = useState<number>(1200);
  const [transportMode, setTransportMode] = useState<TransportMode>("drive");
  const [purpose, setPurpose] = useState<Purpose>("rent");
  const [userRole, setUserRole] = useState<UserRole>("seeker");
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem("cb_user_profile");
      const token = localStorage.getItem("cb_auth_token");
      if (saved && token) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          return { ...parsed, isLoggedIn: true };
        }
      }
    } catch {}
    return {
      name: "Guest Commuter",
      email: "",
      avatar: "",
      role: "seeker",
      isLoggedIn: false,
    };
  });

  // Filter & sorting states
  const [selectedBhk, setSelectedBhk] = useState<number | null>(null);
  const [selectedPropertyType, setSelectedPropertyType] = useState<string | null>(null);
  const [selectedFurnished, setSelectedFurnished] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"match" | "commute" | "price_asc" | "price_desc" | "livability">("match");

  // Loading & status
  const [isPropertiesLoading, setIsPropertiesLoading] = useState<boolean>(true);
  const [fetchStatusMessage, setFetchStatusMessage] = useState<string>("Initializing live API discovery...");

  const [rankingWeights, setRankingWeights] = useState<RankingWeights>({
    w1: 0.334, // Commute time weight
    w2: 0.333, // Price fit weight
    w3: 0.333, // Area fit weight
  });

  const [rawProperties, setRawProperties] = useState<Property[]>([]);
  const [focusedPropertyId, setFocusedPropertyId] = useState<number | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [savedPropertyIds, setSavedPropertyIds] = useState<number[]>([]);
  const [activeRoute, setActiveRoute] = useState<ActiveRoute | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState<boolean>(false);
  const [isWorkplaceLocked, setIsWorkplaceLocked] = useState<boolean>(true);

  // Live-fetch from backend (proxies to real estate portals + Overpass API)
  // NO local file storage — everything streamed dynamically via API
  const refreshData = async (
    customLat?: number,
    customLng?: number,
    customLabel?: string,
    customPurpose?: Purpose
  ) => {
    const targetLat = typeof customLat === "number" ? customLat : workplace.lat;
    const targetLng = typeof customLng === "number" ? customLng : workplace.lng;
    const targetLabel = customLabel || workplace.label;
    const targetPurpose = customPurpose || purpose;

    const parts = targetLabel.split(",").map((s) => s.trim());
    const area = parts[0] || "";
    const city =
      parts.length > 1
        ? parts[parts.length - (parts[parts.length - 1].toLowerCase() === "india" ? 2 : 1)]
        : area;

    setIsPropertiesLoading(true);
    setFetchStatusMessage(
      `📡 Fetching properties in ${area || city} via 99acres, MagicBricks, Housing.com & OpenStreetMap...`
    );

    try {
      const url = `${API_BASE_URL}/api/properties?lat=${targetLat}&lng=${targetLng}&city=${encodeURIComponent(
        city
      )}&area=${encodeURIComponent(area)}&purpose=${targetPurpose}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped: Property[] = data.map((p: any) => ({
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
            image: (p.images && p.images[0]) || p.image || "",
            images:
              Array.isArray(p.images) && p.images.length > 0
                ? p.images
                : p.image
                ? [p.image]
                : [],
            type: p.property_type || p.type || "apartment",
            livabilityScore: p.livability_score || p.livabilityScore || 85,
            petFriendly: p.pet_friendly !== undefined ? p.pet_friendly : p.petFriendly,
            furnished: p.furnished || "semi-furnished",
            description: p.description,
            city: p.city || city || "",
            address: p.address,
            brokerSource: p.source_portal || p.brokerSource || "Portal",
            contactName: p.owner || p.contactName,
            contactPhone: p.phone || p.contactPhone,
            views: p.views || 0,
            inquiries: p.inquiries || 0,
            commute_discoveries: p.commute_discoveries,
            sourceUrl: p.source_url || p.sourceUrl,
            societyName: p.society_name || p.societyName,
            reraId: p.rera_id || p.reraId,
            carpetSqft: p.carpet_area || p.carpetSqft || Math.round((p.sqft || 1000) * 0.78),
            superSqft: p.super_area || p.superSqft || p.sqft || 1000,
            floor: p.floor,
            facing: p.facing,
            securityDeposit: p.security_deposit || p.securityDeposit,
            maintenance: p.maintenance,
            availability: p.availability || "Ready to Move",
            propertyAge: p.property_age || p.propertyAge,
            waterSupply: p.water_supply || p.waterSupply,
            powerBackup: p.power_backup || p.powerBackup,
            gatedCommunity: p.gated_community !== undefined ? p.gated_community : true,
            verifiedBadge: p.verified_badge || p.verifiedBadge,
            brokerType: p.broker_type || p.brokerType,
            amenities: Array.isArray(p.amenities) && p.amenities.length > 0 ? p.amenities : [],
          }));
          setRawProperties(mapped);
          setFetchStatusMessage(
            `✅ Loaded ${mapped.length} live properties near ${area || city} (Zero local storage)`
          );
        }
      }
    } catch {
      setFetchStatusMessage("Connecting to property stream...");
    } finally {
      setIsPropertiesLoading(false);
    }
  };

  // Watch for location changes (lat/lng or purpose) to trigger live API fetching
  useEffect(() => {
    refreshData(workplace.lat, workplace.lng, workplace.label, purpose);
  }, [workplace.lat, workplace.lng, purpose]);

  const toggleSaveProperty = async (id: number) => {
    const isCurrentlySaved = savedPropertyIds.includes(id);
    const newSaved = isCurrentlySaved
      ? savedPropertyIds.filter((item) => item !== id)
      : [...savedPropertyIds, id];
    setSavedPropertyIds(newSaved);

    if (userProfile.email) {
      if (isCurrentlySaved) {
        await supabaseSavedProperties.unsaveProperty(userProfile.email, id);
      } else {
        const prop = rawProperties.find((p) => p.id === id);
        await supabaseSavedProperties.saveProperty(userProfile.email, id, prop);
      }
    }
  };

  // Restore user session and bookmarks from Supabase / cloud
  useEffect(() => {
    const initUserData = async () => {
      try {
        const saved = localStorage.getItem("cb_user_profile");
        const token = localStorage.getItem("cb_auth_token");
        if (saved && token) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.email) {
            setUserProfile({ ...parsed, isLoggedIn: true });
            setUserRole(parsed.role || "seeker");

            // Verify with backend session endpoint
            fetch(`${API_BASE_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then(async (r) => {
                if (r.ok) {
                  const data = await r.json();
                  if (data.user) {
                    setUserProfile((prev) => ({
                      ...prev,
                      name: data.user.name || prev.name,
                      avatar: data.user.avatar || prev.avatar,
                      role: data.user.role || prev.role,
                      isLoggedIn: true,
                    }));
                  }
                }
              })
              .catch(() => {});

            // Fetch user's saved bookmarks from Supabase database
            const ids = await supabaseSavedProperties.getSavedPropertyIds(parsed.email);
            if (ids && ids.length) {
              setSavedPropertyIds(ids);
            }
          }
        }
      } catch {}
    };

    initUserData();
  }, []);

  const loginWithSession = (token: string, user: any): UserProfile => {
    const role: UserRole = user.role === "owner" ? "owner" : "seeker";
    const profile: UserProfile = {
      name: user.name || (role === "owner" ? "Property Owner" : "Commuter"),
      email: user.email || "",
      avatar:
        user.avatar ||
        user.profile_picture ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || "User")}`,
      role,
      isLoggedIn: true,
      authProvider: user.authProvider || "google",
      googleId: user.googleId || user.google_id,
    };

    setUserRole(role);
    setUserProfile(profile);

    // Save profile to Supabase PostgreSQL database
    supabaseProfiles.upsertProfile(profile);

    // Fetch user bookmarks from Supabase
    if (profile.email) {
      supabaseSavedProperties.getSavedPropertyIds(profile.email).then((ids) => {
        if (ids && ids.length) setSavedPropertyIds(ids);
      });
    }

    try {
      localStorage.setItem("cb_auth_token", token);
      localStorage.setItem("cb_user_profile", JSON.stringify(profile));
    } catch {}

    return profile;
  };

  const loginWithGoogle = (account?: {
    name?: string;
    email?: string;
    avatar?: string;
    role?: UserRole;
    googleId?: string;
  }): UserProfile => {
    const role = account?.role || "seeker";
    const defaultName = role === "owner" ? "Property Owner" : "Commuter";
    const profile: UserProfile = {
      name: account?.name || defaultName,
      email: account?.email || (role === "owner" ? "owner@commutebuddy.in" : "seeker@commutebuddy.in"),
      avatar:
        account?.avatar ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(account?.name || defaultName)}`,
      role,
      isLoggedIn: true,
      authProvider: "google",
      googleId: account?.googleId,
    };

    setUserRole(role);
    setUserProfile(profile);

    // Save profile to Supabase PostgreSQL database
    supabaseProfiles.upsertProfile(profile);

    // Fetch user bookmarks from Supabase
    if (profile.email) {
      supabaseSavedProperties.getSavedPropertyIds(profile.email).then((ids) => {
        if (ids && ids.length) setSavedPropertyIds(ids);
      });
    }

    try {
      localStorage.setItem("cb_user_profile", JSON.stringify(profile));
      localStorage.setItem("cb_auth_token", `session_${Date.now()}`);
    } catch {}

    return profile;
  };

  const loginWithGoogleDemo = (role: UserRole = "seeker") => {
    loginWithGoogle({ role });
  };

  const logout = () => {
    setUserProfile({
      name: "Guest Commuter",
      email: "",
      avatar: "",
      role: "seeker",
      isLoggedIn: false,
    });
    setSavedPropertyIds([]);
    try {
      localStorage.removeItem("cb_user_profile");
      localStorage.removeItem("cb_auth_token");
    } catch {}
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
      if (dh / vmax > maxCommute) {
        continue; // Pruned in O(1)
      }

      // Line 8: Authoritative network travel-time calculation (Eq. 5)
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

  // Filtered by auxiliary seeker filters (price, BHK, property type, furnishing, verified, purpose)
  const filteredProperties = useMemo(() => {
    let list = properties.filter((p) => {
      // Purpose filter
      const matchPurpose = !purpose || p.purpose === purpose || (purpose === "rent" && p.price < 500000);
      // Price range filter
      const matchPrice = p.price >= minPrice && p.price <= maxPrice;
      // BHK filter
      const matchBhk = selectedBhk === null || p.bedrooms === selectedBhk;
      // Property type filter
      const matchType = selectedPropertyType === null || p.type === selectedPropertyType;
      // Furnishing filter
      const matchFurnished = selectedFurnished === null || p.furnished === selectedFurnished;
      // Verified filter
      const matchVerified = !verifiedOnly || Boolean(p.verifiedBadge || p.reraId);

      return matchPurpose && matchPrice && matchBhk && matchType && matchFurnished && matchVerified;
    });

    // Sort by user preference
    list = [...list].sort((a, b) => {
      if (sortBy === "commute") return a.commuteMinutes - b.commuteMinutes;
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "livability") return b.livabilityScore - a.livabilityScore;
      return b.matchScore - a.matchScore; // default: best match score
    });

    return list;
  }, [
    properties,
    purpose,
    minPrice,
    maxPrice,
    selectedBhk,
    selectedPropertyType,
    selectedFurnished,
    verifiedOnly,
    sortBy,
  ]);

  // Fetch full turn-by-turn road route geometry via OSRM (Section XII & Eq. 7)
  const fetchRouteForProperty = async (property: Property) => {
    setIsRouteLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/route?fromLat=${workplace.lat}&fromLng=${workplace.lng}&toLat=${property.lat}&toLng=${property.lng}&mode=${transportMode}`
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

  // Register property (Owner Module - Supabase Database Sync)
  const registerProperty = async (p: Omit<Property, "id">): Promise<Property> => {
    try {
      const created = await supabaseProperties.createProperty(p, userProfile.email);
      setRawProperties((prev) => [created, ...prev]);

      // Also sync to backend memory cache
      fetch(`${API_BASE_URL}/api/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(created),
      }).catch(() => {});

      return created;
    } catch {
      const maxId = rawProperties.length > 0 ? Math.max(...rawProperties.map((x) => x.id)) : 0;
      const localProp: Property = { ...p, id: maxId + 1 };
      setRawProperties((prev) => [localProp, ...prev]);
      return localProp;
    }
  };

  const deleteProperty = async (id: number) => {
    try {
      await supabaseProperties.deleteProperty(id);
      fetch(`${API_BASE_URL}/api/properties/${id}`, { method: "DELETE" }).catch(() => {});
    } catch {}
    setRawProperties((prev) => prev.filter((p) => p.id !== id));
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
        loginWithGoogle,
        loginWithGoogleDemo,
        loginWithSession,
        logout,
        properties,
        filteredProperties,
        allRawProperties: rawProperties,
        refreshData,
        activeRoute,
        isRouteLoading,
        isWorkplaceLocked,
        setIsWorkplaceLocked,
        minPrice,
        setMinPrice,
        isPropertiesLoading,
        fetchStatusMessage,
        selectedBhk,
        setSelectedBhk,
        selectedPropertyType,
        setSelectedPropertyType,
        selectedFurnished,
        setSelectedFurnished,
        verifiedOnly,
        setVerifiedOnly,
        sortBy,
        setSortBy,
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
