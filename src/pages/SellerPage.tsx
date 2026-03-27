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

export default function SellerPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const mapWidth = useTransform(scrollYProgress, [0, 0.4], ["60vw", "350px"]);
  const mapHeight = useTransform(scrollYProgress, [0, 0.4], ["85vh", "350px"]);
  const mapRadius = useTransform(scrollYProgress, [0, 0.4], ["24px", "50%"]);
  // Keep map somewhat centered on the left, but move it up slightly as circle
  const mapY = useTransform(scrollYProgress, [0, 0.4], ["0vh", "-15vh"]);

  return (
    <div ref={containerRef} className="relative bg-zinc-950 text-white font-sans flex" style={{ height: "200vh" }}>
      
      {/* Sticky Left Column for the Map */}
      <div className="sticky top-0 h-screen w-1/2 flex items-center justify-center p-8 pointer-events-none z-20">
        <motion.div 
          className="relative overflow-hidden shadow-2xl pointer-events-auto border border-white/10 bg-black"
          style={{
            width: mapWidth,
            height: mapHeight,
            borderRadius: mapRadius,
            y: mapY,
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
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05)_100%)] bg-[length:40px_40px]"></div>
        </motion.div>
      </div>

      {/* Scrolling Right Column for Forms */}
      <div className="absolute top-0 right-0 w-full md:w-1/2 flex flex-col px-8 md:px-16 pt-[15vh] pb-[30vh] gap-[60vh] z-10">
        
        {/* Section 1: Property Info */}
        <section className="bg-black/60 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl w-full shadow-2xl relative">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10"></div>
          
          <h2 className="text-3xl font-light tracking-tight mb-2">Property Details</h2>
          <p className="text-white/50 text-sm mb-8 uppercase tracking-widest">All your info of property</p>
          
          <form className="space-y-5 relative z-10">
            <div>
              <label className="text-xs text-white/60 uppercase tracking-wider mb-2 block">Location</label>
              <Input className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="Enter full address..." />
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase tracking-wider mb-2 block">Price</label>
              <Input type="number" className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="e.g. 25000" />
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase tracking-wider mb-2 block">Ownership Type</label>
              <Input className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="Freehold, Leasehold..." />
            </div>
          </form>
        </section>

        {/* Section 2: Owner Contact Info */}
        <section className="bg-black/60 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl w-full shadow-2xl relative mt-32">
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -z-10"></div>
          
          <h2 className="text-3xl font-light tracking-tight mb-2">Owner's Contact Info</h2>
          <p className="text-white/50 text-sm mb-8 uppercase tracking-widest">Identify Yourself</p>
          
          <form className="space-y-5 relative z-10" onSubmit={(e) => { e.preventDefault(); navigate('/owner'); }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-2 block">Name</label>
                <Input className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="Full Name" />
              </div>
              <div>
                <label className="text-xs text-white/60 uppercase tracking-wider mb-2 block">Phone No.</label>
                <Input type="tel" className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="+91..." />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase tracking-wider mb-2 block">House Type</label>
              <Input className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="2BHK, Villa, Studio..." />
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase tracking-wider mb-2 block">Land Description</label>
              <Textarea className="bg-white/5 border-white/10 min-h-[120px] text-white resize-none p-4 placeholder:text-white/30 focus-visible:ring-primary/50" placeholder="Describe the property's best features..." />
            </div>
            
            <Button type="submit" className="w-full h-12 mt-4 text-lg bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all">
              Submit & View Dashboard
            </Button>
          </form>
        </section>

      </div>
    </div>
  );
}
