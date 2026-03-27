import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Eye, MousePointerClick, TrendingUp, Building2, MapPin } from "lucide-react";

type OwnerStats = {
  totalProperties: number;
  totalViews: number;
  totalInquiries: number;
  activeListings: number;
};

type Property = {
  id: number;
  title: string;
  price: number;
  lat: number;
  lng: number;
  views: number;
  inquiries: number;
};

const mockChartData = [
  { name: "Mon", views: 40, inquiries: 2 },
  { name: "Tue", views: 30, inquiries: 1 },
  { name: "Wed", views: 200, inquiries: 10 },
  { name: "Thu", views: 278, inquiries: 39 },
  { name: "Fri", views: 189, inquiries: 48 },
  { name: "Sat", views: 239, inquiries: 38 },
  { name: "Sun", views: 349, inquiries: 43 },
];

export default function OwnerDashboard() {
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/owner/stats")
      .then(res => res.json())
      .then(setStats)
      .catch(console.error);

    fetch("http://localhost:3001/api/properties")
      .then(res => res.json())
      .then(setProperties)
      .catch(console.error);
  }, []);

  if (!stats) return <div className="p-8 flex items-center justify-center">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Owner Control Center</h1>
            <p className="text-muted-foreground mt-1">Manage your listings, analyze demand, and optimize pricing.</p>
          </div>
          <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/10 text-primary border-primary/20">
            Smart Selling Assistant Active
          </Badge>
        </div>

        {/* Top Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews}</div>
              <p className="text-xs text-muted-foreground"><span className="text-emerald-500 font-medium">+20.1%</span> from last month</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInquiries}</div>
              <p className="text-xs text-muted-foreground"><span className="text-emerald-500 font-medium">+15%</span> from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeListings}</div>
              <p className="text-xs text-muted-foreground">Across 3 major zones</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{(stats.totalInquiries / stats.totalViews * 100).toFixed(1)}%</div>
              <p className="text-xs text-primary/80">Avg. industry rate: 4.2%</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Listings */}
        <div className="grid gap-6 md:grid-cols-7 border-t border-border/50 pt-8">
          
          {/* Chart Section */}
          <Card className="md:col-span-4 bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Traffic Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Properties List */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="text-lg font-semibold tracking-tight">Your Properties</h3>
            <div className="space-y-3">
              {properties.map(property => (
                <Card key={property.id} className="group hover:border-primary/50 transition-colors cursor-pointer bg-card/40">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{property.title}</h4>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          Commute Target: Midtown
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono">${property.price.toLocaleString()}</Badge>
                    </div>
                    
                    <div className="flex justify-between items-end mt-2">
                       <div className="space-y-1">
                         <div className="text-xs text-muted-foreground">Views / Inquiries</div>
                         <div className="font-medium text-sm">{property.views} / {property.inquiries}</div>
                       </div>
                       
                       {property.inquiries > 40 ? 
                         <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">High Demand 🔥</Badge> :
                         <Badge variant="secondary" className="text-xs">Normal Demand</Badge>
                       }
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
