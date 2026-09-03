import { useState, FormEvent } from "react";
import { Navbar } from "@/components/Navbar";
import { useSearch, getDistanceKm, estimateCommuteMinutes } from "@/context/SearchContext";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyDetailModal } from "@/components/PropertyDetailModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Users, Trash2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SavedProperties() {
  const navigate = useNavigate();
  const {
    properties,
    savedPropertyIds,
    toggleSaveProperty,
    workplace,
    transportMode,
    focusedPropertyId,
    setFocusedPropertyId,
    selectedPropertyId,
    setSelectedPropertyId,
  } = useSearch();

  // Dual Workplace Estimator state
  const [partnerWorkplace, setPartnerWorkplace] = useState<string>("Bandra Kurla Complex, Mumbai");
  const [partnerLat, setPartnerLat] = useState<number>(19.0657);
  const [partnerLng, setPartnerLng] = useState<number>(72.8686);
  const [isSearchingPartner, setIsSearchingPartner] = useState<boolean>(false);

  const savedList = properties.filter((p) => savedPropertyIds.includes(p.id));
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) || null;

  const handlePartnerSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!partnerWorkplace.trim()) return;
    setIsSearchingPartner(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(partnerWorkplace)}`
      );
      const data = await response.json();
      if (response.ok && data.length) {
        setPartnerWorkplace(data[0].display_name);
        setPartnerLat(Number(data[0].lat));
        setPartnerLng(Number(data[0].lon));
      }
    } catch {
      console.error("Partner geocoding failed");
    } finally {
      setIsSearchingPartner(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-5 h-5 text-purple-400 fill-purple-400" />
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Saved Properties</h1>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                {savedList.length} items
              </Badge>
            </div>
            <p className="text-zinc-400 text-sm">
              Your shortlisted homes and dual-commute comparison center.
            </p>
          </div>

          <Button onClick={() => navigate("/map")} className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl">
            Explore More on Map <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Dual Workplace Estimator Card */}
        <Card className="bg-gradient-to-r from-zinc-900 via-purple-950/20 to-zinc-900 border-purple-500/30 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" /> Dual-Workplace Commute Estimator
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Living with a spouse or roommate? Enter Workplace 2 to compare joint travel times for all saved homes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePartnerSearch} className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Input
                  value={partnerWorkplace}
                  onChange={(e) => setPartnerWorkplace(e.target.value)}
                  placeholder="Enter 2nd Workplace / Partner Address"
                  className="bg-zinc-950/80 border-white/10 text-white h-11 pr-10"
                />
                <MapPin className="w-4 h-4 text-purple-400 absolute right-3 top-3.5" />
              </div>
              <Button type="submit" disabled={isSearchingPartner} className="h-11 px-6 bg-purple-600 hover:bg-purple-500">
                {isSearchingPartner ? "Searching..." : "Calculate Dual Commute"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Saved List Grid */}
        {savedList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedList.map((property) => {
              // Partner commute calculation
              const partnerDistKm = getDistanceKm(partnerLat, partnerLng, property.lat, property.lng);
              const partnerMins = estimateCommuteMinutes(partnerDistKm, transportMode);

              return (
                <div key={property.id} className="relative group flex flex-col">
                  <PropertyCard
                    property={property}
                    isFocused={focusedPropertyId === property.id}
                    onFocus={() => setFocusedPropertyId(property.id)}
                    onClick={() => setSelectedPropertyId(property.id)}
                  />
                  
                  {/* Dual Commute Comparison Overlay Badge */}
                  <div className="mt-2 bg-zinc-900/90 border border-white/10 rounded-xl p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>👤 Person 1 Commute:</span>
                      <span className="font-bold text-white">{property.commuteMinutes} mins</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>👥 Person 2 Commute:</span>
                      <span className="font-bold text-purple-300">{partnerMins} mins</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 pt-1.5 font-semibold text-emerald-400">
                      <span>Combined Max Commute:</span>
                      <span>{Math.max(property.commuteMinutes, partnerMins)} mins</span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => toggleSaveProperty(property.id)}
                    className="mt-2 w-full py-2 bg-zinc-900/50 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove from Favorites
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-zinc-900/40 rounded-3xl border border-dashed border-white/10 space-y-4 max-w-md mx-auto">
            <Heart className="w-12 h-12 text-zinc-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No saved homes yet</h3>
              <p className="text-zinc-400 text-xs">
                Click the heart icon on any property card to save it for quick access and dual commute analysis.
              </p>
            </div>
            <Button onClick={() => navigate("/map")} className="bg-purple-600 hover:bg-purple-500">
              Browse Map Properties
            </Button>
          </div>
        )}

      </main>

      <PropertyDetailModal
        property={selectedProperty}
        open={!!selectedPropertyId}
        onClose={() => setSelectedPropertyId(null)}
      />
    </div>
  );
}
