import React, { useState, useMemo, useEffect } from "react";
import { Search, Check, Minus, Plus, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageContainer from "../components/shared/PageContainer";
import EstimateDetailModal from "../components/estimates/EstimateDetailModal";
import EstimateForm from "../components/estimates/EstimateForm";
import { AnimatePresence } from "framer-motion";

const SERVICES = [
  "All Services",
  "Soft Tissue Surgery",
  "Orthopedic Surgery",
  "Cardiology",
  "Internal Medicine",
  "Neurology",
  "Oncology",
  "Dermatology",
  "Emergency",
  "Critical Care",
  "Ophthalmology",
  "Anesthesia",
];

const fmt = (n) => (n !== undefined && n !== null ? `$${n.toLocaleString()}` : "—");

// Service color palette — pulls from the app's blue/orange/eggplant background tones
const SERVICE_COLORS = {
  "Soft Tissue Surgery":   { text: "text-orange-300",    badge: "bg-orange-500/15 border-orange-400/25 text-orange-300" },
  "Orthopedic Surgery":    { text: "text-amber-300",      badge: "bg-amber-500/15 border-amber-400/25 text-amber-300" },
  "Cardiology":            { text: "text-rose-300",       badge: "bg-rose-500/15 border-rose-400/25 text-rose-300" },
  "Internal Medicine":     { text: "text-sky-300",        badge: "bg-sky-500/15 border-sky-400/25 text-sky-300" },
  "Neurology":             { text: "text-violet-300",     badge: "bg-violet-500/15 border-violet-400/25 text-violet-300" },
  "Oncology":              { text: "text-teal-300",       badge: "bg-teal-500/15 border-teal-400/25 text-teal-300" },
  "Dermatology":           { text: "text-lime-300",       badge: "bg-lime-500/15 border-lime-400/25 text-lime-300" },
  "Emergency":             { text: "text-red-300",        badge: "bg-red-500/15 border-red-400/25 text-red-300" },
  "Critical Care":         { text: "text-pink-300",       badge: "bg-pink-500/15 border-pink-400/25 text-pink-300" },
  "Ophthalmology":         { text: "text-cyan-300",       badge: "bg-cyan-500/15 border-cyan-400/25 text-cyan-300" },
  "Anesthesia":            { text: "text-indigo-300",     badge: "bg-indigo-500/15 border-indigo-400/25 text-indigo-300" },
};

const serviceColor = (name) => SERVICE_COLORS[name] || { text: "text-white/80", badge: "bg-white/8 border-white/15 text-white/55" };

export default function Estimates() {
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("All Services");
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: estimates = [] } = useQuery({
    queryKey: ["estimates"],
    queryFn: () => base44.entities.Estimate.list(),
  });

  // Load current user + their staff profile to check can_edit_estimates
  const [staffProfile, setStaffProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setCurrentUser(u);
      if (u?.email) {
        base44.entities.Staff.filter({ email: u.email }).then((results) => {
          if (results?.length > 0) setStaffProfile(results[0]);
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const canEditEstimates = staffProfile?.can_edit_estimates === true || currentUser?.role === "admin";
  const userService = staffProfile?.service || "";

  const canEditThisEstimate = (estimate) => {
    if (!canEditEstimates) return false;
    if (currentUser?.role === "admin") return true;
    return estimate.service_name === userService;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return estimates.filter((e) => {
      const matchService =
        serviceFilter === "All Services" || e.service_name === serviceFilter;
      const matchSearch =
        !q ||
        (e.procedure_name || "").toLowerCase().includes(q) ||
        (e.service_name || "").toLowerCase().includes(q) ||
        (e.notes || "").toLowerCase().includes(q);
      return matchService && matchSearch;
    });
  }, [search, serviceFilter, estimates]);

  const canAddNew = canEditEstimates;

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-white">Procedure Estimates</h1>
        {canAddNew && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/80 hover:bg-orange-500 border border-orange-400/30 text-sm text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Estimate
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search procedures…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/10 text-white placeholder:text-white/35 border border-white/20 text-sm focus:outline-none focus:border-white/40 backdrop-blur"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-white focus:outline-none focus:border-white/40 backdrop-blur"
        >
          {SERVICES.map((s) => (
            <option key={s} value={s} className="bg-slate-800 text-white">
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-white/40">
                <th className="text-left px-4 py-3 font-medium">Procedure</th>
                <th className="text-left px-4 py-3 font-medium">Service</th>
                <th className="text-right px-4 py-3 font-medium">Low Est.</th>
                <th className="text-right px-4 py-3 font-medium">High Est.</th>
                <th className="text-center px-4 py-3 font-medium">Anesthesia</th>
                <th className="text-left px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-white/30 text-sm">
                    No procedures found
                  </td>
                </tr>
              )}
              {filtered.map((e, i) => {
                const svc = serviceColor(e.service_name);
                return (
                <tr
                  key={e.id}
                  onClick={() => setSelectedEstimate(e)}
                  className={`transition-colors cursor-pointer hover:bg-white/5 ${i % 2 === 0 ? "bg-white/[0.02]" : "bg-purple-900/[0.06]"}`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`font-medium text-xs ${svc.text}`}>{e.procedure_name}</span>
                    {e.species && (
                      <span className="ml-2 text-[10px] text-white/40 font-normal">{e.species}</span>
                    )}
                    {e.linked_estimate_ids?.length > 0 && (
                      <span className="ml-2 text-[10px] text-white/30">
                        +{e.linked_estimate_ids.length} linked
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full border text-[11px] ${svc.badge}`}>
                      {e.service_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-green-300 font-mono text-xs whitespace-nowrap">
                    {fmt(e.estimate_low)}
                  </td>
                  <td className="px-4 py-3 text-right text-orange-300 font-mono text-xs whitespace-nowrap">
                    {fmt(e.estimate_high)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {e.includes_anesthesia ? (
                      <Check className="w-4 h-4 text-green-400 mx-auto" />
                    ) : (
                      <Minus className="w-4 h-4 text-white/20 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/45 text-xs whitespace-nowrap max-w-xs overflow-hidden text-ellipsis">
                    {e.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-white/8 text-[11px] text-white/25">
          {filtered.length} procedure{filtered.length !== 1 ? "s" : ""} shown · Estimates are approximate and subject to change
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedEstimate && (
          <EstimateDetailModal
            estimate={selectedEstimate}
            allEstimates={estimates}
            canEdit={canEditThisEstimate(selectedEstimate)}
            isAdmin={currentUser?.role === "admin"}
            onClose={() => setSelectedEstimate(null)}
          />
        )}
      </AnimatePresence>

      {/* Add New Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowAddForm(false)}
            />
            <div className="relative glass-card w-full max-w-lg z-10 overflow-y-auto max-h-[90vh]">
              <EstimateForm
                allEstimates={estimates}
                serviceName={userService}
                onSaved={() => setShowAddForm(false)}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}