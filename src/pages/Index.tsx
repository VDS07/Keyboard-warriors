import { FormEvent, Suspense, lazy, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyDetailModal } from "@/components/PropertyDetailModal";
import { Navbar } from "@/components/Navbar";
import { useSearch, TransportMode, WorkplaceIcon, EnrichedProperty } from "@/context/SearchContext";
import {
  Car,
  Train,
  Bike,
  Footprints,
  Route,
  MapPin,
  X,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  Clock,
  SlidersHorizontal,
  Sparkles,
  ShieldCheck,
  Building,
  RotateCcw,
  Search,
  Check
} from "lucide-react";
import { toast } from "sonner";

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

// Popular Indian City / Tech Hub shortcuts for 1-click exploration
const POPULAR_HUBS = [
  { name: "Bengaluru", label: "HSR Layout, Bengaluru", lat: 12.9121, lng: 77.6446 },
  { name: "Mumbai", label: "Bandra Kurla Complex, Mumbai", lat: 19.0607, lng: 72.8682 },
  { name: "Delhi NCR", label: "Cyber City, Gurugram", lat: 28.4950, lng: 77.0895 },
  { name: "Pune", label: "Hinjewadi Tech Park, Pune", lat: 18.5913, lng: 73.7389 },
  { name: "Hyderabad", label: "HITEC City, Hyderabad", lat: 17.4474, lng: 78.3762 },
  { name: "Nagpur", label: "Dharampeth, Nagpur", lat: 21.1458, lng: 79.0635 },
  { name: "Chennai", label: "OMR IT Corridor, Chennai", lat: 12.9719, lng: 80.2452 },
];

