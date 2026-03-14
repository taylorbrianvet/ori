import React, { useState, useMemo } from "react";
import { Search, Check, Minus, DollarSign } from "lucide-react";
import PageContainer from "../components/shared/PageContainer";

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

const MOCK_ESTIMATES = [
  { service: "Soft Tissue Surgery", procedure: "Splenectomy", low: 3200, high: 5500, includes_anesthesia: true, notes: "Includes pre-op bloodwork" },
  { service: "Soft Tissue Surgery", procedure: "Intestinal Resection & Anastomosis", low: 4000, high: 7000, includes_anesthesia: true, notes: "Foreign body obstruction cases" },
  { service: "Soft Tissue Surgery", procedure: "Cystotomy", low: 2500, high: 4200, includes_anesthesia: true, notes: "" },
  { service: "Soft Tissue Surgery", procedure: "Gastropexy (Prophylactic)", low: 1800, high: 3000, includes_anesthesia: true, notes: "Often combined with neuter" },
  { service: "Soft Tissue Surgery", procedure: "GDV Correction + Gastropexy", low: 5000, high: 9000, includes_anesthesia: true, notes: "Emergency pricing may vary" },
  { service: "Soft Tissue Surgery", procedure: "Perineal Urethrostomy", low: 2800, high: 4500, includes_anesthesia: true, notes: "" },
  { service: "Soft Tissue Surgery", procedure: "Wound Closure / Reconstruction", low: 1200, high: 4000, includes_anesthesia: false, notes: "Varies by wound size and complexity" },
  { service: "Orthopedic Surgery", procedure: "TPLO", low: 4500, high: 7000, includes_anesthesia: true, notes: "Includes post-op recheck at 2 weeks" },
  { service: "Orthopedic Surgery", procedure: "Fracture Repair (ORIF)", low: 3500, high: 8000, includes_anesthesia: true, notes: "Varies significantly by fracture type and implants" },
  { service: "Orthopedic Surgery", procedure: "Total Hip Replacement", low: 7000, high: 11000, includes_anesthesia: true, notes: "Unilateral; bilateral higher" },
  { service: "Orthopedic Surgery", procedure: "Femoral Head & Neck Ostectomy (FHO)", low: 2500, high: 4000, includes_anesthesia: true, notes: "" },
  { service: "Orthopedic Surgery", procedure: "Elbow Arthroscopy", low: 3000, high: 5500, includes_anesthesia: true, notes: "" },
  { service: "Cardiology", procedure: "Echocardiogram (Initial)", low: 600, high: 900, includes_anesthesia: false, notes: "Includes full Doppler assessment" },
  { service: "Cardiology", procedure: "Echocardiogram (Recheck)", low: 400, high: 650, includes_anesthesia: false, notes: "" },
  { service: "Cardiology", procedure: "Pacemaker Implantation", low: 8000, high: 14000, includes_anesthesia: true, notes: "Transvenous or epicardial" },
  { service: "Cardiology", procedure: "Pericardiocentesis", low: 1500, high: 3000, includes_anesthesia: false, notes: "May require sedation — anesthesia billed separately if needed" },
  { service: "Internal Medicine", procedure: "Endoscopy (Upper GI)", low: 1200, high: 2200, includes_anesthesia: true, notes: "" },
  { service: "Internal Medicine", procedure: "Colonoscopy", low: 1400, high: 2400, includes_anesthesia: true, notes: "" },
  { service: "Internal Medicine", procedure: "Rhinoscopy", low: 1100, high: 2000, includes_anesthesia: true, notes: "" },
  { service: "Internal Medicine", procedure: "Bone Marrow Aspirate", low: 800, high: 1500, includes_anesthesia: false, notes: "Sedation typically sufficient" },
  { service: "Internal Medicine", procedure: "Thoracocentesis", low: 500, high: 1000, includes_anesthesia: false, notes: "Per procedure" },
  { service: "Neurology", procedure: "MRI (Brain)", low: 2000, high: 3200, includes_anesthesia: true, notes: "Includes neurologist interpretation" },
  { service: "Neurology", procedure: "MRI (Spine)", low: 2200, high: 3600, includes_anesthesia: true, notes: "Includes neurologist interpretation" },
  { service: "Neurology", procedure: "CSF Tap", low: 800, high: 1400, includes_anesthesia: true, notes: "Often combined with MRI" },
  { service: "Neurology", procedure: "Hemilaminectomy", low: 5000, high: 9000, includes_anesthesia: true, notes: "IVDD cases" },
  { service: "Oncology", procedure: "Chemotherapy (per session)", low: 400, high: 1200, includes_anesthesia: false, notes: "Varies by protocol and drug" },
  { service: "Oncology", procedure: "Mass Removal (cutaneous)", low: 800, high: 2500, includes_anesthesia: true, notes: "Varies by size and location" },
  { service: "Oncology", procedure: "Radiation Therapy (full course)", low: 12000, high: 20000, includes_anesthesia: true, notes: "Stereotactic or fractionated" },
  { service: "Dermatology", procedure: "Intradermal Allergy Testing", low: 500, high: 900, includes_anesthesia: false, notes: "Sedation may be needed" },
  { service: "Dermatology", procedure: "Skin Biopsy (multiple sites)", low: 300, high: 600, includes_anesthesia: false, notes: "Histopath fees separate" },
  { service: "Emergency", procedure: "Emergency Exam + Stabilization", low: 500, high: 1500, includes_anesthesia: false, notes: "Highly variable based on case severity" },
  { service: "Critical Care", procedure: "ICU Hospitalization (per day)", low: 600, high: 1200, includes_anesthesia: false, notes: "Includes monitoring, basic supportive care" },
  { service: "Ophthalmology", procedure: "Phacoemulsification (Cataract Surgery)", low: 3500, high: 6000, includes_anesthesia: true, notes: "Per eye; bilateral higher" },
  { service: "Ophthalmology", procedure: "Enucleation", low: 1500, high: 2800, includes_anesthesia: true, notes: "" },
  { service: "Anesthesia", procedure: "Anesthesia Monitoring (per hour)", low: 200, high: 450, includes_anesthesia: true, notes: "CRI and additional drugs billed separately" },
];

