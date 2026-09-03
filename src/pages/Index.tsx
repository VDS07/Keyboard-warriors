import { FormEvent, Suspense, lazy, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyDetailModal } from "@/components/PropertyDetailModal";
import { useSearch, TransportMode, EnrichedProperty, Purpose, WorkplaceIcon } from "@/context/SearchContext";
import { Car, Train, Bike, Footprints, BarChart3, Calculator, Heart, Home, Building2, GraduationCap, Stethoscope, Briefcase, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PropertyMap = lazy(() =>
  import("@/components/map/PropertyMap").then((module) => ({
    default: module.PropertyMap,
  })),
);

const toCurrency = (price: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

const TRANSPORT_MODES: { value: TransportMode; label: string; icon: typeof Car }[] = [
  { value: "drive", label: "Drive", icon: Car },
  { value: "transit", label: "Transit", icon: Train },
  { value: "cycle", label: "Cycle", icon: Bike },
  { value: "walk", label: "Walk", icon: Footprints },
];

const WORKPLACE_ICONS: { value: WorkplaceIcon; label: string; emoji: string }[] = [
  { value: "office", label: "Office", emoji: "🏢" },
  { value: "university", label: "Campus", emoji: "🎓" },
  { value: "hospital", label: "Hospital", emoji: "🏥" },
  { value: "briefcase", label: "Hub", emoji: "💼" },
  { value: "pin", label: "Pin", emoji: "📍" },
];

const CITY_PRESETS = [
  { name: "Nagpur", lat: 21.1458, lng: 79.0882 },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
  { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Delhi NCR", lat: 28.6139, lng: 77.2090 },
];

const Index = () => {
  const navigate = useNavigate();
  const {
    workplace, setWorkplace,
    workplaceIcon, setWorkplaceIcon,
    maxCommute, setMaxCommute,
    maxPrice, setMaxPrice,
    transportMode, setTransportMode,
    focusedPropertyId, setFocusedPropertyId,
    selectedPropertyId, setSelectedPropertyId,
    savedPropertyIds,
    purpose, setPurpose,
    filteredProperties,
  } = useSearch();

  const [workplaceInput, setWorkplaceInput] = useState(workplace.label);
  const [isSearching, setIsSearching] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const selectedProperty = filteredProperties.find(p => p.id === selectedPropertyId) || null;

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
        setWorkplace({ label: data[0].display_name, lat: Number(data[0].lat), lng: Number(data[0].lon) });
      }
    } catch { console.error("Geocoding failed."); }
    finally { setIsSearching(false); }
  };

  const handleCitySelect = (city: typeof CITY_PRESETS[0]) => {
    setWorkplace({ label: `${city.name} Center`, lat: city.lat, lng: city.lng });
    setWorkplaceInput(`${city.name} Center`);
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background text-foreground">
      
      {/* Map */}
      <Suspense fallback={<div className="h-full w-full animate-pulse bg-background/25" />}>
        <PropertyMap
          workplace={workplace}
          properties={filteredProperties}
          focusedPropertyId={focusedPropertyId}
          toCurrency={toCurrency}
          onPropertyFocus={setFocusedPropertyId}
        />
      </Suspense>

      {/* Top Navbar */}
      <nav className="absolute top-4 left-1/2 z-[400] -translate-x-1/2 glass-panel flex items-center gap-2 py-2 px-4 rounded-full w-[95%] max-w-5xl shadow-lg border border-border/50 bg-background/80 backdrop-blur-md overflow-x-auto whitespace-nowrap scrollbar-hide">
        
        {/* Brand Home Link */}
        <button onClick={() => navigate("/landing")} className="p-1.5 rounded-lg text-white hover:bg-white/10 transition-all flex items-center gap-1 font-bold text-xs" title="Role Selection">
          <Home className="w-4 h-4 text-purple-400" />
        </button>

        <div className="w-px h-6 bg-border/50" />

        {/* Workplace Icon Selector */}
        <div className="flex items-center gap-1">
          {WORKPLACE_ICONS.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => setWorkplaceIcon(value)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                workplaceIcon === value
                  ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
              title={`Workplace Icon: ${label}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-border/50" />

        {/* Office Location Input */}
        <div className="flex-1 min-w-[150px]">
          <form onSubmit={handleWorkplaceSearch} className="relative">
            <Input 
              value={workplaceInput}
              onChange={(e) => setWorkplaceInput(e.target.value)}
              placeholder="Office Location"
              className="bg-transparent border-none shadow-none focus-visible:ring-0 px-2 font-medium h-8 text-xs text-white"
            />
          </form>
        </div>
        
        <div className="w-px h-6 bg-border/50 hidden md:block" />
        
        {/* Transport Mode */}
        <div className="flex items-center gap-1 hidden md:flex">
          {TRANSPORT_MODES.map(({ value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTransportMode(value)}
              className={`p-1.5 rounded-lg transition-all ${transportMode === value ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
              title={value}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-border/50 hidden md:block" />

        {/* Purpose */}
        <div className="flex-1 min-w-[90px] hidden md:block">
          <Select value={purpose} onValueChange={(v) => setPurpose(v as Purpose)}>
            <SelectTrigger className="bg-transparent border-none shadow-none focus:ring-0 font-medium h-8 text-xs">
              <SelectValue placeholder="Purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rent">🏠 Rent</SelectItem>
              <SelectItem value="buy">🏡 Buy Property</SelectItem>
              <SelectItem value="plot">📐 Buy Plot</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-px h-6 bg-border/50 hidden md:block" />

        {/* Travel Time Slider (0 to 4+ Hours) */}
        <div className="flex items-center gap-2 px-2 hidden lg:flex">
          <span className="text-[11px] font-semibold text-zinc-300 whitespace-nowrap">⏱️ Commute:</span>
          <input
            type="range"
            min={5}
            max={240}
            step={5}
            value={maxCommute}
            onChange={(e) => setMaxCommute(Number(e.target.value))}
            className="w-24 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <Badge className="bg-purple-600/30 text-purple-300 border border-purple-500/40 text-[11px] font-mono px-2 py-0.5 whitespace-nowrap">
            {maxCommute >= 240 ? "4+ Hours" : maxCommute >= 60 ? `${Math.floor(maxCommute / 60)}h ${maxCommute % 60 ? `${maxCommute % 60}m` : ""}` : `${maxCommute}m`}
          </Badge>
        </div>

        <Button onClick={() => handleWorkplaceSearch()} size="sm" className="rounded-full px-4 flex-shrink-0 text-xs" disabled={isSearching}>
          {isSearching ? "..." : "Search"}
        </Button>

        {/* Quick Nav Tools */}
        <div className="flex items-center gap-1 pl-1">
          <button onClick={() => navigate("/saved")} className="p-1.5 rounded-lg text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10 transition-all flex-shrink-0 relative" title="Saved Favorites">
            <Heart className="w-4 h-4" />
            {savedPropertyIds.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-purple-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center">
                {savedPropertyIds.length}
              </span>
            )}
          </button>
          
          <button onClick={() => navigate("/calculator")} className="p-1.5 rounded-lg text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10 transition-all flex-shrink-0" title="Commute Calculator">
            <Calculator className="w-4 h-4" />
          </button>

          <button onClick={() => navigate("/dashboard")} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex-shrink-0" title="Analytics">
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Workplace Setup Onboarding Banner */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[390] flex items-center gap-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-900/90 via-zinc-950/90 to-purple-900/90 backdrop-blur-xl border border-purple-500/40 shadow-2xl text-xs font-semibold text-purple-200">
        <span className="flex items-center gap-1 text-purple-400 animate-pulse">
          📍 <strong className="text-white">Step 1: Set Workplace Location</strong>
        </span>
        <span className="text-zinc-400 hidden md:inline">|</span>
        <span className="text-zinc-300 hidden md:inline">Click anywhere on the map or enter your office location above</span>
        <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full uppercase">
          {workplaceIcon} mode
        </span>
      </div>

      {/* City Presets Quick Bar */}
      <div className="absolute top-26 sm:top-24 left-1/2 -translate-x-1/2 z-[385] flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 overflow-x-auto max-w-[90vw] scrollbar-hide">
        <span className="text-[10px] uppercase font-bold text-zinc-400 px-1">Metros:</span>
        {CITY_PRESETS.map((city) => (
          <button
            key={city.name}
            onClick={() => handleCitySelect(city)}
            className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-purple-500/20 hover:text-purple-300 text-zinc-300 transition-all whitespace-nowrap"
          >
            📍 {city.name}
          </button>
        ))}
      </div>

      {/* Property Sidebar */}
      <div className={`absolute top-24 right-3 md:right-5 z-[400] transition-all duration-300 ${sidebarOpen ? "w-[320px]" : "w-0 overflow-hidden"}`}>
        <div className="glass-panel p-3 rounded-2xl max-h-[calc(100vh-7rem)] overflow-hidden flex flex-col bg-background/70 backdrop-blur-xl border border-border/40">
          
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Properties</h2>
              <Badge variant="secondary" className="text-xs">{filteredProperties.length}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-xs h-6 px-2">
              Hide
            </Button>
          </div>

          <div className="overflow-y-auto space-y-2.5 pr-1 scrollbar-hide flex-1">
            {filteredProperties.length ? (
              filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isFocused={focusedPropertyId === property.id}
                  onFocus={() => setFocusedPropertyId(property.id)}
                  onClick={() => setSelectedPropertyId(property.id)}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border/50 p-4 text-center">
                <p className="text-sm font-medium">No matches</p>
                <p className="text-xs text-muted-foreground mt-1">Try increasing commute time or budget</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapsed sidebar toggle */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute top-24 right-3 z-[400] glass-panel p-2 rounded-xl text-sm font-medium bg-background/80 backdrop-blur-md border border-border/50"
        >
          {filteredProperties.length} 🏠
        </button>
      )}

      {/* Property Detail Modal */}
      <PropertyDetailModal
        property={selectedProperty}
        open={!!selectedPropertyId}
        onClose={() => setSelectedPropertyId(null)}
      />

      {/* Bottom Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 px-4 py-2 rounded-full shadow-lg border border-border/50 backdrop-blur-sm z-[400] text-sm font-medium flex items-center gap-2">
        Showing {filteredProperties.length} properties via
        <Badge variant="outline" className="capitalize text-xs">{transportMode}</Badge>
      </div>
    </main>
  );
};

export default Index;
