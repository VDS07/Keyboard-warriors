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
      if (role === "owner") navigate("/owner");
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

      {/* 3. Role Selection Screen */}
      <AnimatePresence>
        {step === "role" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(20px)" }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute inset-0 z-20 flex flex-col"
          >
            <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center pointer-events-none z-30">
               <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 uppercase tracking-widest text-sm font-semibold mb-2">
                 Choose who you are
               </div>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row w-full h-full">
              {/* Property Buyer Half */}
              <button 
                onClick={() => handleRoleSelect("buyer")}
                className="flex-1 relative group overflow-hidden border-b md:border-b-0 md:border-r border-white/10 bg-black/30 hover:bg-black/50 transition-colors backdrop-blur-sm flex items-center justify-center cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="flex flex-col items-center gap-6 transform group-hover:scale-110 transition-transform duration-500">
                  <div className="p-6 bg-white/5 rounded-full border border-white/10 group-hover:border-blue-500/50 transition-colors">
                    <UserCircle className="w-16 h-16 text-blue-400" />
                  </div>
                  <span className="text-4xl md:text-5xl font-light tracking-tight text-white/90">Property Buyer</span>
                </div>
              </button>

              {/* Property Owner Half */}
              <button 
                 onClick={() => handleRoleSelect("owner")}
                 className="flex-1 relative group overflow-hidden bg-black/30 hover:bg-black/50 transition-colors backdrop-blur-sm flex items-center justify-center cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="flex flex-col items-center gap-6 transform group-hover:scale-110 transition-transform duration-500">
                  <div className="p-6 bg-white/5 rounded-full border border-white/10 group-hover:border-emerald-500/50 transition-colors">
                    <Building2 className="w-16 h-16 text-emerald-400" />
                  </div>
                  <span className="text-4xl md:text-5xl font-light tracking-tight text-white/90">Property Owner</span>
                </div>
              </button>
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
