import { useState } from "react";
import { EnrichedProperty, useSearch } from "@/context/SearchContext";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, Bed, Bath, Ruler, PawPrint, Sofa, Star, User, Phone, ExternalLink, Calendar, Clock, CheckCircle2 } from "lucide-react";

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
  const { workplace, transportMode } = useSearch();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState("2026-08-10");
  const [bookingTime, setBookingTime] = useState("11:00 AM");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!property) return null;

  // Open direct Google Maps Navigation in new tab
  const handleOpenGoogleMaps = () => {
    const modeMap: Record<string, string> = { drive: "driving", transit: "transit", cycle: "bicycling", walk: "walking" };
    const googleMode = modeMap[transportMode] || "driving";
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${workplace.lat},${workplace.lng}&destination=${property.lat},${property.lng}&travelmode=${googleMode}`;
    window.open(googleMapsUrl, "_blank");
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    toast.success(`Call requested with ${property.contactName || "Property Owner"} for ${bookingDate} at ${bookingTime}!`);
    setTimeout(() => {
      setShowBookingModal(false);
      setIsSubmitted(false);
    }, 2000);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg bg-zinc-950/95 backdrop-blur-2xl border-white/10 text-white p-0 overflow-hidden rounded-2xl">
          
          {/* Image */}
          <div className="relative h-56 w-full overflow-hidden">
            <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
            
            {property.brokerSource && (
              <Badge className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-purple-300 border-purple-500/30 text-xs px-2.5 py-1">
                🌐 Source: {property.brokerSource}
              </Badge>
            )}

            <Badge className={`absolute bottom-3 right-3 ${getCommuteColor(property.commuteMinutes)} border text-sm font-semibold px-3 py-1`}>
              ⏱️ {property.commuteMinutes} mins to work
            </Badge>
          </div>

          <div className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight">{property.title}</DialogTitle>
              <p className="text-white/50 text-sm flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-purple-400" /> {property.distanceKm.toFixed(1)} km from workplace ({workplace.label.split(",")[0]})
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

            {/* Main Action Buttons */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              
              {/* Google Maps Directions Link */}
              <Button
                onClick={handleOpenGoogleMaps}
                className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
              >
                <ExternalLink className="w-4 h-4" /> Get Directions in Google Maps
              </Button>

              {/* Book a Call Button */}
              <Button
                onClick={() => setShowBookingModal(true)}
                variant="outline"
                className="w-full h-11 rounded-xl border-purple-500/40 text-purple-300 hover:bg-purple-500/10 font-semibold flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-purple-400" /> Book a Call with Property Owner
              </Button>

            </div>

            {/* Contact Details Footer */}
            {(property.contactName || property.contactPhone || property.contactEmail) && (
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                <span>Listed by: <strong className="text-white">{property.contactName || "Owner"}</strong></span>
                <span>Phone: <strong className="text-white">{property.contactPhone || "Available on Booking"}</strong></span>
              </div>
            )}

          </div>
        </DialogContent>
      </Dialog>

      {/* Book a Call Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-md bg-zinc-950 border-white/10 text-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Phone className="w-5 h-5 text-purple-400" /> Schedule Call with Owner
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Select your preferred date and time to discuss {property.title}.
            </DialogDescription>
          </DialogHeader>

          {isSubmitted ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="text-lg font-bold text-white">Call Request Sent!</h4>
              <p className="text-xs text-zinc-400">The owner will contact you at {buyerPhone || "your registered number"}.</p>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs text-zinc-300">Preferred Date</Label>
                <Input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="bg-zinc-900 border-white/10 text-white h-10 text-xs"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-zinc-300">Time Slot</Label>
                <Input
                  type="text"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  placeholder="e.g. 10:00 AM - 12:00 PM"
                  className="bg-zinc-900 border-white/10 text-white h-10 text-xs"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-zinc-300">Your Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="+91-9876543210"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="bg-zinc-900 border-white/10 text-white h-10 text-xs"
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 h-11 text-white font-semibold">
                Confirm Call Request
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
