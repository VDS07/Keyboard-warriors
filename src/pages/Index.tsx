import { FormEvent, Suspense, lazy, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyDetailModal } from "@/components/PropertyDetailModal";
import { useSearch, TransportMode, EnrichedProperty } from "@/context/SearchContext";
import { Car, Train, Bike, Footprints, BarChart3, MapPinned, X } from "lucide-react";
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

const Index = () => {
  const navigate = useNavigate();
  const {
    workplace, setWorkplace,
    maxCommute, setMaxCommute,
    maxPrice, setMaxPrice,
    transportMode, setTransportMode,
    focusedPropertyId, setFocusedPropertyId,
    selectedPropertyId, setSelectedPropertyId,
    filteredProperties,
  } = useSearch();

  const [workplaceInput, setWorkplaceInput] = useState(workplace.label);
  const [isSearching, setIsSearching] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [streetViewOpen, setStreetViewOpen] = useState(false);

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
        
        {/* Office Location */}
        <div className="flex-1 min-w-[180px]">
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

        {/* Pricing */}
        <div className="flex-1 min-w-[100px] hidden md:block">
          <Select value={maxPrice.toString()} onValueChange={(v) => setMaxPrice(Number(v))}>
            <SelectTrigger className="bg-transparent border-none shadow-none focus:ring-0 font-medium h-8 text-xs">
              <SelectValue placeholder="Pricing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15000">Up to ₹15,000</SelectItem>
              <SelectItem value="25000">Up to ₹25,000</SelectItem>
              <SelectItem value="50000">Up to ₹50,000</SelectItem>
              <SelectItem value="100000">Any Price</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-px h-6 bg-border/50 hidden md:block" />

        {/* Travel Time */}
        <div className="flex-1 min-w-[120px]">
          <Select value={maxCommute.toString()} onValueChange={(v) => setMaxCommute(Number(v))}>
            <SelectTrigger className="bg-transparent border-none shadow-none focus:ring-0 font-medium h-8 text-xs">
              <SelectValue placeholder="Travel Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">Max 15 mins</SelectItem>
              <SelectItem value="20">Max 20 mins</SelectItem>
              <SelectItem value="30">Max 30 mins</SelectItem>
              <SelectItem value="45">Max 45 mins</SelectItem>
              <SelectItem value="60">Max 1 hour</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => handleWorkplaceSearch()} size="sm" className="rounded-full px-5 flex-shrink-0" disabled={isSearching}>
          {isSearching ? "..." : "Search"}
        </Button>

        <button onClick={() => navigate("/dashboard")} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex-shrink-0" title="Analytics">
          <BarChart3 className="w-4 h-4" />
        </button>
      </nav>

      {/* Property Sidebar */}
      <div className={`absolute top-20 right-3 md:right-5 z-[400] transition-all duration-300 ${sidebarOpen ? "w-[320px]" : "w-0 overflow-hidden"}`}>
        <div className="glass-panel p-3 rounded-2xl max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col bg-background/70 backdrop-blur-xl border border-border/40">
          
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
          className="absolute top-20 right-3 z-[400] glass-panel p-2 rounded-xl text-sm font-medium bg-background/80 backdrop-blur-md border border-border/50"
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

      {/* Street View Toggle Button */}
      <button
        onClick={() => setStreetViewOpen(!streetViewOpen)}
        className={`absolute bottom-16 left-4 z-[400] p-3 rounded-full shadow-lg border transition-all ${
          streetViewOpen ? "bg-primary text-white border-primary" : "bg-background/90 text-foreground border-border/50 hover:bg-primary/10"
        } backdrop-blur-sm`}
        title="Toggle Street View"
      >
        <MapPinned className="w-5 h-5" />
      </button>

      {/* Street View Panel */}
      {streetViewOpen && (
        <div className="absolute bottom-0 left-0 right-0 z-[450] h-[45vh] bg-zinc-950 border-t border-white/10 animate-fade-in-up">
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/90 backdrop-blur-sm border-b border-white/10">
            <span className="text-sm font-semibold text-white/80">🗺️ Google Street View</span>
            <button onClick={() => setStreetViewOpen(false)} className="p-1 hover:bg-white/10 rounded">
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
          <iframe
            className="w-full h-[calc(100%-40px)]"
            src={`https://www.google.com/maps/embed?pb=!4v0!6m8!1m7!1s!2m2!1d${focusedPropertyId ? (filteredProperties.find(p => p.id === focusedPropertyId)?.lat || workplace.lat) : workplace.lat}!2d${focusedPropertyId ? (filteredProperties.find(p => p.id === focusedPropertyId)?.lng || workplace.lng) : workplace.lng}!3f0!4f0!5f0.7820865974627469&q=${focusedPropertyId ? (filteredProperties.find(p => p.id === focusedPropertyId)?.lat || workplace.lat) : workplace.lat},${focusedPropertyId ? (filteredProperties.find(p => p.id === focusedPropertyId)?.lng || workplace.lng) : workplace.lng}`}
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Street View"
          />
        </div>
      )}

      {/* Bottom Counter */}
      <div className={`absolute ${streetViewOpen ? "bottom-[45vh]" : "bottom-4"} left-1/2 -translate-x-1/2 bg-background/90 px-4 py-2 rounded-full shadow-lg border border-border/50 backdrop-blur-sm z-[400] text-sm font-medium flex items-center gap-2 transition-all`}>
        Showing {filteredProperties.length} properties via
        <Badge variant="outline" className="capitalize text-xs">{transportMode}</Badge>
      </div>
    </main>
  );
};

export default Index;
