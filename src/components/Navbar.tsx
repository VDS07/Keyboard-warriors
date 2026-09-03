import { Link, useLocation } from "react-router-dom";
import { useSearch } from "@/context/SearchContext";
import { Map, Calculator, Heart, BarChart3, Building2, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Navbar = () => {
  const location = useLocation();
  const { savedPropertyIds } = useSearch();

  const navLinks = [
    { path: "/map", label: "Live Map", icon: Map },
    { path: "/saved", label: "Saved Homes", icon: Heart, badge: savedPropertyIds.length },
    { path: "/calculator", label: "Commute Calculator", icon: Calculator },
    { path: "/dashboard", label: "Analytics", icon: BarChart3 },
    { path: "/owner", label: "Owner Center", icon: Building2 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-zinc-950/80 border-b border-white/10 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Commute Buddy
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                PRO
              </span>
            </span>
            <span className="text-[10px] text-zinc-400 font-medium hidden sm:inline">
              Commute-Aware Housing
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 md:gap-2">
          {navLinks.map(({ path, label, icon: Icon, badge }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`relative px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all flex items-center gap-2 ${
                  isActive
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-purple-400" : ""}`} />
                <span className="hidden sm:inline">{label}</span>
                {typeof badge === "number" && badge > 0 && (
                  <Badge className="bg-purple-500 text-white text-[10px] h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full ml-0.5">
                    {badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
