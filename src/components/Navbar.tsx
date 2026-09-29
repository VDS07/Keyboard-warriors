import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSearch } from "@/context/SearchContext";
import { Map, Calculator, Heart, BarChart3, Building2, Home, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { savedPropertyIds, userRole, setUserRole, userProfile, loginWithGoogleDemo, logout } = useSearch();

  const navLinks = [
    { path: "/map", label: "Live Map", icon: Map },
    { path: "/saved", label: "Saved Homes", icon: Heart, badge: savedPropertyIds.length },
    { path: "/calculator", label: "Commute Calculator", icon: Calculator },
    { path: "/dashboard", label: "Analytics", icon: BarChart3 },
    { path: "/owner", label: "Owner Center", icon: Building2 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-zinc-950/85 border-b border-white/10 px-3 lg:px-8 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo - Links to /map if logged in, or / if logged out */}
        <div className="flex items-center gap-3">
          <Link
            to={userProfile.isLoggedIn ? (userRole === "owner" ? "/owner" : "/map") : "/"}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                Commute Buddy
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  PRO
                </span>
              </span>
              <span className="text-[10px] text-zinc-400 font-medium hidden sm:inline">
                Smart Commute-Aware Housing
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 md:gap-2">
          {navLinks.map(({ path, label, icon: Icon, badge }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`relative px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-purple-400" : ""}`} />
                <span className="hidden md:inline">{label}</span>
                {typeof badge === "number" && badge > 0 && (
                  <Badge className="bg-purple-500 text-white text-[10px] h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full ml-0.5">
                    {badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Role Toggle & Profile */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded-full bg-black/60 border border-white/10 text-[11px]">
            <button
              onClick={() => {
                setUserRole("seeker");
                loginWithGoogleDemo("seeker");
              }}
              className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                userRole === "seeker"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Seeker
            </button>
            <button
              onClick={() => {
                setUserRole("owner");
                loginWithGoogleDemo("owner");
              }}
              className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                userRole === "owner"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Owner
            </button>
          </div>

          {/* Profile Avatar / Indicator & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <img
                src={userProfile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                alt={userProfile.name}
                className="w-7 h-7 rounded-full border border-purple-500/40 object-cover"
              />
              <span className="text-xs text-zinc-300 font-medium max-w-[100px] truncate">
                {userProfile.name.split(" ")[0]}
              </span>
            </div>

            {userProfile.isLoggedIn ? (
              <button
                onClick={() => {
                  logout();
                  toast.info("Logged out successfully");
                  navigate("/login", { replace: true });
                }}
                className="px-2.5 py-1 rounded-xl text-xs font-medium text-zinc-400 hover:text-red-300 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 transition-all flex items-center gap-1"
                title="Log Out of Commute Buddy"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
