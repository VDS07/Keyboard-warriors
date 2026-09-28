import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, UserCircle, Compass, Home, BookOpen, ShieldCheck } from "lucide-react";
import { useSearch } from "@/context/SearchContext";
import { ResearchPaperModal } from "@/components/ResearchPaperModal";

export default function Landing() {
  const [step, setStep] = useState<"login" | "transition" | "role" | "zoomOut">("login");
  const [paperModalOpen, setPaperModalOpen] = useState(false);
  const navigate = useNavigate();
  const { setUserRole, loginWithGoogleDemo } = useSearch();

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    loginWithGoogleDemo("seeker");
    setStep("transition");
    setTimeout(() => setStep("role"), 800);
  };

  const handleGoogleOAuth = () => {
    loginWithGoogleDemo("seeker");
    setStep("transition");
    setTimeout(() => setStep("role"), 800);
  };

  const handleRoleSelect = (role: "seeker" | "owner") => {
    setUserRole(role);
    loginWithGoogleDemo(role);
    setStep("zoomOut");
    setTimeout(() => {
      if (role === "seeker") navigate("/map");
      if (role === "owner") navigate("/owner");
    }, 600);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-zinc-950 text-white font-sans">
      
      {/* Background Graphic with Gradient */}
      <div 
        className={`absolute inset-0 transition-all duration-1000 origin-center ${
          step === "zoomOut" ? "blur-none opacity-100 scale-100" : "blur-sm opacity-40 scale-110"
        }`} 
        style={{
          backgroundImage: "radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.15) 0%, rgba(9, 9, 11, 0.95) 100%)",
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
      </div>

      {/* Top Research Badge & Citation Button */}
      <div className="absolute top-4 left-6 z-30 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
            <Home className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block">Commute Buddy</span>
            <span className="text-[10px] text-zinc-400">TGPCET Research CSE</span>
          </div>
        </div>

        <button
          onClick={() => setPaperModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/50 border border-purple-500/30 text-xs text-purple-300 hover:bg-purple-900/50 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          <span>Read Paper</span>
        </button>
      </div>

      {/* 1. Google OAuth 2.0 / Login Screen (Section VI) */}
      <AnimatePresence>
        {step === "login" && (
          <motion.div 
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            className="absolute inset-0 flex items-center justify-center z-10 p-4"
          >
            <div className="bg-zinc-950/85 backdrop-blur-2xl border border-purple-500/30 p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-44 h-44 bg-purple-600/20 rounded-full blur-3xl"></div>
               <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-indigo-600/20 rounded-full blur-3xl"></div>
               
               <div className="text-center mb-6 relative z-10 space-y-1">
                 <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                   Commute Buddy
                 </h1>
                 <p className="text-zinc-400 text-xs">
                   Smart Commute-Aware Housing & Property Discovery
                 </p>
               </div>

               {/* Section VI Google Sign-In RFC 6749 Flow */}
               <div className="space-y-4 relative z-10">
                 <button
                   onClick={handleGoogleOAuth}
                   className="w-full h-12 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-95"
                 >
                   <svg className="w-4 h-4" viewBox="0 0 24 24">
                     <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                     <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                     <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                     <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                   </svg>
                   <span>Sign in with Google OAuth 2.0</span>
                 </button>

                 <div className="relative my-4 flex items-center justify-center text-xs uppercase text-zinc-500">
                   <span className="w-full border-t border-white/10"></span>
                   <span className="bg-zinc-950 px-2 absolute text-[10px]">Or enter credentials</span>
                 </div>

                 <form onSubmit={handleLogin} className="space-y-3">
                   <Input required type="text" defaultValue="Vallabh Shingroop" placeholder="Name" className="bg-white/5 border-white/10 h-10 text-white text-xs placeholder:text-zinc-500 rounded-xl" />
                   <Input required type="email" defaultValue="vallabh@tgpcet.ac.in" placeholder="Email" className="bg-white/5 border-white/10 h-10 text-white text-xs placeholder:text-zinc-500 rounded-xl" />
                   
                   <Button type="submit" className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all active:scale-95 shadow-lg shadow-purple-600/30">
                     Access Platform Session (RFC 6749)
                   </Button>
                 </form>

                 <div className="flex items-center gap-1.5 justify-center text-[10px] text-zinc-500 pt-1">
                   <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                   <span>OAuth 2.0 Authorization Code Flow • Zero Password Storage</span>
                 </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Aura Transition Ball */}
      <AnimatePresence>
        {(step === "transition" || step === "role") && (
          <motion.div 
            initial={{ width: 0, height: 0, opacity: 0, top: "50%", left: "50%" }}
            animate={{ 
              width: step === "role" ? "150vw" : 100, 
              height: step === "role" ? "150vw" : 100, 
              opacity: step === "role" ? 0.9 : 1,
              top: "50%" 
            }}
            exit={{ width: "200vw", height: "200vw", opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bg-purple-600/30 blur-3xl z-0 pointer-events-none rounded-full"
            style={{ x: "-50%", y: "-50%" }}
          />
        )}
      </AnimatePresence>

      {/* 3. Two-Sided Role Selection Screen (Section VI & XIII) */}
      <AnimatePresence>
        {step === "role" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(20px)" }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-zinc-950/85 backdrop-blur-md"
          >
            <div className="w-full max-w-4xl bg-zinc-950 border border-purple-500/30 rounded-[32px] p-6 md:p-12 shadow-2xl relative overflow-hidden">
              
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-purple-400 mb-1">
                    Two-Sided Marketplace (Section VI)
                  </p>
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                    Choose Your Role
                  </h2>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1 flex items-center gap-2">
                  <span className="text-xs font-mono text-purple-300">vallabh@tgpcet.ac.in</span>
                </div>
              </div>

              {/* CARD OPTIONS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                
                {/* ROLE A: COMMUTE SEEKER (Section VII) */}
                <button 
                  onClick={() => handleRoleSelect("seeker")}
                  className="group relative text-left p-6 md:p-8 rounded-3xl bg-zinc-900/80 border border-purple-500/30 hover:border-purple-500 hover:shadow-[0_0_40px_rgba(168,85,247,0.25)] transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400">Demand Side</span>
                    <Compass className="w-6 h-6 text-purple-400 group-hover:rotate-45 transition-transform" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Home / Commute Seeker</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Set your workplace anchor, define your commute time budget (T_max), and explore the full feasible set of properties with OSRM turn-by-turn road routes.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-purple-300">
                    <span>Enter Live Map</span> →
                  </div>
                </button>

                {/* ROLE B: PROPERTY OWNER (Section XIII & XV) */}
                <button 
                  onClick={() => handleRoleSelect("owner")}
                  className="group relative text-left p-6 md:p-8 rounded-3xl bg-zinc-900/80 border border-white/10 hover:border-purple-500/80 hover:shadow-[0_0_40px_rgba(168,85,247,0.25)] transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400">Supply Side</span>
                    <Building2 className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Property Owner</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Access the Owner Control Center, inspect commute-discovery distributions, receive seeker inquiries, and use Hedonic ML Smart Pricing.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-indigo-300">
                    <span>Open Owner Center</span> →
                  </div>
                </button>

              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <button
                  onClick={() => setPaperModalOpen(true)}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span>Research Paper & System Architecture</span>
                </button>

                <button 
                  onClick={() => setStep("login")}
                  className="text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Research Paper Modal */}
      <ResearchPaperModal open={paperModalOpen} onClose={() => setPaperModalOpen(false)} />
    </main>
  );
}
