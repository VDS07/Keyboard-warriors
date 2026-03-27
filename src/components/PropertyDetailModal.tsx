import { EnrichedProperty } from "@/context/SearchContext";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Bed, Bath, Ruler, PawPrint, Sofa, Star } from "lucide-react";

type Props = {
  property: EnrichedProperty | null;
  open: boolean;
  onClose: () => void;
};

const getLivabilityColor = (score: number) => {
  if (score >= 85) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (score >= 70) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
  return "text-red-400 bg-red-500/10 border-red-500/20";
};

const getCommuteColor = (mins: number) => {
  if (mins <= 15) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (mins <= 30) return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
  return "bg-red-500/15 text-red-400 border-red-500/30";
};

export function PropertyDetailModal({ property, open, onClose }: Props) {
  if (!property) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-zinc-950/95 backdrop-blur-2xl border-white/10 text-white p-0 overflow-hidden rounded-2xl">
        
        {/* Image */}
        <div className="relative h-56 w-full overflow-hidden">
          <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
          <Badge className={`absolute bottom-3 right-3 ${getCommuteColor(property.commuteMinutes)} border text-sm font-semibold px-3 py-1`}>
            ⏱️ {property.commuteMinutes} mins to work
          </Badge>
        </div>

        <div className="p-6 space-y-5">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight">{property.title}</DialogTitle>
            <p className="text-white/50 text-sm flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" /> {property.distanceKm.toFixed(1)} km from workplace
            </p>
          </DialogHeader>

          {/* Price + Livability */}
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-primary">₹{property.price.toLocaleString("en-IN")}<span className="text-sm text-white/40 font-normal">/mo</span></div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${getLivabilityColor(property.livabilityScore)}`}>
              <Star className="w-4 h-4" />
              <span className="font-bold text-sm">{property.livabilityScore}</span>
              <span className="text-xs opacity-70">/100</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
              <Bed className="w-5 h-5 mx-auto mb-1 text-white/60" />
              <span className="text-sm font-semibold">{property.bedrooms || "Studio"}</span>
              <p className="text-[10px] text-white/40 uppercase">Beds</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
              <Bath className="w-5 h-5 mx-auto mb-1 text-white/60" />
              <span className="text-sm font-semibold">{property.bathrooms}</span>
              <p className="text-[10px] text-white/40 uppercase">Baths</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
              <Ruler className="w-5 h-5 mx-auto mb-1 text-white/60" />
              <span className="text-sm font-semibold">{property.sqft}</span>
              <p className="text-[10px] text-white/40 uppercase">Sq Ft</p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {property.petFriendly && (
              <Badge variant="outline" className="border-white/10 text-white/80 gap-1"><PawPrint className="w-3 h-3"/>Pet Friendly</Badge>
            )}
            <Badge variant="outline" className="border-white/10 text-white/80 gap-1 capitalize"><Sofa className="w-3 h-3"/>{property.furnished}</Badge>
            <Badge variant="outline" className="border-white/10 text-white/80 capitalize">{property.type}</Badge>
          </div>

          {/* Description */}
          <p className="text-sm text-white/60 leading-relaxed">{property.description}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
