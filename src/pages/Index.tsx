import { FormEvent, Suspense, lazy, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyDetailModal } from "@/components/PropertyDetailModal";
import { ResearchPaperModal } from "@/components/ResearchPaperModal";
import { Navbar } from "@/components/Navbar";
import { useSearch, TransportMode, Purpose, WorkplaceIcon } from "@/context/SearchContext";
import { Car, Train, Bike, Footprints, SlidersHorizontal, Navigation, Route, Sparkles, MapPin, X, BookOpen } from "lucide-react";

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
  { value: "university", label: "University", emoji: "🎓" },
  { value: "hospital", label: "Hospital", emoji: "🏥" },
  { value: "briefcase", label: "Hub", emoji: "💼" },
  { value: "pin", label: "Pin", emoji: "📍" },
];

const CITY_PRESETS = [
  { name: "Nagpur (TGPCET)", lat: 21.1458, lng: 79.0882 },
  { name: "Mumbai (BKC)", lat: 19.0660, lng: 72.8680 },
  { name: "Bangalore (HSR)", lat: 12.9121, lng: 77.6446 },
  { name: "Pune (KP)", lat: 18.5362, lng: 73.8948 },
  { name: "Delhi NCR (CyberCity)", lat: 28.4950, lng: 77.0878 },
];

