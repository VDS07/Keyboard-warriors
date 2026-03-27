import { useRef, useState, Suspense, lazy, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Upload, CheckCircle2, Building2, Phone, User, FileText, Landmark, Home, IndianRupee, Layers } from "lucide-react";

const PropertyMap = lazy(() =>
  import("@/components/map/PropertyMap").then((module) => ({
    default: module.PropertyMap,
  })),
);

type FormStep = "property" | "owner" | "preview";

export default function SellerPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<FormStep>("property");
  const [locationSearch, setLocationSearch] = useState("");
  const [mapCenter, setMapCenter] = useState({ lat: 21.1458, lng: 79.0882 });
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleLocationSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!locationSearch.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(locationSearch)}`);
      const data = await res.json();
      if (data.length) setMapCenter({ lat: Number(data[0].lat), lng: Number(data[0].lon) });
    } catch { /* fallback */ }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    // Simulate upload delay
    setTimeout(() => {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setPropertyImages(prev => [...prev, ...newImages]);
      setIsUploading(false);
    }, 1000);
  };

  const removeImage = (index: number) => {
    setPropertyImages(prev => prev.filter((_, i) => i !== index));
  };

  const stepColors = {
    property: "from-primary/20 to-blue-500/10",
    owner: "from-emerald-500/20 to-teal-500/10",
    preview: "from-amber-500/20 to-orange-500/10",
  };

  return (
    <div ref={containerRef} className="relative bg-zinc-950 text-white font-sans" style={{ height: "100vh" }}>
      {/* Hidden File Input */}
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
      />

      {/* Floating Step Indicator */}
      {/* ... (existing floating step indicator) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-2 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 shadow-2xl">
        {(["property", "owner", "preview"] as FormStep[]).map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              step === s ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === s ? "bg-primary text-white" : "bg-white/10 text-white/50"
            }`}>{i + 1}</span>
            <span className="hidden md:inline capitalize">{s === "property" ? "Property" : s === "owner" ? "Contact" : "Preview"}</span>
          </button>
        ))}
      </div>

      {/* Layout: Map Left + Form Right */}
      <div className="sticky top-0 h-screen flex overflow-hidden">
        
        {/* Left: Interactive Map */}
        {/* ... (mostly same only workplace title change) */}
        <div className="relative flex items-center justify-center w-1/2 p-6">
          <div
            className="relative overflow-hidden shadow-2xl border border-white/10 bg-black w-[420px] h-[420px] rounded-full"
          >
            <Suspense fallback={<div className="w-full h-full bg-zinc-900 animate-pulse" />}>
              <PropertyMap
                workplace={{ label: "Property Location", lat: mapCenter.lat, lng: mapCenter.lng }}
                properties={[]}
                focusedPropertyId={null}
                toCurrency={(p) => `₹${p}`}
                onPropertyFocus={() => {}}
                hideControls={true}
              />
            </Suspense>
          </div>

          {/* Map overlay hint */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-[11px] text-white/50 border border-white/10">
            📍 Pin your property location on the map
          </div>
        </div>

        {/* Right: Scrolling Form */}
        <div className="w-1/2 overflow-y-auto h-screen px-6 md:px-12 py-20 scrollbar-hide">

          {/* ── Step 1: Property Details ── */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: step === "property" ? 1 : 0.4, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`bg-gradient-to-br ${stepColors.property} bg-black/40 backdrop-blur-2xl border border-white/10 p-7 rounded-3xl shadow-2xl relative mb-8`}
          >
            {/* ... (beginning of property details) */}
            <div className="absolute -top-8 -right-8 w-28 h-28 bg-primary/20 rounded-full blur-3xl -z-10" />

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary/20 rounded-xl"><Building2 className="w-5 h-5 text-primary" /></div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Property Details</h2>
                <p className="text-white/40 text-[11px] uppercase tracking-widest">What are you listing?</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Listing Purpose + Property Type Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Listing Purpose</label>
                  <Select defaultValue="rent">
                    <SelectTrigger className="bg-white/5 border-white/10 h-11 text-white focus:ring-primary/50">
                      <SelectValue placeholder="Purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">🏠 Rent</SelectItem>
                      <SelectItem value="sell">🏡 Sell</SelectItem>
                      <SelectItem value="plot">📐 Plot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Property Type</label>
                  <Select defaultValue="apartment">
                    <SelectTrigger className="bg-white/5 border-white/10 h-11 text-white focus:ring-primary/50">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="plot">Land/Plot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Property Images Section */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs text-white/60 uppercase tracking-wider">Property Images</label>
                  <span className="text-[10px] text-white/30">{propertyImages.length} / 5 labels</span>
                </div>
                
                {/* Image Thumbnails Area */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {propertyImages.map((img, idx) => (
                    <motion.div 
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      key={idx} 
                      className="relative w-16 h-16 rounded-xl border border-white/10 overflow-hidden group"
                    >
                      <img src={img} alt="Property" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-500 font-bold"
                      >
                        ✕
                      </button>
                    </motion.div>
                  ))}
                  
                  {/* Upload Trigger Button */}
                  {propertyImages.length < 5 && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 flex flex-col items-center justify-center transition-colors hover:bg-white/5"
                    >
                      {isUploading ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-white/30" />
                          <span className="text-[9px] text-white/30 mt-1 uppercase font-bold">Add</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-white/30 italic">High-quality photos help attract 3x more buyers.</p>
              </div>

              {/* Location with geocoding */}
              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Location</label>
                <form onSubmit={handleLocationSearch} className="flex gap-2">
                  <Input
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="bg-white/5 border-white/10 h-11 text-white placeholder:text-white/30 focus-visible:ring-primary/50 flex-1"
                    placeholder="Search locality, city..."
                  />
                  <Button type="submit" size="sm" variant="outline" className="h-11 px-3 border-white/10 hover:bg-primary/10">
                    <MapPin className="w-4 h-4" />
                  </Button>
                </form>
              </div>

              {/* Price + Area Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Price (₹)</label>
                  <Input type="number" className="bg-white/5 border-white/10 h-11 text-white placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="e.g. 25000" />
                </div>
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Area (sq ft)</label>
                  <Input type="number" className="bg-white/5 border-white/10 h-11 text-white placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="e.g. 1200" />
                </div>
              </div>

              {/* BHK + Bathrooms Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Bedrooms</label>
                  <Select defaultValue="2">
                    <SelectTrigger className="bg-white/5 border-white/10 h-11 text-white focus:ring-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Studio</SelectItem>
                      <SelectItem value="1">1 BHK</SelectItem>
                      <SelectItem value="2">2 BHK</SelectItem>
                      <SelectItem value="3">3 BHK</SelectItem>
                      <SelectItem value="4">4+ BHK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Bathrooms</label>
                  <Select defaultValue="2">
                    <SelectTrigger className="bg-white/5 border-white/10 h-11 text-white focus:ring-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Furnished + Pet Friendly */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Furnished Status</label>
                  <Select defaultValue="semi">
                    <SelectTrigger className="bg-white/5 border-white/10 h-11 text-white focus:ring-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="furnished">Fully Furnished</SelectItem>
                      <SelectItem value="semi">Semi-Furnished</SelectItem>
                      <SelectItem value="unfurnished">Unfurnished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Pet Friendly?</label>
                  <Select defaultValue="no">
                    <SelectTrigger className="bg-white/5 border-white/10 h-11 text-white focus:ring-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">✅ Yes</SelectItem>
                      <SelectItem value="no">❌ No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Nearby Landmarks */}
              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Nearby Landmarks</label>
                <Input className="bg-white/5 border-white/10 h-11 text-white placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="Metro station, hospital, school..." />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Description</label>
                <Textarea className="bg-white/5 border-white/10 min-h-[80px] text-white resize-none p-3 placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="Amenities, floor, facing direction etc..." />
              </div>

              <Button onClick={() => setStep("owner")} className="w-full h-11 mt-2 bg-primary hover:bg-primary/90 font-semibold rounded-xl">
                Continue → Owner Details
              </Button>
            </div>
          </motion.section>

          {/* ── Step 2: Owner Contact ── */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: step === "owner" || step === "preview" ? 1 : 0.3, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`bg-gradient-to-br ${stepColors.owner} bg-black/40 backdrop-blur-2xl border border-white/10 p-7 rounded-3xl shadow-2xl relative mb-8`}
          >
            {/* ... (Step 2 content same) */}
            <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-emerald-500/20 rounded-full blur-3xl -z-10" />

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-500/20 rounded-xl"><User className="w-5 h-5 text-emerald-400" /></div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Owner's Information</h2>
                <p className="text-white/40 text-[11px] uppercase tracking-widest">How buyers reach you</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Full Name</label>
                  <Input className="bg-white/5 border-white/10 h-11 text-white placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="Your name" />
                </div>
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Phone Number</label>
                  <Input type="tel" className="bg-white/5 border-white/10 h-11 text-white placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="+91..." />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Email Address</label>
                <Input type="email" className="bg-white/5 border-white/10 h-11 text-white placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="your@email.com" />
              </div>
              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Ownership Proof</label>
                <Select defaultValue="registry">
                  <SelectTrigger className="bg-white/5 border-white/10 h-11 text-white focus:ring-primary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registry">Property Registry</SelectItem>
                    <SelectItem value="agreement">Rent Agreement</SelectItem>
                    <SelectItem value="allotment">Allotment Letter</SelectItem>
                    <SelectItem value="poa">Power of Attorney</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Preferred Contact Time</label>
                <Select defaultValue="anytime">
                  <SelectTrigger className="bg-white/5 border-white/10 h-11 text-white focus:ring-primary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (8 AM – 12 PM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12 PM – 5 PM)</SelectItem>
                    <SelectItem value="evening">Evening (5 PM – 9 PM)</SelectItem>
                    <SelectItem value="anytime">Anytime</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("property")} className="flex-1 h-11 border-white/10 rounded-xl">
                  ← Back
                </Button>
                <Button onClick={() => setStep("preview")} className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 font-semibold rounded-xl">
                  Preview Listing →
                </Button>
              </div>
            </div>
          </motion.section>

          {/* ── Step 3: Preview & Submit ── */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: step === "preview" ? 1 : 0.2, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`bg-gradient-to-br ${stepColors.preview} bg-black/40 backdrop-blur-2xl border border-white/10 p-7 rounded-3xl shadow-2xl relative`}
          >
            {/* ... (Step 3 content summarized with images) */}
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-amber-500/20 rounded-xl"><CheckCircle2 className="w-5 h-5 text-amber-400" /></div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Ready to List!</h2>
                <p className="text-white/40 text-[11px] uppercase tracking-widest">Review and publish your listing</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Preview Summary */}
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Home className="w-4 h-4 text-primary" />
                  <span className="text-white/60">Property location pinned</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] ml-auto shadow-none">✓ Set</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                   <Upload className="w-4 h-4 text-primary" />
                   <span className="text-white/60">{propertyImages.length} images added</span>
                   <Badge className={`${propertyImages.length > 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"} text-[10px] ml-auto shadow-none`}>
                     {propertyImages.length > 0 ? "✓" : "⚠️ Recommended"}
                   </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <IndianRupee className="w-4 h-4 text-primary" />
                  <span className="text-white/60">Pricing configured</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] ml-auto shadow-none">✓ Set</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-white/60">Owner contact added</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] ml-auto shadow-none">✓ Set</Badge>
                </div>
              </div>

              <p className="text-xs text-white/40 text-center">
                Your listing will appear on CommuteBuddy and our smart pricing engine will recommend optimal pricing based on demand.
              </p>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("owner")} className="flex-1 h-11 border-white/10 rounded-xl">
                  ← Edit
                </Button>
                <Button onClick={() => navigate('/owner')} className="flex-1 h-12 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 font-bold text-lg rounded-xl transition-all active:scale-95">
                  🚀 Publish Listing
                </Button>
              </div>
            </div>
          </motion.section>

        </div>
      </div>
    </div>
  );
}
