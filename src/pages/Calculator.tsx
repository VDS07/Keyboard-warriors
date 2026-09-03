import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator as CalcIcon, Clock, Leaf, DollarSign, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

export default function Calculator() {
  const [rent, setRent] = useState<number>(25000);
  const [oneWayKm, setOneWayKm] = useState<number>(12);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(5);
  const [transportMode, setTransportMode] = useState<"drive" | "transit" | "cycle" | "walk">("drive");
  const [fuelCostPerLitre, setFuelCostPerLitre] = useState<number>(105);
  const [mileageKmPerLitre, setMileageKmPerLitre] = useState<number>(14);

  // Calculations
  const totalKmPerDay = oneWayKm * 2;
  const totalKmPerMonth = totalKmPerDay * daysPerWeek * 4.33; // avg weeks/month
  
  const calculateMonthlyCommuteCost = () => {
    if (transportMode === "drive") {
      const fuelLiters = totalKmPerMonth / mileageKmPerLitre;
      const fuelExpense = fuelLiters * fuelCostPerLitre;
      const maintenance = fuelExpense * 0.2; // ~20% maintenance/wear & tear
      return Math.round(fuelExpense + maintenance);
    }
    if (transportMode === "transit") {
      // Estimated transit fare ~ ₹3.5 per km
      return Math.round(totalKmPerMonth * 3.5);
    }
    return 0; // cycle or walk
  };

  const monthlyCommuteCost = calculateMonthlyCommuteCost();
  const totalMonthlyCost = rent + monthlyCommuteCost;

  // Speed estimates (km/h)
  const speedKmh = { drive: 30, transit: 20, cycle: 15, walk: 4.5 }[transportMode];
  const oneWayMinutes = Math.round((oneWayKm / speedKmh) * 60);
  const dailyMinutesSpent = oneWayMinutes * 2;
  const yearlyHoursSpent = Math.round((dailyMinutesSpent * daysPerWeek * 52) / 60);

  // Carbon Footprint (kg CO2 per year)
  // Car ~ 0.12 kg CO2 / km, Transit ~ 0.04 kg CO2 / km, Cycle/Walk ~ 0
  const co2Factor = { drive: 0.12, transit: 0.04, cycle: 0, walk: 0 }[transportMode];
  const yearlyKm = totalKmPerMonth * 12;
  const yearlyCo2Kg = Math.round(yearlyKm * co2Factor);

  const comparisonData = [
    { name: "Current Rent", amount: rent, fill: "#a855f7" },
    { name: "Monthly Commute", amount: monthlyCommuteCost, fill: "#ec4899" },
    { name: "Total Outflow", amount: totalMonthlyCost, fill: "#3b82f6" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Commute & Rent Financial Engine
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            Calculate True Living Cost
          </h1>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            Factor in hidden travel expenses, annual travel hours, and environmental impact before choosing your home.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Form (5 cols) */}
          <Card className="lg:col-span-5 bg-zinc-900/60 border-white/10 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                <CalcIcon className="w-5 h-5 text-purple-400" /> Input Parameters
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Adjust your daily travel details to compute trade-offs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-300">
                  Monthly Rent (₹)
                </Label>
                <Input
                  type="number"
                  value={rent}
                  onChange={(e) => setRent(Number(e.target.value) || 0)}
                  className="bg-zinc-950/70 border-white/10 text-white font-medium h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-300">
                    One-Way Distance (km)
                  </Label>
                  <Input
                    type="number"
                    value={oneWayKm}
                    onChange={(e) => setOneWayKm(Number(e.target.value) || 0)}
                    className="bg-zinc-950/70 border-white/10 text-white font-medium h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-300">
                    Days/Week Office
                  </Label>
                  <Select value={daysPerWeek.toString()} onValueChange={(v) => setDaysPerWeek(Number(v))}>
                    <SelectTrigger className="bg-zinc-950/70 border-white/10 text-white font-medium h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Days (Hybrid)</SelectItem>
                      <SelectItem value="4">4 Days</SelectItem>
                      <SelectItem value="5">5 Days (Full-time)</SelectItem>
                      <SelectItem value="6">6 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-300">
                  Transport Mode
                </Label>
                <Select value={transportMode} onValueChange={(v: any) => setTransportMode(v)}>
                  <SelectTrigger className="bg-zinc-950/70 border-white/10 text-white font-medium h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drive">🚗 Personal Car / Bike</SelectItem>
                    <SelectItem value="transit">🚌 Metro / Bus / Local Train</SelectItem>
                    <SelectItem value="cycle">🚲 Bicycle</SelectItem>
                    <SelectItem value="walk">🚶 Walking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {transportMode === "drive" && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-400">Fuel Price (₹/L)</Label>
                    <Input
                      type="number"
                      value={fuelCostPerLitre}
                      onChange={(e) => setFuelCostPerLitre(Number(e.target.value) || 0)}
                      className="bg-zinc-950/70 border-white/10 text-white h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-400">Mileage (km/L)</Label>
                    <Input
                      type="number"
                      value={mileageKmPerLitre}
                      onChange={(e) => setMileageKmPerLitre(Number(e.target.value) || 1)}
                      className="bg-zinc-950/70 border-white/10 text-white h-10 text-xs"
                    />
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Results Analytics Dashboard (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <Card className="bg-gradient-to-br from-purple-900/30 to-zinc-900 border-purple-500/20">
                <CardContent className="p-5 space-y-2">
                  <div className="p-2 w-fit rounded-lg bg-purple-500/20 text-purple-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Monthly Outflow</p>
                  <p className="text-2xl font-black text-white">₹{totalMonthlyCost.toLocaleString("en-IN")}</p>
                  <p className="text-[11px] text-purple-300 font-medium">Rent ₹{rent.toLocaleString()} + Commute ₹{monthlyCommuteCost.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-900/30 to-zinc-900 border-blue-500/20">
                <CardContent className="p-5 space-y-2">
                  <div className="p-2 w-fit rounded-lg bg-blue-500/20 text-blue-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Yearly Commute Time</p>
                  <p className="text-2xl font-black text-white">{yearlyHoursSpent} hrs</p>
                  <p className="text-[11px] text-blue-300 font-medium">~{Math.round(yearlyHoursSpent / 24)} full days lost in travel</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-900/30 to-zinc-900 border-emerald-500/20">
                <CardContent className="p-5 space-y-2">
                  <div className="p-2 w-fit rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Carbon Footprint</p>
                  <p className="text-2xl font-black text-white">{yearlyCo2Kg} kg</p>
                  <p className="text-[11px] text-emerald-300 font-medium">Annual CO2 generated</p>
                </CardContent>
              </Card>

            </div>

            {/* Breakdown Visualizer */}
            <Card className="bg-zinc-900/60 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">Monthly Expense Distribution</CardTitle>
                <CardDescription className="text-zinc-400">Comparison of base property rent vs commute travel costs.</CardDescription>
              </CardHeader>
              <CardContent className="h-64 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      contentStyle={{ background: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#fff" }}
                      formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, "Amount"]}
                    />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                      {comparisonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Smart Insight Recommendation */}
            <Card className="bg-purple-950/30 border-purple-500/30">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-base">Commute Buddy Trade-Off Insight</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Moving closer to your workplace (saving 8 km one-way) can save you approximately{" "}
                    <span className="font-bold text-purple-300">₹{Math.round(monthlyCommuteCost * 0.6).toLocaleString("en-IN")}/month</span> in travel costs and gain back{" "}
                    <span className="font-bold text-purple-300">{Math.round(yearlyHoursSpent * 0.6)} hours</span> of free personal time per year!
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

      </main>
    </div>
  );
}
