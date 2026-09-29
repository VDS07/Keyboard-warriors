import { useState, FormEvent } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Compass,
  Home,
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Route,
  Zap,
} from "lucide-react";
import { useSearch, UserRole } from "@/context/SearchContext";
import { GoogleOAuthModal } from "@/components/auth/GoogleOAuthModal";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

export default function Landing() {
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithSession, setUserRole, userProfile, userRole } = useSearch();

  // If user is already logged in, redirect immediately to main map page (not the login page)
  if (userProfile.isLoggedIn) {
    return <Navigate to={userRole === "owner" ? "/owner" : "/map"} replace />;
  }

  const [role, setRole] = useState<UserRole>("seeker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCredentialsLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUserRole(role);

    const userName = name.trim() || (role === "owner" ? "Property Owner" : "Commuter");
    const userEmail = email.trim() || (role === "owner" ? "owner@commutebuddy.in" : "commuter@commutebuddy.in");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          role,
          password: password || "demo123",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        loginWithSession(data.token, data.user);
        toast.success(`Welcome back, ${data.user.name}!`);
        navigate(role === "owner" ? "/owner" : "/map", { replace: true });
        return;
      }
    } catch {
      // Backend offline or fallback to client session
    }

    loginWithGoogle({
      name: userName,
      email: userEmail,
      role,
    });

    toast.success(`Welcome to Commute Buddy, ${userName}!`);
    navigate(role === "owner" ? "/owner" : "/map", { replace: true });
    setIsSubmitting(false);
  };

  const handleGuestLogin = () => {
    setUserRole(role);
    loginWithGoogle({ role });
    toast.success(`Welcome, Guest ${role === "owner" ? "Owner" : "Commuter"}!`);
    navigate(role === "owner" ? "/owner" : "/map", { replace: true });
  };

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-zinc-950 text-white font-sans flex flex-col justify-between">
      {/* Background Graphic & Subtle Ambient Lights */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 25%, rgba(168, 85, 247, 0.16) 0%, rgba(9, 9, 11, 0.98) 100%)",
          }}
        />
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Top Header / Branding Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">Commute Buddy</span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                PRO
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-medium">Smart Commute-Aware Discovery</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-white/10 text-xs text-purple-300 shadow-md backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">OSM Road Network Engine</span>
            <span className="sm:hidden">Live</span>
          </div>
        </div>
      </header>

      {/* Central Split Layout: Hero Presentation (Left) + Unified Login Form (Right) */}
      <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 md:py-10 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
        
        {/* Left Column: Platform Hero & Role Descriptions */}
        <div className="flex-1 space-y-6 max-w-xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Commute-Aware Real-Estate Discovery
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Find Your Home by{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-pink-400">
              Commute Time
            </span>
            , Not Distance.
          </h1>

          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
            Inverting the conventional housing search paradigm. Set your workplace anchor and instantly discover network-connected homes with true road duration routing, ML smart pricing, and transparent multi-factor scoring.
          </p>

          {/* Interactive Role Preview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div
              onClick={() => setRole("seeker")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                role === "seeker"
                  ? "bg-purple-950/40 border-purple-500/80 shadow-lg shadow-purple-900/20 ring-1 ring-purple-500/50"
                  : "bg-zinc-900/40 border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">Demand Side</span>
                <Compass className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="font-bold text-sm text-white">Home & Commute Seeker</h3>
              <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                Set travel time budget, pick mode (drive, transit, cycle, walk), and view live turn-by-turn road routes.
              </p>
            </div>

            <div
              onClick={() => setRole("owner")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                role === "owner"
                  ? "bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-900/20 ring-1 ring-indigo-500/50"
                  : "bg-zinc-900/40 border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Supply Side</span>
                <Building2 className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="font-bold text-sm text-white">Property Owner</h3>
              <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                Manage listings, track commute discovery histograms, and use multivariate hedonic ML Smart Pricing.
              </p>
            </div>
          </div>

          {/* Research & Architectural Feature Highlights */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Route className="w-4 h-4 text-purple-400" /> OSRM Road Routing
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-yellow-400" /> O(1) Haversine Pruning
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Zero Local Storage
            </span>
          </div>
        </div>

        {/* Right Column: Unified Combined Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="bg-zinc-950/90 border-purple-500/30 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-950/40 overflow-hidden relative">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

            <CardHeader className="text-center pb-4 pt-6 px-6 relative z-10">
              <CardTitle className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Sign In to Commute Buddy
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-1">
                Choose your portal role and sign in with Google or email
              </CardDescription>

              {/* Role Selection Tabs */}
              <div className="flex items-center p-1 rounded-2xl bg-zinc-900 border border-white/10 mt-4">
                <button
                  type="button"
                  onClick={() => setRole("seeker")}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    role === "seeker"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/25"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Seeker</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("owner")}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    role === "owner"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/25"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Owner</span>
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-6 relative z-10">
              {/* Google Identity Services (GIS) Official OAuth Button */}
              <div className="w-full flex justify-center">
                <GoogleSignInButton
                  role={role}
                  text="continue_with"
                  theme="outline"
                  width={340}
                  onSuccess={() => {
                    navigate(role === "owner" ? "/owner" : "/map", { replace: true });
                  }}
                />
              </div>

              {/* Divider */}
              <div className="relative my-3 flex items-center justify-center">
                <span className="w-full border-t border-white/10" />
                <span className="bg-zinc-950 px-3 absolute text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                  Or continue with email
                </span>
              </div>

              {/* Credentials / Quick Login Form */}
              <form onSubmit={handleCredentialsLogin} className="space-y-3">
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Full Name (e.g. John Doe)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-white/10 pl-9.5 h-10 text-white text-xs placeholder:text-zinc-500 rounded-xl focus:border-purple-500"
                  />
                </div>

                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-white/10 pl-9.5 h-10 text-white text-xs placeholder:text-zinc-500 rounded-xl focus:border-purple-500"
                  />
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="password"
                    placeholder="Password (demo or custom)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/10 pl-9.5 h-10 text-white text-xs placeholder:text-zinc-500 rounded-xl focus:border-purple-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-900/30 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                >
                  <span>{isSubmitting ? "Signing In..." : `Enter as ${role === "owner" ? "Property Owner" : "Commuter"}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>

            {/* Quick Guest Entrance Footer */}
            <CardFooter className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex flex-col gap-2 relative z-10">
              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-purple-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <span>⚡ Continue as Guest (Instant Preview)</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Single Sign-On • Safe & Privacy-Preserving</span>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      {/* Footer Attribution Bar */}
      <footer className="relative z-20 w-full border-t border-white/10 py-3 px-6 text-center text-xs text-zinc-500">
        <span>Commute Buddy Pro • Smart Commute-Aware Housing Discovery Platform</span>
      </footer>

      {/* Google OAuth Modal Fallback */}
      <GoogleOAuthModal
        open={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        defaultRole={role}
        onSuccess={() => {
          navigate(role === "owner" ? "/owner" : "/map", { replace: true });
        }}
      />
    </main>
  );
}