const fmt = (n) => n !== undefined && n !== null ? `$${n.toLocaleString()}` : "—";

export default function Estimates() {
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("All Services");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_ESTIMATES.filter(e => {
      const matchService = serviceFilter === "All Services" || e.service === serviceFilter;
      const matchSearch = !q || e.procedure.toLowerCase().includes(q) || e.service.toLowerCase().includes(q) || (e.notes || "").toLowerCase().includes(q);
      return matchService && matchSearch;
    });
  }, [search, serviceFilter]);

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-white">Procedure Estimates</h1>
        <p className="text-sm text-white/45 mt-0.5">Approximate cost ranges for procedures across all services</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
          <input
            type="text"
            placeholder="Search procedures…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/8 border border-white/12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
          />
        </div>
        <select
          value={serviceFilter}
          onChange={e => setServiceFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/8 border border-white/12 text-sm text-white focus:outline-none focus:border-white/25"
        >
          {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
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
                  <td colSpan={6} className="text-center py-10 text-white/30 text-sm">No procedures found</td>
                </tr>
              )}
              {filtered.map((e, i) => (
                <tr
                  key={i}
                  className="border-b border-white/6 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-white">{e.procedure}</td>
                  <td className="px-4 py-3 text-white/55">
                    <span className="px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-[11px]">{e.service}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-green-300 font-mono text-xs">{fmt(e.low)}</td>
                  <td className="px-4 py-3 text-right text-orange-300 font-mono text-xs">{fmt(e.high)}</td>
                  <td className="px-4 py-3 text-center">
                    {e.includes_anesthesia
                      ? <Check className="w-4 h-4 text-green-400 mx-auto" />
                      : <Minus className="w-4 h-4 text-white/20 mx-auto" />
                    }
                  </td>
                  <td className="px-4 py-3 text-white/45 text-xs max-w-xs">{e.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-white/8 text-[11px] text-white/25">
          {filtered.length} procedure{filtered.length !== 1 ? "s" : ""} shown · Estimates are approximate and subject to change
        </div>
      </div>
    </PageContainer>
  );
}