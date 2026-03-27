import { FormEvent, Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PropertyMap = lazy(() =>
  import("@/components/map/PropertyMap").then((module) => ({
    default: module.PropertyMap,
  })),
);

type Property = {
  id: number;
  title: string;
  price: number;
  lat: number;
  lng: number;
};

const PROPERTY_LIST: Property[] = [
  { id: 1, title: "Harborview Studio", price: 2100, lat: 40.7449, lng: -73.9952 },
  { id: 2, title: "Riverside Loft", price: 2980, lat: 40.7323, lng: -74.0079 },
  { id: 3, title: "Chelsea Corner", price: 2650, lat: 40.7465, lng: -74.0014 },
  { id: 4, title: "Midtown Nest", price: 3200, lat: 40.7558, lng: -73.9845 },
  { id: 5, title: "Union Square Flat", price: 2875, lat: 40.7359, lng: -73.9911 },
  { id: 6, title: "Williamsburg View", price: 2790, lat: 40.7126, lng: -73.9574 },
  { id: 7, title: "Astoria Garden Apt", price: 2420, lat: 40.7642, lng: -73.9235 },
  { id: 8, title: "Downtown One-Bed", price: 3360, lat: 40.7092, lng: -74.0107 },
  { id: 9, title: "Park Slope Home", price: 2580, lat: 40.6726, lng: -73.9772 },
  { id: 10, title: "Prospect Heights", price: 2480, lat: 40.6807, lng: -73.9682 },
  { id: 11, title: "Long Island City", price: 3150, lat: 40.7444, lng: -73.9489 },
  { id: 12, title: "Upper West Residence", price: 3040, lat: 40.7879, lng: -73.9754 },
  { id: 13, title: "Morningside Retreat", price: 2380, lat: 40.8091, lng: -73.9625 },
  { id: 14, title: "DUMBO Skyline", price: 3480, lat: 40.7033, lng: -73.9881 },
  { id: 15, title: "Greenpoint Condo", price: 2720, lat: 40.7296, lng: -73.9549 },
  { id: 16, title: "Jackson Heights", price: 2290, lat: 40.7551, lng: -73.8854 },
  { id: 17, title: "Bed-Stuy Duplex", price: 2360, lat: 40.6876, lng: -73.9416 },
  { id: 18, title: "Bay Ridge Apartment", price: 2190, lat: 40.6261, lng: -74.0327 },
];

const DEFAULT_WORKPLACE = {
  label: "Times Square, New York",
  lat: 40.758,
  lng: -73.9855,
};

const averageMinutesPerKm = 2.35;

const toCurrency = (price: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);

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

const estimateCommuteMinutes = (distanceKm: number) => Math.round(6 + distanceKm * averageMinutesPerKm);

const Index = () => {
  const [workplaceInput, setWorkplaceInput] = useState(DEFAULT_WORKPLACE.label);
  const [workplace, setWorkplace] = useState(DEFAULT_WORKPLACE);
  const [maxCommute, setMaxCommute] = useState(30);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [relationship, setRelationship] = useState("all");
  const [isSearching, setIsSearching] = useState(false);
  const [focusedPropertyId, setFocusedPropertyId] = useState<number | null>(null);

  const enrichedProperties = useMemo(() => {
    return PROPERTY_LIST.map((property) => {
      const distanceKm = getDistanceKm(workplace.lat, workplace.lng, property.lat, property.lng);
      return {
        ...property,
        distanceKm,
        commuteMinutes: estimateCommuteMinutes(distanceKm),
      };
    }).sort((a, b) => a.commuteMinutes - b.commuteMinutes);
  }, [workplace]);

  const filteredProperties = useMemo(
    () => enrichedProperties.filter((property) => 
      property.commuteMinutes <= maxCommute && 
      property.price <= maxPrice
    ),
    [enrichedProperties, maxCommute, maxPrice],
  );

  const handleWorkplaceSearch = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    const query = workplaceInput.trim();
    if (!query) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      );
      const data: Array<{ lat: string; lon: string; display_name: string }> = await response.json();

      if (response.ok && data.length) {
        setWorkplace({
          label: data[0].display_name,
          lat: Number(data[0].lat),
          lng: Number(data[0].lon),
        });
      }
    } catch {
      console.error("Geocoding failed.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background text-foreground">
      <Suspense
        fallback={
          <div className="bg-commute-canvas relative h-full w-full">
            <div className="absolute inset-0 animate-pulse bg-background/25" aria-hidden="true" />
          </div>
        }
      >
        <PropertyMap
          workplace={workplace}
          properties={filteredProperties}
          focusedPropertyId={focusedPropertyId}
          toCurrency={toCurrency}
          onPropertyFocus={setFocusedPropertyId}
        />
      </Suspense>

      {/* Top Navbar HUD */}
      <nav className="absolute top-4 left-1/2 z-[400] -translate-x-1/2 glass-panel flex items-center justify-between gap-2 py-2 px-4 rounded-full w-[95%] max-w-4xl shadow-lg border border-border/50 bg-background/80 backdrop-blur-md overflow-x-auto whitespace-nowrap scrollbar-hide">
        
        {/* Office Location */}
        <div className="flex-1 min-w-[200px]">
          <form onSubmit={handleWorkplaceSearch} className="relative">
            <Input 
              value={workplaceInput}
              onChange={(e) => setWorkplaceInput(e.target.value)}
              placeholder="Office Location"
              className="bg-transparent border-none shadow-none focus-visible:ring-0 px-2 font-medium h-8"
            />
          </form>
        </div>
        
        <div className="w-px h-6 bg-border/50 hidden md:block" />
        
        {/* Pricing */}
        <div className="flex-1 min-w-[120px] hidden md:block">
           <Select value={maxPrice.toString()} onValueChange={(v) => setMaxPrice(Number(v))}>
             <SelectTrigger className="bg-transparent border-none shadow-none focus:ring-0 font-medium h-8">
               <SelectValue placeholder="Pricing" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="2000">Up to $2,000</SelectItem>
               <SelectItem value="2500">Up to $2,500</SelectItem>
               <SelectItem value="3500">Up to $3,500</SelectItem>
               <SelectItem value="10000">Any Price</SelectItem>
             </SelectContent>
           </Select>
        </div>

        <div className="w-px h-6 bg-border/50 hidden md:block" />

        {/* Travel Time */}
        <div className="flex-1 min-w-[140px]">
           <Select value={maxCommute.toString()} onValueChange={(v) => setMaxCommute(Number(v))}>
             <SelectTrigger className="bg-transparent border-none shadow-none focus:ring-0 font-medium h-8">
               <SelectValue placeholder="Travel Time" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="15">Max 15 mins</SelectItem>
               <SelectItem value="30">Max 30 mins</SelectItem>
               <SelectItem value="45">Max 45 mins</SelectItem>
               <SelectItem value="60">Max 1 hour</SelectItem>
             </SelectContent>
           </Select>
        </div>
        
        <div className="w-px h-6 bg-border/50 hidden lg:block" />

        {/* Relationship Status */}
        <div className="flex-1 min-w-[180px] hidden lg:block">
           <Select value={relationship} onValueChange={setRelationship}>
             <SelectTrigger className="bg-transparent border-none shadow-none focus:ring-0 font-medium h-8">
               <SelectValue placeholder="Relationship Status" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Any Status</SelectItem>
               <SelectItem value="single">Single (Studio/1BR)</SelectItem>
               <SelectItem value="couple">Couple (1BR/2BR)</SelectItem>
               <SelectItem value="family">Family (2BR+)</SelectItem>
             </SelectContent>
           </Select>
        </div>
        
        <Button onClick={() => handleWorkplaceSearch()} size="sm" className="rounded-full px-6 ml-auto flex-shrink-0" disabled={isSearching}>
          {isSearching ? "..." : "Search"}
        </Button>
      </nav>
      
      {/* Property Results Counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background/90 text-foreground px-4 py-2 rounded-full shadow-lg border border-border/50 backdrop-blur-sm z-[400] text-sm font-medium">
         Showing {filteredProperties.length} matches
      </div>
    </main>
  );
};

export default Index;
