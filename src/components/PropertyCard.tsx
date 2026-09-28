import { EnrichedProperty, useSearch } from "@/context/SearchContext";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, PawPrint, Heart, Zap, MapPin } from "lucide-react";

type Props = {
  property: EnrichedProperty;
  isFocused: boolean;
  onFocus: () => void;
  onClick: () => void;
  onOpenDetails?: () => void;
};

const getCommuteColor = (mins: number) => {
  if (mins <= 15) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  if (mins <= 30) return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
  return "bg-rose-500/20 text-rose-300 border-rose-500/40";
};

const getMatchColor = (score: number) => {
  if (score >= 85) return "bg-purple-600/30 text-purple-200 border-purple-500/50 shadow-purple-500/20";
  if (score >= 70) return "bg-indigo-600/30 text-indigo-200 border-indigo-500/50 shadow-indigo-500/20";
  return "bg-zinc-800/80 text-zinc-300 border-zinc-700";
};

export function PropertyCard({ property, isFocused, onFocus, onClick, onOpenDetails }: Props) {
  const { savedPropertyIds, toggleSaveProperty } = useSearch();
  const isSaved = savedPropertyIds.includes(property.id);

  return (
    <article
      onMouseEnter={onFocus}
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl border bg-zinc-950/80 backdrop-blur-xl p-0 overflow-hidden transition-all duration-300 hover:border-purple-500/70 hover:shadow-[0_0_35px_-8px_rgba(168,85,247,0.45)] ${
        isFocused ? "border-purple-500 ring-1 ring-purple-500/50 shadow-[0_0_30px_-5px_rgba(168,85,247,0.5)]" : "border-white/10"
      }`}
      style={{ animation: "fadeInUp 0.3s ease-out both" }}
    >
      {/* Property Thumbnail */}
      <div className="relative h-36 w-full overflow-hidden">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />

        {/* Portal Source Badge */}
        {property.brokerSource && (
          <Badge className="absolute top-2.5 left-2.5 bg-black/85 backdrop-blur-md text-[10px] font-semibold text-purple-300 border border-purple-500/40 px-2 py-0.5 shadow-md flex items-center gap-1">
            <span>🌐</span> {property.brokerSource}
          </Badge>
        )}

        {/* Photo Gallery Count */}
        <div className="absolute top-2.5 left-24 bg-black/75 backdrop-blur-md text-[10px] font-mono text-zinc-300 border border-white/20 rounded-md px-1.5 py-0.5 flex items-center gap-1 shadow">
          <span>📷</span> {property.images && property.images.length > 0 ? property.images.length : 5}
        </div>

        {/* Eq. 6 Commute Buddy Match Score Badge */}
        <div className="absolute top-2.5 right-11">
          <Badge className={`text-[10px] font-bold px-2 py-0.5 border shadow-lg flex items-center gap-1 backdrop-blur-md ${getMatchColor(property.matchScore)}`}>
            <Zap className="w-3 h-3 text-purple-400 fill-purple-400" />
            <span>{property.matchScore}% Match</span>
          </Badge>
        </div>

        {/* Save/Favorite Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSaveProperty(property.id);
          }}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white hover:scale-110 active:scale-95 transition-transform z-10"
          title={isSaved ? "Remove from saved" : "Save property"}
        >
          <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-purple-500 text-purple-500" : "text-white/80"}`} />
        </button>

        {/* Commute Duration Badge (Eq. 5) */}
        <Badge className={`absolute bottom-2.5 right-2.5 ${getCommuteColor(property.commuteMinutes)} border text-[11px] font-mono font-bold px-2.5 py-0.5 shadow-lg`}>
          ⏱️ {property.commuteMinutes} min commute
        </Badge>

        {/* Price Tag */}
        <div className="absolute bottom-2 left-2.5 text-lg font-bold text-white drop-shadow-md flex items-baseline gap-1">
          <span>₹{property.price.toLocaleString("en-IN")}</span>
          <span className="text-[11px] font-normal text-zinc-300">/mo</span>
        </div>
      </div>

      {/* Property Details */}
      <div className="p-3.5 space-y-2">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
              {property.title}
            </h3>
          </div>
          {property.societyName && (
            <p className="text-[11px] text-purple-300/90 font-medium truncate mt-0.5">
              🏢 {property.societyName}
            </p>
          )}
        </div>

        {/* Location & Distance */}
        <div className="flex items-center gap-1 text-[11px] text-zinc-400 truncate">
          <MapPin className="w-3 h-3 text-purple-400 flex-shrink-0" />
          <span className="truncate">{property.address || property.city}</span>
          <span className="text-zinc-600">•</span>
          <span className="text-purple-300 font-mono font-medium">{property.distanceKm.toFixed(1)} km</span>
        </div>

        {/* Specs: Beds, Baths, Sqft, Floor */}
        <div className="flex items-center gap-2.5 text-[11px] text-zinc-300 pt-0.5 flex-wrap">
          <span className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5 text-zinc-400" />
            {property.bedrooms || "Studio"} {property.bedrooms === 1 ? "Bed" : "Beds"}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5 text-zinc-400" />
            {property.bathrooms} {property.bathrooms === 1 ? "Bath" : "Baths"}
          </span>
          <span className="font-mono text-zinc-300">{property.sqft} sqft</span>
          {property.floor && (
            <span className="text-zinc-400 text-[10px]">
              • {property.floor.split(" ")[0]} flr
            </span>
          )}
          {property.petFriendly && (
            <span className="flex items-center gap-0.5 text-emerald-400 text-[10px]" title="Pet Friendly">
              <PawPrint className="w-3 h-3" /> Pets OK
            </span>
          )}
        </div>

        {/* Commute vs Budget Fit Breakdown (Paper Eq. 6) */}
        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/10 text-[10px]">
          <div className="bg-white/5 rounded-lg px-2 py-1 text-center border border-white/5">
            <span className="text-zinc-400 block text-[9px] uppercase tracking-wider">Commute</span>
            <span className="font-bold text-emerald-400 font-mono">{Math.round(property.commuteFit * 100)}%</span>
          </div>
          <div className="bg-white/5 rounded-lg px-2 py-1 text-center border border-white/5">
            <span className="text-zinc-400 block text-[9px] uppercase tracking-wider">Price</span>
            <span className="font-bold text-purple-400 font-mono">{Math.round(property.priceFit * 100)}%</span>
          </div>
          <div className="bg-white/5 rounded-lg px-2 py-1 text-center border border-white/5">
            <span className="text-zinc-400 block text-[9px] uppercase tracking-wider">Area</span>
            <span className="font-bold text-indigo-400 font-mono">{Math.round(property.areaFit * 100)}%</span>
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-1.5 flex items-center justify-between gap-2">
          <span className="text-[10px] text-zinc-500 font-medium">Click card to trace route</span>
          {onOpenDetails && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails();
              }}
              className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-[11px] font-semibold transition-all shadow-sm active:scale-95"
            >
              Details & Call →
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
