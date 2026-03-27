import { useRef, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

const PropertyMap = lazy(() =>
  import("@/components/map/PropertyMap").then((module) => ({
    default: module.PropertyMap,
  })),
);
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SellerPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Map starts as large rectangle -> shrinks to circle on scroll
  const mapWidth = useTransform(scrollYProgress, [0, 0.35], ["100%", "320px"]);
  const mapHeight = useTransform(scrollYProgress, [0, 0.35], ["100%", "320px"]);
  const mapRadius = useTransform(scrollYProgress, [0, 0.35], ["0px", "50%"]);

  return (
    <div ref={containerRef} className="relative bg-zinc-950 text-white font-sans" style={{ height: "250vh" }}>
      
      {/* Sticky Layout: Map Left + Form Right */}
      <div className="sticky top-0 h-screen flex overflow-hidden">
        
        {/* Left: Interactive Map (animates from full to circle) */}
        <div className="relative flex items-center justify-center w-1/2 p-8">
          <motion.div 
            className="relative overflow-hidden shadow-2xl border border-white/10 bg-black"
            style={{
              width: mapWidth,
              height: mapHeight,
              borderRadius: mapRadius,
            }}
          >
            <Suspense fallback={<div className="w-full h-full bg-zinc-900 animate-pulse"></div>}>
              <PropertyMap 
                 workplace={{ label: "New York", lat: 40.7128, lng: -74.0060 }}
                 properties={[]}
                 focusedPropertyId={null}
                 toCurrency={(p) => `$${p}`}
                 onPropertyFocus={() => {}}
              />
            </Suspense>
          </motion.div>
        </div>

        {/* Right: Scrolling Form Panel */}
        <div className="w-1/2 overflow-y-auto h-screen px-8 py-12 scrollbar-hide">

          {/* Section 1: Property Details */}
          <motion.section 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-black/50 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl w-full shadow-2xl relative mb-10"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10"></div>

            <h2 className="text-2xl font-light tracking-tight mb-1">Property Details</h2>
            <p className="text-white/40 text-xs mb-6 uppercase tracking-widest">Fill in your property info</p>
            
            <form className="space-y-4">
              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Location</label>
                <Input className="bg-white/5 border-white/10 h-11 text-white placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="Enter full address..." />
              </div>
              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Price</label>
                <Input type="number" className="bg-white/5 border-white/10 h-11 text-white placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="e.g. ₹25,000 / month" />
              </div>
              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Ownership</label>
                <Select>
                  <SelectTrigger className="bg-white/5 border-white/10 h-11 text-white focus:ring-primary/50">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freehold">Freehold</SelectItem>
                    <SelectItem value="leasehold">Leasehold</SelectItem>
                    <SelectItem value="coop">Co-operative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Nearby Landmarks</label>
                <Input className="bg-white/5 border-white/10 h-11 text-white placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="Metro station, hospital..." />
              </div>
            </form>
          </motion.section>

          {/* Section 2: Owner's Contact Info */}
          <motion.section 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="bg-black/50 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl w-full shadow-2xl relative"
          >
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -z-10"></div>
            
            <h2 className="text-2xl font-light tracking-tight mb-1">Owner's Contact Info</h2>
            <p className="text-white/40 text-xs mb-6 uppercase tracking-widest">How buyers can reach you</p>
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigate('/owner'); }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Name</label>
                  <Input className="bg-white/5 border-white/10 h-11 text-white placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="Full Name" />
                </div>
                <div>
                  <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Phone No.</label>
                  <Input type="tel" className="bg-white/5 border-white/10 h-11 text-white placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="+91..." />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">House Type</label>
                <Select>
                  <SelectTrigger className="bg-white/5 border-white/10 h-11 text-white focus:ring-primary/50">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="1bhk">1 BHK</SelectItem>
                    <SelectItem value="2bhk">2 BHK</SelectItem>
                    <SelectItem value="3bhk">3 BHK</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="penthouse">Penthouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Land Description</label>
                <Textarea className="bg-white/5 border-white/10 min-h-[100px] text-white resize-none p-3 placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="Describe the property's best features..." />
              </div>
              
              <Button type="submit" className="w-full h-12 mt-2 text-lg bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all active:scale-95 group relative overflow-hidden">
                <span className="relative z-10">Submit & View Dashboard</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
              </Button>
            </form>
          </motion.section>

        </div>
      </div>
    </div>
  );
}
