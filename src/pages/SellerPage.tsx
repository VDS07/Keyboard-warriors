import { useRef, useState, Suspense, lazy, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Upload, CheckCircle2, Building2, Phone, User, FileText, Landmark, Home, IndianRupee, Layers, Star } from "lucide-react";
import { useSearch } from "@/context/SearchContext";

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
  const { registerProperty, setUserRole } = useSearch();

  const [step, setStep] = useState<FormStep>("property");
  const [locationSearch, setLocationSearch] = useState("");
  const [mapCenter, setMapCenter] = useState({ lat: 21.1458, lng: 79.0882 });
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Central form state
  const [formData, setFormData] = useState({
    purpose: "rent" as "rent" | "buy" | "plot",
    type: "apartment" as "apartment" | "villa" | "studio" | "penthouse" | "duplex",
    price: "",
    sqft: "",
    bedrooms: "2",
    bathrooms: "2",
    furnished: "semi-furnished" as "furnished" | "semi-furnished" | "unfurnished",
    petFriendly: "no",
    landmarks: "",
    description: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    city: "Nagpur",
  });

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!locationSearch.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(locationSearch)}`);
      const data = await res.json();
      if (data.length) {
        setMapCenter({ lat: Number(data[0].lat), lng: Number(data[0].lon) });
        updateForm("city", data[0].display_name.split(',')[0]);
      }
    } catch { /* fallback */ }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setTimeout(() => {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setPropertyImages(prev => [...prev, ...newImages]);
      setIsUploading(false);
    }, 1000);
  };

  const removeImage = (index: number) => {
    setPropertyImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublish = () => {
    registerProperty({
      title: `${formData.bedrooms} BHK ${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} in ${formData.city}`,
      price: Number(formData.price) || 25000,
      lat: mapCenter.lat,
      lng: mapCenter.lng,
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      sqft: Number(formData.sqft) || 1200,
      image: propertyImages[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
      type: formData.type,
      livabilityScore: 85,
      petFriendly: formData.petFriendly === "yes",
      furnished: formData.furnished,
      description: formData.description || `Beautiful ${formData.type} with great amenities.`,
      city: formData.city,
      contactName: formData.contactName,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
    });

    setUserRole("buyer"); // Switch to buyer to see the map
    navigate("/");
  };

  const stepColors = {
    property: "from-primary/20 to-blue-500/10",
    owner: "from-emerald-500/20 to-teal-500/10",
    preview: "from-amber-500/20 to-orange-500/10",
  };

  return (
    <div ref={containerRef} className="relative bg-zinc-950 text-white font-sans" style={{ height: "100vh" }}>
      <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />

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

      <div className="sticky top-0 h-screen flex overflow-hidden">
        <div className="relative flex items-center justify-center w-1/2 p-6">
          <div className="relative overflow-hidden shadow-2xl border border-white/10 bg-black w-[420px] h-[420px] rounded-full">
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
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-[11px] text-white/50 border border-white/10">
            📍 Pin your property location on the map
          </div>
        </div>

        <div className="w-1/2 overflow-y-auto h-screen px-6 md:px-12 py-20 scrollbar-hide">
          {/* Step 1: Property Details */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: step === "property" ? 1 : 0.4, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`bg-gradient-to-br ${stepColors.property} bg-black/40 backdrop-blur-2xl border border-white/10 p-7 rounded-3xl shadow-2xl relative mb-8`}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary/20 rounded-xl"><Building2 className="w-5 h-5 text-primary" /></div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Property Details</h2>
                <p className="text-white/40 text-[11px] uppercase tracking-widest">What are you listing?</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Listing Purpose</label>
                  <Select value={formData.purpose} onValueChange={(v) => updateForm("purpose", v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-11 text-white focus:ring-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">🏠 Rent</SelectItem>
                      <SelectItem value="buy">🏡 Buy</SelectItem>
                      <SelectItem value="plot">📐 Plot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Property Type</label>
                  <Select value={formData.type} onValueChange={(v) => updateForm("type", v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-11 text-white focus:ring-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="penthouse">Penthouse</SelectItem>
                      <SelectItem value="duplex">Duplex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs text-white/60 uppercase tracking-wider">Property Images</label>
                  <span className="text-[10px] text-white/30">{propertyImages.length} / 5</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {propertyImages.map((img, idx) => (
                    <motion.div layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={idx} className="relative w-16 h-16 rounded-xl border border-white/10 overflow-hidden group">
                      <img src={img} alt="Property" className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(idx)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-500 font-bold">✕</button>
                    </motion.div>
                  ))}
                  {propertyImages.length < 5 && (
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-16 h-16 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center transition-colors hover:bg-white/5">
                      {isUploading ? <div className="w-4 h-4 border-2 border-primary border-t-transparent animate-spin rounded-full" /> : <><Upload className="w-4 h-4 text-white/30" /><span className="text-[9px] text-white/30 mt-1 uppercase font-bold">Add</span></>}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Location Search</label>
                <form onSubmit={handleLocationSearch} className="flex gap-2">
                  <Input value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)} className="bg-white/5 border-white/10 h-11 text-white flex-1" placeholder="Search locality..." />
                  <Button type="submit" size="sm" variant="outline" className="h-11 px-3 border-white/10"><MapPin className="w-4 h-4" /></Button>
                </form>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Price (₹)</label>
                  <Input type="number" value={formData.price} onChange={(e) => updateForm("price", e.target.value)} className="bg-white/5 border-white/10 h-11 text-white" placeholder="e.g. 25000" />
                </div>
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Area (sq ft)</label>
                  <Input type="number" value={formData.sqft} onChange={(e) => updateForm("sqft", e.target.value)} className="bg-white/5 border-white/10 h-11 text-white" placeholder="e.g. 1200" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Bedrooms</label>
                  <Select value={formData.bedrooms} onValueChange={(v) => updateForm("bedrooms", v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-11 text-white"><SelectValue /></SelectTrigger>
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
                  <Select value={formData.bathrooms} onValueChange={(v) => updateForm("bathrooms", v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-11 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Furnishing</label>
                  <Select value={formData.furnished} onValueChange={(v) => updateForm("furnished", v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-11 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="furnished">Furnished</SelectItem><SelectItem value="semi-furnished">Semi-Furnished</SelectItem><SelectItem value="unfurnished">Unfurnished</SelectItem></SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Pet Friendly</label>
                  <Select value={formData.petFriendly} onValueChange={(v) => updateForm("petFriendly", v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-11 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Description</label>
                <Textarea value={formData.description} onChange={(e) => updateForm("description", e.target.value)} className="bg-white/5 border-white/10 min-h-[80px] text-white" placeholder="Tell us more about your place..." />
              </div>

              <Button onClick={() => setStep("owner")} className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold rounded-xl">Continue → Contact Info</Button>
            </div>
          </motion.section>

          {/* Step 2: Owner Contact */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: step === "owner" || step === "preview" ? 1 : 0.3, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`bg-gradient-to-br ${stepColors.owner} bg-black/40 backdrop-blur-2xl border border-white/10 p-7 rounded-3xl shadow-2xl relative mb-8`}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-500/20 rounded-xl"><User className="w-5 h-5 text-emerald-400" /></div>
              <h2 className="text-xl font-bold tracking-tight">Contact Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Full Name</label>
                <Input value={formData.contactName} onChange={(e) => updateForm("contactName", e.target.value)} className="bg-white/5 border-white/10 h-11 text-white" placeholder="John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Phone Number</label>
                  <Input value={formData.contactPhone} onChange={(e) => updateForm("contactPhone", e.target.value)} className="bg-white/5 border-white/10 h-11 text-white" placeholder="+91..." />
                </div>
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Email Address</label>
                  <Input value={formData.contactEmail} onChange={(e) => updateForm("contactEmail", e.target.value)} className="bg-white/5 border-white/10 h-11 text-white" placeholder="john@example.com" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep("property")} className="flex-1 h-11 border-white/10">← Back</Button>
                <Button onClick={() => setStep("preview")} className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700">Preview Listing →</Button>
              </div>
            </div>
          </motion.section>

          {/* Step 3: Preview & Submit */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: step === "preview" ? 1 : 0.2, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`bg-gradient-to-br ${stepColors.preview} bg-black/40 backdrop-blur-2xl border border-white/10 p-7 rounded-3xl shadow-2xl relative`}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-amber-500/20 rounded-xl"><CheckCircle2 className="w-5 h-5 text-amber-400" /></div>
              <h2 className="text-xl font-bold tracking-tight">Ready to List!</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><Home className="w-4 h-4 text-primary" /><span className="text-white/60">Location Set</span></div>
                  <Badge className="bg-emerald-500/10 text-emerald-400">✓</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /><span className="text-white/60">{propertyImages.length} Images</span></div>
                  <Badge className={propertyImages.length > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}>{propertyImages.length > 0 ? "✓" : "!"}</Badge>
                </div>
              </div>
              <Button onClick={handlePublish} className="w-full h-12 bg-gradient-to-r from-primary to-blue-600 font-bold text-lg rounded-xl">🚀 Publish Listing</Button>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
