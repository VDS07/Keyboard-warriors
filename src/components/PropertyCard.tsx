import { EnrichedProperty, useSearch } from "@/context/SearchContext";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, PawPrint, Heart } from "lucide-react";

type Props = {
  property: EnrichedProperty;
  isFocused: boolean;
  onFocus: () => void;
  onClick: () => void;
};

const getCommuteColor = (mins: number) => {
  if (mins <= 15) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (mins <= 30) return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
  return "bg-red-500/15 text-red-400 border-red-500/30";
};

export function PropertyCard({ property, isFocused, onFocus, onClick }: Props) {
  const { savedPropertyIds, toggleSaveProperty } = useSearch();
  const isSaved = savedPropertyIds.includes(property.id);

  return (
    <article
      onMouseEnter={onFocus}
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl border bg-card/30 backdrop-blur-sm p-0 overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.3)] ${
        isFocused ? "border-primary/60 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.4)]" : "border-border/50"
      }`}
      style={{ animation: "fadeInUp 0.4s ease-out both" }}
    >
      {/* Image */}
      <div className="relative h-32 w-full overflow-hidden">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        {/* Broker Source Tag */}
        {property.brokerSource && (
          <Badge className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-[10px] font-semibold text-purple-300 border border-purple-500/30 px-2 py-0.5 shadow-md">
            🌐 {property.brokerSource}
          </Badge>
        )}

        {/* Save/Bookmark button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSaveProperty(property.id);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:scale-110 transition-transform z-10"
          title={isSaved ? "Remove from saved" : "Save property"}
        >
          <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-purple-500 text-purple-500" : "text-white/80"}`} />
        </button>

        <Badge className={`absolute bottom-2 right-2 ${getCommuteColor(property.commuteMinutes)} border text-[11px] font-bold px-2 py-0.5 shadow-lg`}>
          ⏱️ {property.commuteMinutes}m
        </Badge>
        <div className="absolute bottom-2 left-2 text-lg font-bold text-white drop-shadow-lg">
          ₹{property.price.toLocaleString("en-IN")}<span className="text-xs font-normal text-white/70">/mo</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <h3 className="text-sm font-semibold leading-tight text-foreground group-hover:text-primary transition-colors truncate">{property.title}</h3>
        
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Bed className="w-3 h-3"/>{property.bedrooms || "Studio"} bd</span>
          <span className="flex items-center gap-1"><Bath className="w-3 h-3"/>{property.bathrooms} ba</span>
          <span>{property.sqft} sqft</span>
          {property.petFriendly && <PawPrint className="w-3 h-3 text-emerald-400"/>}
        </div>

        {/* Livability bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${property.livabilityScore}%`,
                background: property.livabilityScore >= 85 ? "linear-gradient(90deg, #10b981, #34d399)" :
                  property.livabilityScore >= 70 ? "linear-gradient(90deg, #f59e0b, #fbbf24)" :
                  "linear-gradient(90deg, #ef4444, #f87171)"
              }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">{property.livabilityScore}</span>
        </div>
      </div>
    </article>
  );
}