const Index = () => {
  const {
    workplace, setWorkplace,
    workplaceIcon, setWorkplaceIcon,
    maxCommute, setMaxCommute,
    maxPrice, setMaxPrice,
    transportMode, setTransportMode,
    purpose, setPurpose,
    rankingWeights, setRankingWeights,
    focusedPropertyId, setFocusedPropertyId,
    selectedPropertyId, setSelectedPropertyId,
    filteredProperties,
    activeRoute
  } = useSearch();

  const [workplaceInput, setWorkplaceInput] = useState(workplace.label);
  const [isSearching, setIsSearching] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [paperModalOpen, setPaperModalOpen] = useState(false);
  const [showRoutePanel, setShowRoutePanel] = useState(true);

  const selectedProperty = filteredProperties.find(p => p.id === selectedPropertyId) || null;

  const handleWorkplaceSearch = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    const query = workplaceInput.trim();
    if (!query) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data: Array<{ lat: string; lon: string; display_name: string }> = await response.json();
      if (response.ok && data.length) {
        setWorkplace({
          label: data[0].display_name.split(",").slice(0, 3).join(","),
          lat: Number(data[0].lat),
          lng: Number(data[0].lon)
        });
      }
    } catch {
      console.error("Geocoding failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCitySelect = (city: typeof CITY_PRESETS[0]) => {
    setWorkplace({ label: `${city.name} Anchor`, lat: city.lat, lng: city.lng });
    setWorkplaceInput(`${city.name} Anchor`);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-zinc-950 text-foreground flex flex-col">
      {/* Main Top Header */}
      <Navbar />

      {/* Interactive Map Viewport */}
      <div className="relative flex-1 w-full h-[calc(100vh-56px)] overflow-hidden">
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-zinc-900" />}>
          <PropertyMap
            workplace={workplace}
            properties={filteredProperties}
            focusedPropertyId={focusedPropertyId}
            toCurrency={toCurrency}
            onPropertyFocus={setFocusedPropertyId}
          />
        </Suspense>

        {/* Top Floating Spatial Command Bar (Section VIII & IX) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] w-[95%] max-w-5xl flex flex-col gap-2">
          
          <div className="glass-panel flex items-center gap-2 py-2 px-3 sm:px-4 rounded-2xl shadow-2xl border border-white/10 bg-zinc-950/85 backdrop-blur-xl">
            
            {/* Workplace Anchor Icon Dropdown */}
            <div className="flex items-center gap-0.5">
              {WORKPLACE_ICONS.map(({ value, emoji, label }) => (
                <button
                  key={value}
                  onClick={() => setWorkplaceIcon(value)}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    workplaceIcon === value
                      ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                  title={`Anchor Type: ${label}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-white/10 hidden sm:block" />

            {/* Workplace Free-Text Search Input (Nominatim) */}
            <form onSubmit={handleWorkplaceSearch} className="flex-1 min-w-[140px] flex items-center">
              <MapPin className="w-4 h-4 text-purple-400 mr-1.5 flex-shrink-0" />
              <Input
                value={workplaceInput}
                onChange={(e) => setWorkplaceInput(e.target.value)}
                placeholder="Search workplace, university, or hub..."
                className="bg-transparent border-none shadow-none focus-visible:ring-0 p-0 text-xs font-medium text-white h-7 placeholder:text-zinc-500"
              />
            </form>

            <div className="w-px h-6 bg-white/10 hidden md:block" />

            {/* Transport Mode Selector (Algorithm 1 m) */}
            <div className="flex items-center gap-1 hidden md:flex">
              {TRANSPORT_MODES.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTransportMode(value)}
                  className={`px-2 py-1 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                    transportMode === value
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/25"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                  title={`Mode: ${label}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="capitalize">{value}</span>
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-white/10 hidden lg:block" />

            {/* Commute Time Budget Slider (Algorithm 1 Tmax) */}
            <div className="flex items-center gap-2 px-1 hidden lg:flex">
              <span className="text-xs font-semibold text-zinc-300 whitespace-nowrap">⏱️ T_max:</span>
              <input
                type="range"
                min={5}
                max={90}
                step={5}
                value={maxCommute}
                onChange={(e) => setMaxCommute(Number(e.target.value))}
                className="w-20 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <Badge className="bg-purple-600/20 text-purple-300 border border-purple-500/40 text-xs font-mono px-2 py-0.5 whitespace-nowrap">
                {maxCommute}m
              </Badge>
            </div>

            {/* Ranking Weights Customizer (Equation 6) */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="p-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-purple-500/10 hover:text-purple-300 text-zinc-300 text-xs font-medium flex items-center gap-1 transition-all"
                  title="Tune Eq. 6 Ranking Formula Weights"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Eq. (6) Weights</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-zinc-950/95 border-purple-500/40 text-white backdrop-blur-2xl p-4 rounded-2xl shadow-2xl space-y-3 z-[600]">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Equation (6) Ranking Weights
                  </span>
                  <button
                    onClick={() => setRankingWeights({ w1: 0.334, w2: 0.333, w3: 0.333 })}
                    className="text-[10px] text-zinc-400 hover:text-white underline"
                  >
                    Reset Equal
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-300">w₁: Commute Time (1 - T/T_max)</span>
                      <span className="font-mono text-purple-300">{Math.round(rankingWeights.w1 * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={rankingWeights.w1}
                      onChange={(e) => setRankingWeights({ ...rankingWeights, w1: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-300">w₂: Price Fit (B̂)</span>
                      <span className="font-mono text-purple-300">{Math.round(rankingWeights.w2 * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={rankingWeights.w2}
                      onChange={(e) => setRankingWeights({ ...rankingWeights, w2: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-300">w₃: Area Fit (Â)</span>
                      <span className="font-mono text-purple-300">{Math.round(rankingWeights.w3 * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={rankingWeights.w3}
                      onChange={(e) => setRankingWeights({ ...rankingWeights, w3: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-zinc-400 bg-white/5 p-2 rounded-xl border border-white/5 font-mono">
                  S(p) = {rankingWeights.w1.toFixed(2)}·Commute + {rankingWeights.w2.toFixed(2)}·Price + {rankingWeights.w3.toFixed(2)}·Area
                </div>
              </PopoverContent>
            </Popover>

            <Button
              onClick={() => handleWorkplaceSearch()}
              size="sm"
              className="rounded-xl px-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
              disabled={isSearching}
            >
              {isSearching ? "..." : "Anchor"}
            </Button>
          </div>

          {/* Quick Metro Presets Bar */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950/70 backdrop-blur-md border border-white/10 w-fit mx-auto overflow-x-auto max-w-[95vw] scrollbar-hide">
            <span className="text-[10px] uppercase font-bold text-zinc-400 px-1">Anchor Presets:</span>
            {CITY_PRESETS.map((city) => (
              <button
                key={city.name}
                onClick={() => handleCitySelect(city)}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 hover:bg-purple-500/20 hover:text-purple-300 text-zinc-300 transition-all whitespace-nowrap"
              >
                📍 {city.name}
              </button>
            ))}
          </div>

        </div>

        {/* Turn-by-Turn Route Guidance Box (Section XII & Eq. 7) */}
        {activeRoute && showRoutePanel && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] w-[92%] max-w-lg bg-zinc-950/95 border border-purple-500/50 rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl text-white space-y-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center">
                  <Route className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <span className="font-bold text-xs text-purple-300">
                  Turn-by-Turn Route (Eq. 7): Workplace ➔ Selected Listing
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-600/30 text-purple-200 text-[10px] font-mono border-purple-500/40">
                  {activeRoute.durationMinutes} min • {activeRoute.distanceKm.toFixed(1)} km
                </Badge>
                <button onClick={() => setShowRoutePanel(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 scrollbar-hide text-xs">
              {activeRoute.steps.map((st, idx) => (
                <div key={idx} className="flex items-start gap-2 text-zinc-300 text-[11px]">
                  <span className="w-4 h-4 rounded-full bg-purple-900/50 text-purple-300 border border-purple-500/30 flex items-center justify-center text-[9px] font-mono font-bold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="flex-1">{st.instruction}</span>
                  {st.distanceMeters > 0 && (
                    <span className="text-zinc-500 font-mono text-[10px]">
                      {st.distanceMeters >= 1000 ? `${(st.distanceMeters / 1000).toFixed(1)} km` : `${st.distanceMeters} m`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feasible Properties Sidebar (Section XI & Eq. 3) */}
        <div className={`absolute top-24 right-3 md:right-5 z-[400] transition-all duration-300 ${sidebarOpen ? "w-[330px]" : "w-0 overflow-hidden"}`}>
          <div className="glass-panel p-3 rounded-2xl max-h-[calc(100vh-7.5rem)] overflow-hidden flex flex-col bg-zinc-950/85 backdrop-blur-2xl border border-white/10 shadow-2xl">
            
            <div className="flex items-center justify-between mb-2.5 px-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Feasible Set R (Eq. 3)
                </h2>
                <Badge className="bg-purple-600/30 text-purple-300 border-purple-500/40 text-xs px-2 py-0">
                  {filteredProperties.length}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-xs h-6 px-2 text-zinc-400 hover:text-white">
                Hide
              </Button>
            </div>

            {/* Property Cards List */}
            <div className="overflow-y-auto space-y-2.5 pr-1 scrollbar-hide flex-1">
              {filteredProperties.length ? (
                filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isFocused={focusedPropertyId === property.id}
                    onFocus={() => setFocusedPropertyId(property.id)}
                    onClick={() => {
                      setSelectedPropertyId(property.id);
                      setShowRoutePanel(true);
                    }}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center space-y-1.5">
                  <p className="text-sm font-semibold text-white">No properties within {maxCommute}m</p>
                  <p className="text-xs text-zinc-400">Increase commute time budget or change transport mode</p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Collapsed Sidebar Restore Tab */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-24 right-3 z-[400] glass-panel px-3 py-2 rounded-xl text-xs font-bold text-purple-300 bg-zinc-950/90 backdrop-blur-md border border-purple-500/30 shadow-xl"
          >
            🏠 {filteredProperties.length} Matches
          </button>
        )}

      </div>

      {/* Property Details Modal */}
      <PropertyDetailModal
        property={selectedProperty}
        open={!!selectedPropertyId}
        onClose={() => setSelectedPropertyId(null)}
      />

      {/* Research Paper Citation Modal */}
      <ResearchPaperModal
        open={paperModalOpen}
        onClose={() => setPaperModalOpen(false)}
      />
    </div>
  );
};

export default Index;
