import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, UserCircle } from "lucide-react";

export default function Landing() {
  const [step, setStep] = useState<"login" | "transition" | "role" | "zoomOut">("login");
  const [selectedRole, setSelectedRole] = useState<"buyer" | "owner" | null>(null);
  const navigate = useNavigate();

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setStep("transition");
    setTimeout(() => setStep("role"), 1000); // Wait for aura to expand
  };

  const handleRoleSelect = (role: "buyer" | "owner") => {
    setSelectedRole(role);
    setStep("zoomOut");
    setTimeout(() => {
      if (role === "buyer") navigate("/map");
      if (role === "owner") navigate("/seller");
    }, 600); // Wait for zoom out
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-zinc-950 text-white font-sans">
      
      {/* Blurred Map Background */}
      <div 
        className={`absolute inset-0 transition-all duration-1000 origin-center ${
          step === "zoomOut" ? "blur-none opacity-100 scale-100" : "blur-xl opacity-30 scale-110"
        }`} 
        style={{
          backgroundImage: "url('/placeholder.svg')", 
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {/* Slanting lines overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_25%,rgba(255,255,255,0.03)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.03)_75%,rgba(255,255,255,0.03)_100%)] bg-[length:40px_40px]"></div>
      </div>

      {/* 1. Login Screen */}
      <AnimatePresence>
        {step === "login" && (
          <motion.div 
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            className="absolute inset-0 flex items-center justify-center z-10 p-4"
          >
            <div className="bg-black/50 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
               <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
               
               <div className="text-center mb-8 relative z-10">
                 <h1 className="text-3xl font-bold tracking-tight mb-2">Commute Buddy</h1>
                 <p className="text-white/60 text-sm">Enter your details to continue</p>
               </div>
               
               <form onSubmit={handleLogin} className="space-y-4 relative z-10">
                 <Input required type="text" placeholder="Name" className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/40 focus-visible:ring-primary/50" />
                 <Input required type="email" placeholder="Email" className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/40 focus-visible:ring-primary/50" />
                 <Input required type="tel" placeholder="Phone No." className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/40 focus-visible:ring-primary/50" />
                 
                 <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-lg mt-2 transition-all active:scale-95 group relative overflow-hidden">
                   <span className="relative z-10">Login</span>
                   <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                 </Button>
               </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Aura Transition Ball */}
      <AnimatePresence>
        {(step === "transition" || step === "role") && (
          <motion.div 
            initial={{ width: 0, height: 0, opacity: 0, top: "65%", left: "50%" }}
            animate={{ 
              width: step === "role" ? "150vw" : 100, 
              height: step === "role" ? "150vw" : 100, 
              opacity: step === "role" ? 0.9 : 1,
              top: "50%" 
            }}
            exit={{ width: "200vw", height: "200vw", opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bg-primary/40 blur-2xl z-0 pointer-events-none rounded-full"
            style={{ x: "-50%", y: "-50%" }}
          />
        )}
      </AnimatePresence>

      {/* 3. Role Selection Screen (MODERN MODAL) */}
      <AnimatePresence>
        {step === "role" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(20px)" }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-md"
          >
            {/* Modal Container */}
            <div className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
              
              {/* Background gradient subtle */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
              
              {/* TOP HEADER */}
              <div className="flex items-start justify-between mb-12">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-1">Step 2</p>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">Choose your journey</h2>
                </div>
                {/* User email badge */}
                <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2">
                  <span className="text-[11px] font-medium text-white/50 lowercase">vallabhshingroop@gmail.com</span>
                </div>
              </div>

              {/* CARD OPTIONS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                
                {/* OPTION A: PROPERTY OWNER */}
                <button 
                  onClick={() => handleRoleSelect("owner")}
                  className="group relative text-left p-8 rounded-[24px] bg-[#111111] border border-white/5 hover:border-purple-500/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(168,85,247,0.1)] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[24px]"></div>
                  <p className="text-[10px] uppercase tracking-widest font-black text-white/30 mb-4 group-hover:text-purple-400/50 transition-colors">Option A</p>
                  <h3 className="text-2xl font-bold text-white mb-4">Property Owner</h3>
                  <p className="text-sm text-white/40 leading-relaxed font-medium">
                    List properties, track buyer interest, and manage responses.
                  </p>
                </button>

                {/* OPTION B: PROPERTY BUYER */}
                <button 
                  onClick={() => handleRoleSelect("buyer")}
                  className="group relative text-left p-8 rounded-[24px] border border-purple-500/20 bg-[#111111] hover:border-purple-500/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(168,85,247,0.1)] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-500 rounded-[24px]"></div>
                  <p className="text-[10px] uppercase tracking-widest font-black text-white/30 mb-4 group-hover:text-purple-400/50 transition-colors">Option B</p>
                  <h3 className="text-2xl font-bold text-white mb-4 text-purple-100">Property Buyer</h3>
                  <p className="text-sm text-white/40 leading-relaxed font-medium">
                    Explore commute-aware homes and jump into the live map.
                  </p>
                </button>
              </div>

              {/* LOGOUT BUTTON */}
              <div className="flex justify-end">
                <button 
                  onClick={() => setStep("login")}
                  className="bg-black hover:bg-zinc-900 border border-white/5 px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-all active:scale-95"
                >
                  Logout
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Final zoom out transition overlay */}
      <AnimatePresence>
        {step === "zoomOut" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 z-50 bg-background pointer-events-none"
          />
        )}
      </AnimatePresence>
      
    </main>
  );
}
