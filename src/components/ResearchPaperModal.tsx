import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, MapPin, CheckCircle, ExternalLink, Cpu, Database, Network } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ResearchPaperModal({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto bg-zinc-950/95 border-purple-500/30 text-white backdrop-blur-2xl rounded-3xl p-6 scrollbar-hide">
        <DialogHeader className="space-y-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-600/30 text-purple-300 border-purple-500/40 text-xs px-2.5 py-0.5">
              IEEE CSE Research Publication
            </Badge>
            <Badge variant="outline" className="text-zinc-400 text-xs border-white/10">
              Open Geospatial Stack
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight text-white leading-snug">
            Commute Buddy: A Smart Commute-Aware Real-Estate and Housing Discovery Platform
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-purple-300 font-medium">
              Vallabh Shingroop, Rasika Khure, Purva Mahale, Yash Kolhe, Vedant Kharabe
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              Dept. of Computer Science and Engineering, TGPCET, Nagpur, India
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4 text-xs text-zinc-300 leading-relaxed font-sans">
          
          {/* Abstract */}
          <div className="bg-purple-950/20 border border-purple-500/20 rounded-2xl p-4 space-y-1.5">
            <h4 className="font-bold text-sm text-purple-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" /> Research Abstract
            </h4>
            <p className="text-zinc-300">
              Conventional real-estate platforms rank and filter properties primarily by geographic location, price, and area using straight-line distance as a proxy. This proxy is systematically inaccurate: road connectivity, transit availability, and congestion mean two properties equidistant from a workplace can differ by tens of minutes in actual travel time. <strong>Commute Buddy</strong> inverts the search paradigm by treating the user’s workplace as the primary anchor, returning the full feasible set of properties satisfying the commute time budget through a mathematically safe two-stage pruning pipeline.
            </p>
          </div>

          {/* Core Algorithms & Equations */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 space-y-2">
              <h5 className="font-bold text-sm text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" /> Algorithm 1: Two-Stage Filtering
              </h5>
              <p className="text-zinc-400">
                1. <strong>Coarse Spatial Prefilter:</strong> Bounding-box search query on spatial index <br/>
                2. <strong>Haversine Lower-Bound Pruning:</strong> If <code className="text-purple-300">d_h / v_max(m) &gt; T_max</code>, prune immediately in O(1) <br/>
                3. <strong>Authoritative OSRM Query:</strong> Evaluates exact road network shortest-path <code className="text-purple-300">T(W, p, m) &le; T_max</code>
              </p>
            </div>

            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 space-y-2">
              <h5 className="font-bold text-sm text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-indigo-400" /> Equation (6): Transparent Ranking
              </h5>
              <div className="bg-black/40 p-2.5 rounded-xl font-mono text-[11px] text-purple-300 border border-white/5">
                S(p) = w₁·(1 - T/T_max) + w₂·B̂(p) + w₃·Â(p)
              </div>
              <p className="text-zinc-400 text-[11px]">
                Transparent, explainable multi-factor scoring combining normalized commute fit, price fit, and area fit with user-adjustable weights (default equal thirds).
              </p>
            </div>
          </div>

          {/* Database & Architecture */}
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 space-y-3">
            <h5 className="font-bold text-sm text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" /> Relational 3NF Architecture (Figure 2)
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <strong className="text-purple-300 block">USERS</strong>
                <span>Seeker & Owner roles via OAuth 2.0</span>
              </div>
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <strong className="text-purple-300 block">PROPERTIES</strong>
                <span>Spatial composite index on (lat, lng)</span>
              </div>
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <strong className="text-purple-300 block">INQUIRIES</strong>
                <span>Direct seeker-to-owner messaging</span>
              </div>
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <strong className="text-purple-300 block">BOOKINGS</strong>
                <span>Scheduled property site viewings</span>
              </div>
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <strong className="text-purple-300 block">PAYMENTS</strong>
                <span>Token booking & deposit transactions</span>
              </div>
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <strong className="text-purple-300 block">ANALYTICS</strong>
                <span>Commute discovery distribution tracking</span>
              </div>
            </div>
          </div>

          {/* Qualitative Comparison Table */}
          <div className="space-y-2">
            <h5 className="font-bold text-sm text-white">Qualitative Feature Comparison (Table 4)</h5>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-white/5 text-zinc-300 font-semibold border-b border-white/10">
                  <tr>
                    <th className="p-2.5">Feature</th>
                    <th className="p-2.5 text-purple-300">Commute Buddy</th>
                    <th className="p-2.5 text-zinc-400">Mainstream Portals</th>
                    <th className="p-2.5 text-zinc-400">Radial Search</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="p-2.5 font-medium">Workplace as primary search anchor</td>
                    <td className="p-2.5 text-emerald-400 font-bold">Yes</td>
                    <td className="p-2.5 text-yellow-500">Partial</td>
                    <td className="p-2.5 text-rose-400">No</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Map-click workplace selection</td>
                    <td className="p-2.5 text-emerald-400 font-bold">Yes</td>
                    <td className="p-2.5 text-yellow-500">Partial</td>
                    <td className="p-2.5 text-rose-400">No</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Route visualization to each result</td>
                    <td className="p-2.5 text-emerald-400 font-bold">Yes</td>
                    <td className="p-2.5 text-yellow-500">Partial</td>
                    <td className="p-2.5 text-rose-400">No</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Owner commute-accessibility analytics</td>
                    <td className="p-2.5 text-emerald-400 font-bold">Yes</td>
                    <td className="p-2.5 text-rose-400">No</td>
                    <td className="p-2.5 text-rose-400">No</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Open, self-hostable GIS stack</td>
                    <td className="p-2.5 text-emerald-400 font-bold">Yes (OSM, OSRM)</td>
                    <td className="p-2.5 text-rose-400">No (Proprietary)</td>
                    <td className="p-2.5 text-rose-400">No</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs">
            Close & Return to Platform
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
