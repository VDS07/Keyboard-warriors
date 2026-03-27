import { createContext, useContext, useState, useMemo, ReactNode } from "react";

export type TransportMode = "drive" | "transit" | "cycle" | "walk";
export type UserRole = "buyer" | "owner" | null;
export type Purpose = "rent" | "buy" | "plot";

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
  purpose: Purpose;
  userRole: UserRole;
  focusedPropertyId: number | null;
  selectedPropertyId: number | null;
};

type SearchContextType = SearchState & {
  setWorkplace: (w: Workplace) => void;
  setMaxCommute: (m: number) => void;
  setMaxPrice: (p: number) => void;
  setTransportMode: (t: TransportMode) => void;
  setPurpose: (p: Purpose) => void;
  setUserRole: (r: UserRole) => void;
  setFocusedPropertyId: (id: number | null) => void;
  setSelectedPropertyId: (id: number | null) => void;
  properties: EnrichedProperty[];
  filteredProperties: EnrichedProperty[];
};

const DEFAULT_WORKPLACE: Workplace = {
  label: "Nagpur Railway Station, Nagpur",
  lat: 21.1458,
  lng: 79.0882,
};

// Speed multipliers (km per minute) for different transport modes
const SPEED_FACTORS: Record<TransportMode, number> = {
  drive: 0.55,
  transit: 0.35,
  cycle: 0.22,
  walk: 0.07,
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
  // ── NAGPUR (8 listings) ──
  { id: 1, title: "Dharampeth Heritage Flat", price: 18000, lat: 21.1500, lng: 79.0800, bedrooms: 2, bathrooms: 1, sqft: 950, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400", type: "apartment", livabilityScore: 82, petFriendly: false, furnished: "semi-furnished", description: "Well-maintained 2BHK near Dharampeth Science College and Law College Square.", city: "Nagpur" },
  { id: 2, title: "Sadar Luxury Studio", price: 12000, lat: 21.1552, lng: 79.0880, bedrooms: 0, bathrooms: 1, sqft: 400, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400", type: "studio", livabilityScore: 75, petFriendly: false, furnished: "furnished", description: "Compact furnished studio in Sadar, walking distance to shops and cafes.", city: "Nagpur" },
  { id: 3, title: "Civil Lines Bungalow", price: 45000, lat: 21.1600, lng: 79.0750, bedrooms: 4, bathrooms: 3, sqft: 2200, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400", type: "villa", livabilityScore: 94, petFriendly: true, furnished: "furnished", description: "Spacious bungalow in the heart of Civil Lines with garden and parking.", city: "Nagpur" },
  { id: 4, title: "Manish Nagar 2BHK", price: 14000, lat: 21.1070, lng: 79.0580, bedrooms: 2, bathrooms: 2, sqft: 1050, image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400", type: "apartment", livabilityScore: 78, petFriendly: true, furnished: "unfurnished", description: "New construction in Manish Nagar near Wardha Road IT corridor.", city: "Nagpur" },
  { id: 5, title: "Pratap Nagar Residency", price: 16500, lat: 21.1280, lng: 79.0650, bedrooms: 2, bathrooms: 2, sqft: 1100, image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400", type: "apartment", livabilityScore: 80, petFriendly: false, furnished: "semi-furnished", description: "Modern apartment near Pratap Nagar metro station with gym access.", city: "Nagpur" },
  { id: 6, title: "Laxmi Nagar Corner Flat", price: 11000, lat: 21.1420, lng: 79.1050, bedrooms: 1, bathrooms: 1, sqft: 550, image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400", type: "apartment", livabilityScore: 68, petFriendly: false, furnished: "unfurnished", description: "Affordable 1BHK near Variety Square and LIC Square.", city: "Nagpur" },
  { id: 7, title: "Koradi Road Villa", price: 25000, lat: 21.1900, lng: 79.1100, bedrooms: 3, bathrooms: 2, sqft: 1600, image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400", type: "villa", livabilityScore: 86, petFriendly: true, furnished: "semi-furnished", description: "Peaceful villa on Koradi Road with terrace garden.", city: "Nagpur" },
  { id: 8, title: "Trimurti Nagar Duplex", price: 22000, lat: 21.1350, lng: 79.0500, bedrooms: 3, bathrooms: 2, sqft: 1400, image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400", type: "duplex", livabilityScore: 84, petFriendly: true, furnished: "furnished", description: "Spacious duplex in Trimurti Nagar with basement parking.", city: "Nagpur" },

  // ── MUMBAI (8 listings) ──
  { id: 9, title: "Andheri West 1BHK", price: 35000, lat: 19.1360, lng: 72.8296, bedrooms: 1, bathrooms: 1, sqft: 500, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400", type: "apartment", livabilityScore: 76, petFriendly: false, furnished: "furnished", description: "Well-connected 1BHK near Andheri metro and Lokhandwala market.", city: "Mumbai" },
  { id: 10, title: "Bandra Sea-View Flat", price: 85000, lat: 19.0596, lng: 72.8295, bedrooms: 2, bathrooms: 2, sqft: 1000, image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400", type: "penthouse", livabilityScore: 95, petFriendly: true, furnished: "furnished", description: "Premium sea-facing flat at Bandra Bandstand with club access.", city: "Mumbai" },
  { id: 11, title: "Powai Lake Residency", price: 42000, lat: 19.1176, lng: 72.9060, bedrooms: 2, bathrooms: 2, sqft: 900, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400", type: "apartment", livabilityScore: 88, petFriendly: true, furnished: "semi-furnished", description: "Lake-facing 2BHK in Hiranandani Gardens, Powai.", city: "Mumbai" },
  { id: 12, title: "Worli Skyline Tower", price: 75000, lat: 19.0176, lng: 72.8153, bedrooms: 3, bathrooms: 2, sqft: 1300, image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400", type: "apartment", livabilityScore: 91, petFriendly: false, furnished: "furnished", description: "High-rise living at Worli with Bandra-Worli Sea Link views.", city: "Mumbai" },
  { id: 13, title: "Navi Mumbai Studio", price: 15000, lat: 19.0330, lng: 73.0297, bedrooms: 0, bathrooms: 1, sqft: 350, image: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400", type: "studio", livabilityScore: 70, petFriendly: false, furnished: "furnished", description: "Budget-friendly studio near Vashi station with mall proximity.", city: "Mumbai" },
  { id: 14, title: "Thane West Family Flat", price: 28000, lat: 19.2183, lng: 72.9781, bedrooms: 2, bathrooms: 2, sqft: 850, image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400", type: "apartment", livabilityScore: 79, petFriendly: true, furnished: "unfurnished", description: "Family-friendly 2BHK in Thane with garden and pool.", city: "Mumbai" },
  { id: 15, title: "Dadar Central Flat", price: 40000, lat: 19.0178, lng: 72.8478, bedrooms: 2, bathrooms: 1, sqft: 750, image: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400", type: "apartment", livabilityScore: 83, petFriendly: false, furnished: "semi-furnished", description: "Central Dadar location near Shivaji Park and station.", city: "Mumbai" },
  { id: 16, title: "Goregaon Film City Apt", price: 30000, lat: 19.1663, lng: 72.8526, bedrooms: 2, bathrooms: 2, sqft: 920, image: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=400", type: "apartment", livabilityScore: 81, petFriendly: true, furnished: "furnished", description: "Modern flat near Film City and Aarey Colony.", city: "Mumbai" },

  // ── BANGALORE (8 listings) ──
  { id: 17, title: "Koramangala 3BHK", price: 45000, lat: 12.9352, lng: 77.6245, bedrooms: 3, bathrooms: 2, sqft: 1400, image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400", type: "apartment", livabilityScore: 90, petFriendly: true, furnished: "furnished", description: "Premium 3BHK in Koramangala 5th Block near Forum Mall.", city: "Bangalore" },
  { id: 18, title: "Indiranagar Studio", price: 22000, lat: 12.9716, lng: 77.6412, bedrooms: 0, bathrooms: 1, sqft: 420, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400", type: "studio", livabilityScore: 85, petFriendly: false, furnished: "furnished", description: "Trendy studio on 12th Main, walking distance to pubs and cafes.", city: "Bangalore" },
  { id: 19, title: "Whitefield Tech Park Flat", price: 25000, lat: 12.9698, lng: 77.7500, bedrooms: 2, bathrooms: 2, sqft: 1100, image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400", type: "apartment", livabilityScore: 77, petFriendly: true, furnished: "semi-furnished", description: "Near ITPL and Phoenix Marketcity, gated community.", city: "Bangalore" },
  { id: 20, title: "HSR Layout Duplex", price: 35000, lat: 12.9121, lng: 77.6446, bedrooms: 3, bathrooms: 3, sqft: 1800, image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400", type: "duplex", livabilityScore: 92, petFriendly: true, furnished: "semi-furnished", description: "Modern duplex in HSR Layout Sector 2 with rooftop.", city: "Bangalore" },
  { id: 21, title: "Electronic City 2BHK", price: 16000, lat: 12.8456, lng: 77.6603, bedrooms: 2, bathrooms: 1, sqft: 900, image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400", type: "apartment", livabilityScore: 72, petFriendly: false, furnished: "unfurnished", description: "Affordable living near Infosys and Wipro campuses.", city: "Bangalore" },
  { id: 22, title: "Jayanagar Heritage Home", price: 30000, lat: 12.9250, lng: 77.5938, bedrooms: 2, bathrooms: 2, sqft: 1200, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400", type: "villa", livabilityScore: 88, petFriendly: true, furnished: "furnished", description: "Charming independent house in Jayanagar 4th Block.", city: "Bangalore" },
  { id: 23, title: "Marathahalli Tech Flat", price: 20000, lat: 12.9591, lng: 77.7010, bedrooms: 2, bathrooms: 2, sqft: 1000, image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400", type: "apartment", livabilityScore: 74, petFriendly: false, furnished: "semi-furnished", description: "Budget 2BHK near ORR and marathahalli bridge.", city: "Bangalore" },
  { id: 24, title: "MG Road Penthouse", price: 90000, lat: 12.9758, lng: 77.6068, bedrooms: 3, bathrooms: 3, sqft: 2000, image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400", type: "penthouse", livabilityScore: 97, petFriendly: true, furnished: "furnished", description: "Ultra-luxury penthouse on MG Road with infinity pool.", city: "Bangalore" },

  // ── HYDERABAD (6 listings) ──
  { id: 25, title: "HITEC City 2BHK", price: 22000, lat: 17.4435, lng: 78.3772, bedrooms: 2, bathrooms: 2, sqft: 1050, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400", type: "apartment", livabilityScore: 83, petFriendly: true, furnished: "semi-furnished", description: "Near Microsoft and Google campuses in HITEC City.", city: "Hyderabad" },
  { id: 26, title: "Gachibowli Gated Flat", price: 28000, lat: 17.4401, lng: 78.3489, bedrooms: 3, bathrooms: 2, sqft: 1350, image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400", type: "apartment", livabilityScore: 86, petFriendly: true, furnished: "furnished", description: "Premium gated community near ISB and DLF Cybercity.", city: "Hyderabad" },
  { id: 27, title: "Banjara Hills Villa", price: 65000, lat: 17.4156, lng: 78.4347, bedrooms: 4, bathrooms: 3, sqft: 2500, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400", type: "villa", livabilityScore: 95, petFriendly: true, furnished: "furnished", description: "Palatial villa in Banjara Hills Road No. 10.", city: "Hyderabad" },
  { id: 28, title: "Kondapur Studio", price: 13000, lat: 17.4577, lng: 78.3530, bedrooms: 0, bathrooms: 1, sqft: 380, image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400", type: "studio", livabilityScore: 71, petFriendly: false, furnished: "furnished", description: "Compact studio ideal for IT professionals in Kondapur.", city: "Hyderabad" },
  { id: 29, title: "Madhapur Skyline", price: 32000, lat: 17.4486, lng: 78.3908, bedrooms: 2, bathrooms: 2, sqft: 1100, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400", type: "apartment", livabilityScore: 87, petFriendly: false, furnished: "semi-furnished", description: "Madhapur high-rise near Inorbit Mall and Durgam Cheruvu.", city: "Hyderabad" },
  { id: 30, title: "Jubilee Hills Duplex", price: 55000, lat: 17.4310, lng: 78.4073, bedrooms: 3, bathrooms: 3, sqft: 1900, image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400", type: "duplex", livabilityScore: 93, petFriendly: true, furnished: "furnished", description: "Luxurious duplex in Jubilee Hills with private terrace.", city: "Hyderabad" },

  // ── PUNE (6 listings) ──
  { id: 31, title: "Hinjewadi Phase 1 Flat", price: 18000, lat: 18.5912, lng: 73.7380, bedrooms: 2, bathrooms: 2, sqft: 900, image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400", type: "apartment", livabilityScore: 76, petFriendly: false, furnished: "unfurnished", description: "Near Rajiv Gandhi IT Park with shuttle connectivity.", city: "Pune" },
  { id: 32, title: "Koregaon Park Bungalow", price: 55000, lat: 18.5362, lng: 73.8948, bedrooms: 3, bathrooms: 3, sqft: 2000, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400", type: "villa", livabilityScore: 94, petFriendly: true, furnished: "furnished", description: "Premium bungalow in KP near Osho Ashram and cafes.", city: "Pune" },
  { id: 33, title: "Kharadi EON Studio", price: 14000, lat: 18.5513, lng: 73.9414, bedrooms: 0, bathrooms: 1, sqft: 400, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400", type: "studio", livabilityScore: 73, petFriendly: false, furnished: "furnished", description: "Furnished studio near EON IT Park and Magarpatta.", city: "Pune" },
  { id: 34, title: "Baner Hilltop 2BHK", price: 24000, lat: 18.5596, lng: 73.7868, bedrooms: 2, bathrooms: 2, sqft: 1050, image: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400", type: "apartment", livabilityScore: 85, petFriendly: true, furnished: "semi-furnished", description: "Hillside 2BHK in Baner with Balewadi Stadium views.", city: "Pune" },
  { id: 35, title: "Viman Nagar Central", price: 20000, lat: 18.5679, lng: 73.9143, bedrooms: 2, bathrooms: 1, sqft: 850, image: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400", type: "apartment", livabilityScore: 81, petFriendly: true, furnished: "unfurnished", description: "Central flat in Viman Nagar near Phoenix Mall and airport.", city: "Pune" },
  { id: 36, title: "Wakad Family Duplex", price: 28000, lat: 18.5989, lng: 73.7616, bedrooms: 3, bathrooms: 2, sqft: 1400, image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400", type: "duplex", livabilityScore: 82, petFriendly: true, furnished: "semi-furnished", description: "Family duplex in Wakad with parks and school nearby.", city: "Pune" },

  // ── DELHI NCR (6 listings) ──
  { id: 37, title: "Dwarka Sector 21 Flat", price: 22000, lat: 28.5530, lng: 77.0586, bedrooms: 2, bathrooms: 2, sqft: 1000, image: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=400", type: "apartment", livabilityScore: 78, petFriendly: false, furnished: "semi-furnished", description: "Near Dwarka metro and sector market with parking.", city: "Delhi" },
  { id: 38, title: "Hauz Khas Village Studio", price: 25000, lat: 28.5494, lng: 77.2001, bedrooms: 0, bathrooms: 1, sqft: 450, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400", type: "studio", livabilityScore: 87, petFriendly: false, furnished: "furnished", description: "Bohemian studio in Hauz Khas Village near the lake.", city: "Delhi" },
  { id: 39, title: "Gurugram Cyber Hub Flat", price: 38000, lat: 28.4950, lng: 77.0878, bedrooms: 2, bathrooms: 2, sqft: 1100, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400", type: "apartment", livabilityScore: 84, petFriendly: true, furnished: "furnished", description: "Walking distance to Cyber Hub and DLF Phase 3.", city: "Delhi" },
  { id: 40, title: "Noida Sector 62 2BHK", price: 17000, lat: 28.6270, lng: 77.3652, bedrooms: 2, bathrooms: 1, sqft: 850, image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400", type: "apartment", livabilityScore: 72, petFriendly: false, furnished: "unfurnished", description: "Affordable 2BHK in Noida's IT hub near NSEZ metro.", city: "Delhi" },
  { id: 41, title: "South Delhi Green Park", price: 48000, lat: 28.5599, lng: 77.2090, bedrooms: 3, bathrooms: 2, sqft: 1500, image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400", type: "apartment", livabilityScore: 91, petFriendly: true, furnished: "furnished", description: "Premium flat in Green Park with metro and market access.", city: "Delhi" },
  { id: 42, title: "Greater Noida Villa", price: 35000, lat: 28.4744, lng: 77.5040, bedrooms: 4, bathrooms: 3, sqft: 2200, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400", type: "villa", livabilityScore: 80, petFriendly: true, furnished: "semi-furnished", description: "Independent villa in Jaypee Greens with golf course views.", city: "Delhi" },
];

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [workplace, setWorkplace] = useState(DEFAULT_WORKPLACE);
  const [maxCommute, setMaxCommute] = useState(45);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [transportMode, setTransportMode] = useState<TransportMode>("transit");
  const [purpose, setPurpose] = useState<Purpose>("rent");
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
        purpose, setPurpose,
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
