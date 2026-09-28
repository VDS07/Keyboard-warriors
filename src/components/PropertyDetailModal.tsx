import { useState } from "react";
import { EnrichedProperty, useSearch } from "@/context/SearchContext";
import { supabaseInquiries } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  MapPin,
  Bed,
  Bath,
  Ruler,
  PawPrint,
  Sofa,
  Star,
  Phone,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Compass,
  Layers,
  Droplet,
  Zap,
  MessageSquare,
  Sparkles,
  Calendar,
  Check
} from "lucide-react";

type Props = {
  property: EnrichedProperty | null;
  open: boolean;
  onClose: () => void;
};

const getLivabilityColor = (score: number) => {
  if (score >= 85) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  if (score >= 70) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
  return "text-red-400 bg-red-500/10 border-red-500/30";
};

const getCommuteColor = (mins: number) => {
  if (mins <= 15) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  if (mins <= 30) return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
  return "bg-rose-500/20 text-rose-300 border-rose-500/40";
};

export function PropertyDetailModal({ property, open, onClose }: Props) {
  const { workplace, transportMode, userProfile } = useSearch();
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState("2026-10-05");
  const [bookingTime, setBookingTime] = useState("11:00 AM");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!property) return null;

  const galleryImages = (property.images && property.images.length > 0)
    ? property.images
    : [property.image || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200"];

  const currentPhoto = galleryImages[selectedPhotoIdx % galleryImages.length];

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhotoIdx((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhotoIdx((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  // Open direct Google Maps Navigation
  const handleOpenGoogleMaps = () => {
    const modeMap: Record<string, string> = { drive: "driving", transit: "transit", cycle: "bicycling", walk: "walking" };
    const googleMode = modeMap[transportMode] || "driving";
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${workplace.lat},${workplace.lng}&destination=${property.lat},${property.lng}&travelmode=${googleMode}`;
    window.open(googleMapsUrl, "_blank");
  };

  // Open Original Source Listing (99acres / MagicBricks / Housing.com)
  const handleOpenSourceWebsite = () => {
    const defaultUrl = `https://www.google.com/search?q=${encodeURIComponent(`${property.title} ${property.city} ${property.brokerSource || "99acres"}`)}`;
    const targetUrl = property.sourceUrl || defaultUrl;
    window.open(targetUrl, "_blank");
  };

  // WhatsApp Inquiry
  const handleWhatsAppInquiry = () => {
    const cleanPhone = (property.contactPhone || "+919876543210").replace(/[^0-9]/g, "");
    const message = encodeURIComponent(
      `Hi, I found your listing "${property.title}" on Commute Buddy (scraped from ${property.brokerSource || "99acres"}). I would like to schedule a site visit!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    // Sync to Supabase inquiries table
    supabaseInquiries.createInquiry({
      propertyId: property.id,
      propertyTitle: property.title,
      userEmail: userProfile?.email || "seeker@commutebuddy.in",
      seekerName: userProfile?.name || "Commuter",
      seekerPhone: buyerPhone || "+91-9876543210",
      preferredDate: bookingDate,
      timeSlot: bookingTime,
      message: `Site visit scheduled for ${property.title} (${bookingDate} at ${bookingTime})`,
    });

    toast.success(`Visit requested with ${property.contactName || "Property Owner"} for ${bookingDate} at ${bookingTime}!`);
    setTimeout(() => {
      setShowBookingModal(false);
      setIsSubmitted(false);
    }, 2000);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide bg-zinc-950/95 backdrop-blur-3xl border border-purple-500/30 text-white p-0 rounded-3xl shadow-2xl">
          
          {/* Multi-Photo Interactive Carousel */}
          <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-black select-none group">
            <img
              src={currentPhoto}
              alt={`${property.title} - photo ${selectedPhotoIdx + 1}`}
              className="w-full h-full object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />

            {/* Portal Source Badge */}
            <div className="absolute top-3.5 left-3.5 flex items-center gap-2 z-20">
              <Badge className="bg-black/85 backdrop-blur-md text-purple-300 border-purple-500/40 text-xs px-2.5 py-1 font-semibold shadow-lg flex items-center gap-1.5">
                <span>🌐</span> {property.brokerSource || "99acres"}
              </Badge>
              {property.reraId && (
                <Badge className="bg-emerald-950/80 backdrop-blur-md text-emerald-300 border-emerald-500/40 text-[11px] px-2 py-0.5 font-mono shadow-md">
                  RERA Registered
                </Badge>
              )}
            </div>

            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 p-2 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white border border-white/20 transition-all z-20 shadow-lg active:scale-95"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Gallery Navigation Arrows (if > 1 photo) */}
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-purple-600 text-white border border-white/20 hover:border-purple-400 transition-all z-20 backdrop-blur-sm active:scale-90"
                  title="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-purple-600 text-white border border-white/20 hover:border-purple-400 transition-all z-20 backdrop-blur-sm active:scale-90"
                  title="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Photo Counter Pill */}
            <div className="absolute bottom-3.5 left-3.5 bg-black/80 backdrop-blur-md text-white text-xs font-mono px-2.5 py-1 rounded-lg border border-white/20 z-20 flex items-center gap-1.5">
              <span>📷</span>
              <span>{selectedPhotoIdx + 1} / {galleryImages.length} Photos</span>
            </div>

            {/* Commute Duration Badge */}
            <Badge className={`absolute bottom-3.5 right-3.5 ${getCommuteColor(property.commuteMinutes)} border text-xs font-mono font-bold px-3 py-1 shadow-lg z-20`}>
              ⏱️ {property.commuteMinutes} mins to workplace
            </Badge>
          </div>

          {/* Thumbnail Gallery Strip */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-2 px-6 py-2 bg-zinc-900/60 border-b border-white/10 overflow-x-auto scrollbar-hide">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPhotoIdx(idx)}
                  className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedPhotoIdx === idx
                      ? "border-purple-500 ring-2 ring-purple-500/50 scale-105"
                      : "border-white/15 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Modal Body Content */}
          <div className="p-6 space-y-6">
            
            {/* Header: Title, Society & Workplace Proximity */}
            <DialogHeader className="text-left space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-2xl font-bold tracking-tight text-white">{property.title}</DialogTitle>
              </div>

              {property.societyName && (
                <p className="text-purple-300 font-semibold text-sm flex items-center gap-1.5 pt-0.5">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <span>Project / Society: <strong className="text-white">{property.societyName}</strong></span>
                </p>
              )}

              <p className="text-zinc-400 text-xs flex items-center gap-1.5 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span>{property.address || property.city}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-purple-300 font-mono font-semibold">{property.distanceKm.toFixed(1)} km</span> from anchor ({workplace.label.split(",")[0]})
              </p>
            </DialogHeader>

            {/* Price & Livability Rating Banner */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div>
                <span className="text-xs uppercase tracking-wider text-zinc-400 block font-semibold">Monthly Rent</span>
                <div className="text-3xl font-extrabold text-white flex items-baseline gap-1">
                  <span>₹{property.price.toLocaleString("en-IN")}</span>
                  <span className="text-sm text-zinc-400 font-normal">/month</span>
                </div>
                {property.maintenance && (
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    {property.maintenance}
                  </span>
                )}
              </div>

              <div className="text-right">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${getLivabilityColor(property.livabilityScore)}`}>
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-bold text-base">{property.livabilityScore}</span>
                  <span className="text-xs opacity-75">/100 Livability</span>
                </div>
                <span className="text-[10px] text-zinc-400 block mt-1 font-mono">
                  {property.matchScore}% Commute Match
                </span>
              </div>
            </div>

            {/* Primary Live Portal Link Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-purple-900/30 to-indigo-950/60 border border-purple-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    {property.verifiedBadge || `Verified Listing on ${property.brokerSource || "99acres"}`}
                  </h4>
                  <p className="text-[11px] text-purple-200/80">
                    Live scraped metadata: Real pricing, photos, and owner contact details.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleOpenSourceWebsite}
                size="sm"
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl px-3.5 h-9 flex items-center gap-1.5 shadow-md flex-shrink-0 active:scale-95"
              >
                <span>View on {property.brokerSource || "Source Portal"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Core Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                <Bed className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                <span className="text-sm font-bold text-white">{property.bedrooms || "Studio"} {property.bedrooms === 1 ? "Bed" : "Beds"}</span>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Bedrooms</p>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                <Bath className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                <span className="text-sm font-bold text-white">{property.bathrooms} {property.bathrooms === 1 ? "Bath" : "Baths"}</span>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Bathrooms</p>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                <Ruler className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                <span className="text-sm font-bold text-white font-mono">{property.sqft} sqft</span>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Super Built-up</p>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                <Layers className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                <span className="text-sm font-bold text-white capitalize">{property.furnished}</span>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Furnishing</p>
              </div>
            </div>

            {/* Source Website Detailed Specifications Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Source Portal Technical Specifications
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {property.carpetSqft && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-zinc-400">Carpet Area:</span>
                    <span className="font-semibold text-white font-mono">{property.carpetSqft} sq.ft</span>
                  </div>
                )}

                {property.floor && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-zinc-400">Floor:</span>
                    <span className="font-semibold text-white">{property.floor}</span>
                  </div>
                )}

                {property.facing && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-zinc-400">Facing & Vaastu:</span>
                    <span className="font-semibold text-white">{property.facing}</span>
                  </div>
                )}

                {property.securityDeposit && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-zinc-400">Security Deposit:</span>
                    <span className="font-semibold text-white font-mono">{property.securityDeposit}</span>
                  </div>
                )}

                {property.availability && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-zinc-400">Availability:</span>
                    <span className="font-semibold text-emerald-300">{property.availability}</span>
                  </div>
                )}

                {property.propertyAge && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-zinc-400">Age of Property:</span>
                    <span className="font-semibold text-white">{property.propertyAge}</span>
                  </div>
                )}

                {property.waterSupply && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-zinc-400">Water Supply:</span>
                    <span className="font-semibold text-white">{property.waterSupply}</span>
                  </div>
                )}

                {property.powerBackup && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-zinc-400">Power Backup:</span>
                    <span className="font-semibold text-white">{property.powerBackup}</span>
                  </div>
                )}

                {property.reraId && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 sm:col-span-2">
                    <span className="text-zinc-400">State RERA ID:</span>
                    <span className="font-semibold text-purple-300 font-mono text-[11px] truncate max-w-[280px]">
                      {property.reraId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Description</h4>
              <p className="text-xs text-zinc-300 leading-relaxed bg-white/5 p-3.5 rounded-xl border border-white/5">
                {property.description}
              </p>
            </div>

            {/* Verified Society Amenities Grid */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Society Amenities ({property.amenities.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {property.amenities.map((item, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-zinc-300"
                    >
                      <Check className="w-3 h-3 text-purple-400 flex-shrink-0" />
                      <span>{item}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Seller & Navigation Actions */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              
              {/* Primary Directions & Source Link Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Button
                  onClick={handleOpenGoogleMaps}
                  className="h-11 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" /> Google Maps Route
                </Button>

                <Button
                  onClick={handleWhatsAppInquiry}
                  className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" /> WhatsApp Inquiry
                </Button>
              </div>

              {/* Book Call / Schedule Visit */}
              <Button
                onClick={() => setShowBookingModal(true)}
                variant="outline"
                className="w-full h-11 rounded-xl border-purple-500/40 text-purple-300 hover:bg-purple-500/10 font-semibold flex items-center justify-center gap-2 active:scale-95"
              >
                <Phone className="w-4 h-4 text-purple-400" /> Book Direct Call with {property.contactName || "Owner"}
              </Button>
            </div>

            {/* Contact Footer */}
            <div className="pt-2 text-center text-xs text-zinc-500">
              Listed by: <strong className="text-zinc-300">{property.contactName || "Verified Owner"}</strong> ({property.brokerType || "Direct Listing"}) • Contact: <strong className="text-zinc-300">{property.contactPhone || "+91-9845112233"}</strong>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* Book a Call Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-md bg-zinc-950 border border-purple-500/30 text-white rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Phone className="w-5 h-5 text-purple-400" /> Schedule Visit / Call
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
                <Label className="text-xs text-zinc-300">Preferred Visit Date</Label>
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

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 h-11 text-white font-semibold shadow-md active:scale-95">
                Confirm Call / Visit Request
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