const Index = () => {
  const {
    workplace, setWorkplace,
    workplaceIcon, setWorkplaceIcon,
    maxCommute, setMaxCommute,
    transportMode, setTransportMode,
    focusedPropertyId, setFocusedPropertyId,
    selectedPropertyId, setSelectedPropertyId,
    filteredProperties,
    activeRoute,
    isWorkplaceLocked,
    setIsWorkplaceLocked,
    refreshData,
    isPropertiesLoading,
    fetchStatusMessage,
    purpose, setPurpose,
    maxPrice, setMaxPrice,
    minPrice, setMinPrice,
    selectedBhk, setSelectedBhk,
    selectedPropertyType, setSelectedPropertyType,
    selectedFurnished, setSelectedFurnished,
    verifiedOnly, setVerifiedOnly,
    sortBy, setSortBy,
  } = useSearch();

  const [workplaceInput, setWorkplaceInput] = useState(workplace.label);
  const [isSearching, setIsSearching] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showRoutePanel, setShowRoutePanel] = useState(true);
  const [routePanelCollapsed, setRoutePanelCollapsed] = useState(false);
  
  // Independent modal state so clicking card/marker only selects route and does NOT cover map
  const [detailModalProperty, setDetailModalProperty] = useState<EnrichedProperty | null>(null);

  // Synchronize workplaceInput immediately whenever workplace.label updates
  useEffect(() => {
    setWorkplaceInput(workplace.label);
  }, [workplace.label]);

  const selectedProperty = filteredProperties.find(p => p.id === selectedPropertyId) || null;

  // Handle Free-text Workplace search (Nominatim Geocoding)
  const handleWorkplaceSearch = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    const query = workplaceInput.trim();
    if (!query) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data: Array<{ lat: string; lon: string; display_name: string }> = await response.json();
      if (response.ok && data.length) {
        const label = data[0].display_name.split(",").slice(0, 3).join(",");
        const newLat = Number(data[0].lat);
        const newLng = Number(data[0].lon);
        setWorkplace({
          label,
          lat: newLat,
          lng: newLng
        });
        setWorkplaceInput(label);
        setIsWorkplaceLocked(true);
        toast.success(`Workplace anchored to ${label}`);
      } else {
        toast.error("Location not found. Please try another area or city name.");
      }
    } catch {
      toast.error("Geocoding service unavailable.");
    } finally {
      setIsSearching(false);
    }
  };

  // Select Quick Hub
  const handleSelectHub = (hub: typeof POPULAR_HUBS[0]) => {
    setWorkplace({
      label: hub.label,
      lat: hub.lat,
      lng: hub.lng,
    });
    setWorkplaceInput(hub.label);
    setIsWorkplaceLocked(true);
    toast.success(`Switched location to ${hub.name}`);
  };

  const handleToggleLock = async () => {
    if (isWorkplaceLocked) {
      setIsWorkplaceLocked(false);
      toast.info("Workplace unlocked! Click on the map or type to reposition your anchor.", {
        duration: 4000
      });
    } else {
      const query = workplaceInput.trim();
      if (query && query.toLowerCase() !== workplace.label.toLowerCase()) {
        await handleWorkplaceSearch();
      } else {
        setIsWorkplaceLocked(true);
        toast.success(`Workplace locked at: ${workplace.label}`);
      }
    }
  };

  // Reset filters to default
  const handleResetFilters = () => {
    setSelectedBhk(null);
    setSelectedPropertyType(null);
    setSelectedFurnished(null);
    setVerifiedOnly(false);
    setMaxPrice(purpose === "rent" ? 100000 : 30000000);
    setMinPrice(0);
    setMaxCommute(45);
    setSortBy("match");
    toast.info("Filters reset to default");
  };

  // Active filter count
  const activeFilterCount =
    (selectedBhk !== null ? 1 : 0) +
    (selectedPropertyType !== null ? 1 : 0) +
    (selectedFurnished !== null ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (maxPrice < (purpose === "rent" ? 100000 : 30000000) ? 1 : 0);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-zinc-950 text-foreground flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Interactive Map Canvas */}
      <div className="relative flex-1 w-full h-[calc(100vh-56px)] overflow-hidden">
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-zinc-900" />}>
          <PropertyMap
            workplace={workplace}
            properties={filteredProperties}
            focusedPropertyId={focusedPropertyId}
            toCurrency={toCurrency}
            onPropertyFocus={setFocusedPropertyId}
            onOpenDetails={(id) => {
              const prop = filteredProperties.find(p => p.id === id);
              if (prop) setDetailModalProperty(prop);
            }}
          />
        </Suspense>

        {/* Floating Spatial Command Bar */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[300] w-[95%] max-w-5xl flex flex-col gap-2 pointer-events-none">
          
          <div className="pointer-events-auto flex items-center gap-2 py-2 px-3 sm:px-4 rounded-2xl shadow-2xl border border-white/10 bg-zinc-950/92 backdrop-blur-2xl">
            
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
            <form onSubmit={handleWorkplaceSearch} className="flex-1 min-w-[130px] flex items-center">
              <MapPin className="w-4 h-4 text-purple-400 mr-1.5 flex-shrink-0" />
              <Input
                value={workplaceInput}
                onChange={(e) => setWorkplaceInput(e.target.value)}
                placeholder="Search any workplace, tech park, or city across India..."
                className="bg-transparent border-none shadow-none focus-visible:ring-0 p-0 text-xs font-medium text-white h-7 placeholder:text-zinc-500"
              />
              <button
                type="submit"
                className="p-1 text-zinc-400 hover:text-white transition-colors"
                title="Search location"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="w-px h-6 bg-white/10 hidden md:block" />

            {/* Transport Mode Selector */}
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

            {/* Continuous 1-Minute Commute Slider & Precision Controls */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition-all">
              <span className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1 whitespace-nowrap">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Max Commute:</span>
              </span>

              {/* −1 Minute Stepper */}
              <button
                type="button"
                onClick={() => setMaxCommute(Math.max(1, maxCommute - 1))}
                className="w-5 h-5 rounded-md bg-zinc-800 hover:bg-purple-600 text-zinc-300 hover:text-white flex items-center justify-center text-xs font-bold transition-all active:scale-90"
                title="Decrease 1 min"
              >
                −
              </button>

              {/* Continuous 1-Minute Range Slider */}
              <input
                type="range"
                min={1}
                max={120}
                step={1}
                value={maxCommute}
                onChange={(e) => setMaxCommute(Number(e.target.value))}
                className="w-20 sm:w-24 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                title={`Commute limit: ${maxCommute} minutes`}
              />

              {/* +1 Minute Stepper */}
              <button
                type="button"
                onClick={() => setMaxCommute(Math.min(120, maxCommute + 1))}
                className="w-5 h-5 rounded-md bg-zinc-800 hover:bg-purple-600 text-zinc-300 hover:text-white flex items-center justify-center text-xs font-bold transition-all active:scale-90"
                title="Increase 1 min"
              >
                +
              </button>

              {/* Direct Numeric Input */}
              <div className="flex items-baseline bg-purple-600/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded-lg">
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={maxCommute}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setMaxCommute(Math.min(180, Math.max(1, val)));
                  }}
                  className="w-6 text-center bg-transparent text-xs font-bold font-mono text-purple-200 focus:outline-none focus:ring-0 p-0"
                />
                <span className="text-[10px] font-mono text-purple-300">m</span>
              </div>
            </div>

            {/* Workplace Lock / Unlock Toggle Button */}
            <Button
              type="button"
              onClick={handleToggleLock}
              size="sm"
              className={`rounded-xl px-3 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                isWorkplaceLocked
                  ? "bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/50 shadow-emerald-950/40"
                  : "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/30 animate-pulse border border-amber-300 font-extrabold"
              }`}
              disabled={isSearching}
              title={
                isWorkplaceLocked
                  ? "Workplace locked (hovering/clicking map won't change it). Click to unlock and set a new location."
                  : "Workplace unlocked! Click anywhere on map or search, then click here to lock."
              }
            >
              {isSearching ? (
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  <span>Locating...</span>
                </span>
              ) : isWorkplaceLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Locked</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-zinc-950" />
                  <span>Set & Lock</span>
                </>
              )}
            </Button>
          </div>

          {/* Quick Hub Shortcuts & Live Stream Status Banner */}
          <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-1.5 px-3 py-1.5 rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-white/10 text-xs shadow-lg">
            {/* Quick Hub Chips */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Hubs:
              </span>
              {POPULAR_HUBS.map((hub) => (
                <button
                  key={hub.name}
                  onClick={() => handleSelectHub(hub)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                    workplace.label.toLowerCase().includes(hub.name.toLowerCase())
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {hub.name}
                </button>
              ))}
            </div>

            {/* Live API Stream Status */}
            <div className="flex items-center gap-2 text-[11px] text-zinc-300 ml-auto flex-shrink-0">
              {isPropertiesLoading ? (
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="truncate max-w-[280px]">{fetchStatusMessage}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="truncate max-w-[280px]">{fetchStatusMessage}</span>
                </span>
              )}
              <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 text-[9px] px-1.5 py-0 font-mono hidden sm:inline-flex">
                Live APIs
              </Badge>
            </div>
          </div>

        </div>

        {/* Turn-by-Turn Route Guidance Box */}
        {activeRoute && showRoutePanel && (
          <div className="absolute bottom-20 left-4 sm:left-6 z-[350] w-[90%] max-w-sm bg-zinc-950/95 border border-purple-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-2xl text-white space-y-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-purple-600/30 border border-purple-500/40 flex items-center justify-center">
                  <Route className="w-3 h-3 text-purple-400" />
                </div>
                <span className="font-bold text-xs text-purple-300 truncate max-w-[170px]">
                  {selectedProperty ? selectedProperty.title : "Workplace ➔ Route"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge className="bg-purple-600/30 text-purple-200 text-[10px] font-mono border-purple-500/40 px-1.5 py-0.5">
                  {activeRoute.durationMinutes} min • {activeRoute.distanceKm.toFixed(1)} km
                </Badge>
                <button
                  onClick={() => setRoutePanelCollapsed(!routePanelCollapsed)}
                  className="text-zinc-400 hover:text-white p-0.5"
                  title={routePanelCollapsed ? "Expand steps" : "Collapse steps"}
                >
                  {routePanelCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setShowRoutePanel(false)}
                  className="text-zinc-400 hover:text-white p-0.5"
                  title="Close route guidance"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            {!routePanelCollapsed && (
              <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 scrollbar-hide text-xs pt-1">
                {activeRoute.steps.map((st, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-zinc-300 text-[11px]">
                    <span className="w-4 h-4 rounded-full bg-purple-900/60 text-purple-300 border border-purple-500/30 flex items-center justify-center text-[9px] font-mono font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="flex-1 leading-snug">{st.instruction}</span>
                    {st.distanceMeters > 0 && (
                      <span className="text-zinc-500 font-mono text-[10px] flex-shrink-0">
                        {st.distanceMeters >= 1000 ? `${(st.distanceMeters / 1000).toFixed(1)} km` : `${st.distanceMeters} m`}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feasible Properties Sidebar with Comprehensive Filters */}
        <div className={`absolute top-28 right-3 md:right-5 z-[300] transition-all duration-300 ${sidebarOpen ? "w-[340px] sm:w-[370px]" : "w-0 overflow-hidden"}`}>
          <div className="glass-panel p-3 rounded-3xl max-h-[calc(100vh-8.5rem)] overflow-hidden flex flex-col bg-zinc-950/90 backdrop-blur-2xl border border-white/10 shadow-2xl">
            
            {/* Header with Results Count & Filter Toggle */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10 px-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Matching Homes
                </h2>
                <Badge className="bg-purple-600/30 text-purple-300 border-purple-500/40 text-xs px-2 py-0">
                  {filteredProperties.length}
                </Badge>
              </div>

              <div className="flex items-center gap-1">
                {/* Filter Toggle Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-2 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                    showFilters || activeFilterCount > 0
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 border border-white/10"
                  }`}
                  title="Toggle Filters"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-white text-purple-900 text-[10px] font-bold flex items-center justify-center ml-0.5">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="text-xs h-6 px-1.5 text-zinc-400 hover:text-white">
                  Hide
                </Button>
              </div>
            </div>

            {/* Interactive Filters Panel (Expandable) */}
            {showFilters && (
              <div className="py-2.5 px-1 border-b border-white/10 space-y-2.5 text-xs bg-black/40 rounded-2xl my-2 p-2.5">
                
                {/* Purpose (Rent vs Buy) Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-medium">Purpose:</span>
                  <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-white/10">
                    <button
                      onClick={() => {
                        setPurpose("rent");
                        setMaxPrice(100000);
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                        purpose === "rent"
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Rent
                    </button>
                    <button
                      onClick={() => {
                        setPurpose("buy");
                        setMaxPrice(30000000);
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                        purpose === "buy"
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Buy
                    </button>
                  </div>
                </div>

                {/* BHK Filter Pills */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Bedrooms (BHK):</span>
                    {selectedBhk !== null && (
                      <button onClick={() => setSelectedBhk(null)} className="text-purple-400 text-[10px] hover:underline">
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[null, 1, 2, 3, 4].map((bhk) => (
                      <button
                        key={bhk === null ? "all" : bhk}
                        onClick={() => setSelectedBhk(bhk)}
                        className={`py-1 rounded-lg text-xs font-medium transition-all ${
                          selectedBhk === bhk
                            ? "bg-purple-600 text-white border border-purple-400"
                            : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/5 hover:border-white/20"
                        }`}
                      >
                        {bhk === null ? "All" : `${bhk} BHK`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Price / Budget Filter */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Max Budget:</span>
                    <span className="font-mono font-bold text-purple-300">
                      ₹{maxPrice >= 100000 ? `${(maxPrice / 100000).toFixed(1)} Lac` : maxPrice.toLocaleString("en-IN")}
                      {purpose === "rent" ? "/mo" : ""}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={purpose === "rent" ? 8000 : 2500000}
                    max={purpose === "rent" ? 200000 : 50000000}
                    step={purpose === "rent" ? 2000 : 500000}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  {/* Quick price chips */}
                  <div className="flex items-center gap-1 justify-between pt-0.5">
                    {purpose === "rent" ? (
                      [25000, 45000, 80000, 150000].map((pr) => (
                        <button
                          key={pr}
                          onClick={() => setMaxPrice(pr)}
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            maxPrice === pr ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          &lt; ₹{pr / 1000}k
                        </button>
                      ))
                    ) : (
                      [5000000, 10000000, 20000000, 40000000].map((pr) => (
                        <button
                          key={pr}
                          onClick={() => setMaxPrice(pr)}
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            maxPrice === pr ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          &lt; ₹{pr / 10000000}Cr
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Property Type Filter */}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Property Type:</span>
                  <select
                    value={selectedPropertyType || ""}
                    onChange={(e) => setSelectedPropertyType(e.target.value || null)}
                    className="bg-zinc-900 border border-white/10 text-zinc-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500"
                  >
                    <option value="">All Types</option>
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="studio">Studio</option>
                    <option value="penthouse">Penthouse</option>
                    <option value="duplex">Duplex</option>
                  </select>
                </div>

                {/* Furnished Filter */}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Furnishing:</span>
                  <select
                    value={selectedFurnished || ""}
                    onChange={(e) => setSelectedFurnished(e.target.value || null)}
                    className="bg-zinc-900 border border-white/10 text-zinc-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Any</option>
                    <option value="furnished">Furnished</option>
                    <option value="semi-furnished">Semi-Furnished</option>
                    <option value="unfurnished">Unfurnished</option>
                  </select>
                </div>

                {/* Verified Only Toggle & Reset Button */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="rounded accent-purple-600 w-3.5 h-3.5"
                    />
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Verified Only
                    </span>
                  </label>

                  <button
                    onClick={handleResetFilters}
                    className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>

                {/* Sort Option */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-zinc-400">Sort By:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-zinc-900 border border-white/10 text-zinc-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500"
                  >
                    <option value="match">Best Match</option>
                    <option value="commute">Shortest Commute</option>
                    <option value="price_asc">Lowest Price</option>
                    <option value="price_desc">Highest Price</option>
                    <option value="livability">Highest Livability</option>
                  </select>
                </div>

              </div>
            )}

            {/* Property Cards List */}
            <div className="overflow-y-auto space-y-2.5 pr-1 scrollbar-hide flex-1 pt-1.5">
              {isPropertiesLoading ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3 space-y-2 animate-pulse">
                      <div className="h-28 bg-zinc-800 rounded-xl w-full" />
                      <div className="h-4 bg-zinc-800 rounded w-3/4" />
                      <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    </div>
                  ))}
                  <p className="text-center text-xs text-purple-300 font-medium animate-pulse">
                    📡 Fetching properties in area via APIs...
                  </p>
                </div>
              ) : filteredProperties.length ? (
                filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isFocused={focusedPropertyId === property.id}
                    onFocus={() => setFocusedPropertyId(property.id)}
                    onClick={() => {
                      setSelectedPropertyId(property.id);
                      setShowRoutePanel(true);
                      setRoutePanelCollapsed(false);
                    }}
                    onOpenDetails={() => setDetailModalProperty(property)}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center space-y-2">
                  <p className="text-sm font-semibold text-white">No properties match your filters</p>
                  <p className="text-xs text-zinc-400">
                    Try relaxing your budget, increasing commute time beyond {maxCommute} mins, or resetting filters.
                  </p>
                  <Button
                    onClick={handleResetFilters}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs mt-2"
                  >
                    Reset All Filters
                  </Button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Collapsed Sidebar Restore Tab */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-28 right-3 z-[300] glass-panel px-3 py-2 rounded-xl text-xs font-bold text-purple-300 bg-zinc-950/90 backdrop-blur-md border border-purple-500/30 shadow-xl flex items-center gap-1.5"
          >
            <span>🏠</span>
            <span>{filteredProperties.length} Matches</span>
          </button>
        )}

      </div>

      {/* Property Details Modal */}
      <PropertyDetailModal
        property={detailModalProperty}
        open={!!detailModalProperty}
        onClose={() => setDetailModalProperty(null)}
      />

    </div>
  );
};

export default Index;
