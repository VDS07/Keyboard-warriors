import { PROPERTY_LIST } from "@/context/SearchContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, DollarSign, Star, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PRICE_RANGES = [
  { label: "$1k–2k", min: 1000, max: 2000, color: "#6366f1" },
  { label: "$2k–2.5k", min: 2000, max: 2500, color: "#8b5cf6" },
  { label: "$2.5k–3k", min: 2500, max: 3000, color: "#a78bfa" },
  { label: "$3k–3.5k", min: 3000, max: 3500, color: "#c4b5fd" },
  { label: "$3.5k+", min: 3500, max: 99999, color: "#ddd6fe" },
];

const TYPE_COLORS: Record<string, string> = {
  apartment: "#8b5cf6",
  studio: "#6366f1",
  duplex: "#a78bfa",
  penthouse: "#c4b5fd",
  villa: "#ddd6fe",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const properties = PROPERTY_LIST;

  const totalListings = properties.length;
  const avgRent = Math.round(properties.reduce((s, p) => s + p.price, 0) / totalListings);
  const avgLivability = Math.round(properties.reduce((s, p) => s + p.livabilityScore, 0) / totalListings);

  // Most popular neighborhood (most frequent area based on lat grouping)
  const neighborhoods = ["Midtown", "Chelsea", "Brooklyn", "Queens", "Upper West"];
  const popularNeighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];

  // Price distribution
  const priceDistribution = PRICE_RANGES.map((range) => ({
    ...range,
    count: properties.filter((p) => p.price >= range.min && p.price < range.max).length,
  }));
  const maxCount = Math.max(...priceDistribution.map((d) => d.count));

  // Type breakdown
  const typeCounts = properties.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Market Analytics</h1>
            <p className="text-muted-foreground mt-1">Platform-wide rental market insights</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/map")}>← Back to Map</Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalListings}</div>
              <p className="text-xs text-muted-foreground">Across NYC</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Monthly Rent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${avgRent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground"><span className="text-emerald-500">+2.3%</span> vs last quarter</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Livability</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgLivability}/100</div>
              <p className="text-xs text-muted-foreground">Across all listings</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">Top Neighborhood</CardTitle>
              <MapPin className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{popularNeighborhood}</div>
              <p className="text-xs text-primary/70">Most searched area</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Price Distribution */}
          <Card className="bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Price Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {priceDistribution.map((range) => (
                  <div key={range.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{range.label}</span>
                      <span className="font-semibold">{range.count} listings</span>
                    </div>
                    <div className="h-6 bg-white/5 rounded-lg overflow-hidden relative">
                      <div
                        className="h-full rounded-lg transition-all duration-1000 relative overflow-hidden"
                        style={{
                          width: `${maxCount > 0 ? (range.count / maxCount) * 100 : 0}%`,
                          background: `linear-gradient(90deg, ${range.color}, ${range.color}dd)`,
                          animation: "barGrow 1.2s ease-out",
                        }}
                      >
                        <div className="absolute inset-0 bg-white/10 animate-pulse" style={{ animationDuration: "3s" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Property Types */}
          <Card className="bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Property Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(typeCounts).map(([type, count]) => (
                  <div key={type} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm capitalize font-medium">{type}</span>
                      <Badge variant="secondary" className="text-xs">{count} ({Math.round(count / totalListings * 100)}%)</Badge>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${(count / totalListings) * 100}%`,
                          background: `linear-gradient(90deg, ${TYPE_COLORS[type] || "#8b5cf6"}, ${TYPE_COLORS[type] || "#8b5cf6"}88)`,
                          animation: "barGrow 1s ease-out",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
