import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageContainer from "../components/shared/PageContainer";
import { Search, X, Dog, Cat, Bird, Stethoscope } from "lucide-react";
import PatientProfileModal from "../components/patients/PatientProfileModal";

const SPECIES_ICON = {
  Canine: Dog,
  Feline: Cat,
  Avian: Bird,
};

const VISIT_TYPE_COLORS = {
  Inpatient: "bg-orange-500/20 text-orange-300 border-orange-400/25",
  "Day Patient": "bg-sky-500/20 text-sky-300 border-sky-400/25",
  Appointment: "bg-violet-500/20 text-violet-300 border-violet-400/25",
  Discharged: "bg-white/10 text-white/40 border-white/15",
};

const ALERT_COLORS = {
  "Aggression Alert": "bg-red-500/20 text-red-300 border-red-400/25",
  "Escape Risk": "bg-amber-500/20 text-amber-300 border-amber-400/25",
  "Handler Risk": "bg-orange-500/20 text-orange-300 border-orange-400/25",
  Other: "bg-white/10 text-white/40 border-white/15",
};

function SpeciesIcon({ species }) {
  const Icon = SPECIES_ICON[species];
  if (!Icon) return <Stethoscope className="w-4 h-4 text-white/40" />;
  return <Icon className="w-4 h-4 text-white/50" />;
}

export default function Patients() {
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const { data: globalPatients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ["globalPatients"],
    queryFn: () => base44.entities.GlobalPatient.list(),
  });

  const { data: patientVisits = [] } = useQuery({
    queryKey: ["patientVisits"],
    queryFn: () => base44.entities.PatientVisit.list(),
  });

  // Map global_patient_id -> visits (sorted newest first)
  const visitsByPatient = useMemo(() => {
    const map = {};
    for (const v of patientVisits) {
      if (!v.global_patient_id) continue;
      if (!map[v.global_patient_id]) map[v.global_patient_id] = [];
      map[v.global_patient_id].push(v);
    }
    return map;
  }, [patientVisits]);

  const getLatestVisit = (gp) => {
    const visits = visitsByPatient[gp.id] || [];
    return [...visits].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0] || null;
  };

  const getPatientStatus = (gp) => {
    const v = getLatestVisit(gp);
    return v?.patient_type || null;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return globalPatients.filter((gp) => {
      const matchSearch =
        !q ||
        (gp.name || "").toLowerCase().includes(q) ||
        (gp.patient_id || "").toLowerCase().includes(q) ||
        (gp.breed || "").toLowerCase().includes(q);
      const matchSpecies = speciesFilter === "All" || gp.species === speciesFilter;
      const status = getPatientStatus(gp);
      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && status && status !== "Discharged") ||
        (statusFilter === "Discharged" && status === "Discharged") ||
        (statusFilter === "No Visits" && !status);
      return matchSearch && matchSpecies && matchStatus;
    });
  }, [globalPatients, search, speciesFilter, statusFilter, visitsByPatient]);

  const speciesOptions = ["All", "Canine", "Feline", "Equine", "Bovine", "Avian", "Exotic", "Other"];
  const statusOptions = ["All", "Active", "Discharged", "No Visits"];

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-white">Patients</h1>
          <p className="text-xs text-white/40 mt-0.5">{globalPatients.length} total patients</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, ID, or breed…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/10 text-white placeholder:text-white/35 border border-white/20 text-sm focus:outline-none focus:border-white/40"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={speciesFilter}
          onChange={(e) => setSpeciesFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-white focus:outline-none"
        >
          {speciesOptions.map((s) => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-white focus:outline-none"
        >
          {statusOptions.map((s) => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
        </select>
      </div>

      {/* Patient Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-[11px] uppercase tracking-wider text-white/30">
                <th className="text-left px-4 py-3 font-medium">Patient</th>
                <th className="text-left px-4 py-3 font-medium">ID</th>
                <th className="text-left px-4 py-3 font-medium">Species / Breed</th>
                <th className="text-left px-4 py-3 font-medium">Sex</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Service</th>
                <th className="text-left px-4 py-3 font-medium">Alerts</th>
              </tr>
            </thead>
            <tbody>
              {loadingPatients && (
                <tr><td colSpan={7} className="text-center py-10 text-white/30 text-sm">Loading…</td></tr>
              )}
              {!loadingPatients && filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-white/30 text-sm">No patients found</td></tr>
              )}
              {filtered.map((gp, i) => {
                const status = getPatientStatus(gp);
                const latestVisit = getLatestVisit(gp);
                const statusColor = VISIT_TYPE_COLORS[status] || "bg-white/10 text-white/40 border-white/15";
                return (
                  <tr
                    key={gp.id}
                    onClick={() => setSelectedPatient(gp)}
                    className={`transition-colors cursor-pointer hover:bg-white/5 border-b border-white/5 last:border-0 ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                          <SpeciesIcon species={gp.species} />
                        </div>
                        <span className="font-medium text-white text-sm">{gp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/50 font-mono text-xs">{gp.patient_id || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-white/80 text-xs">{gp.species}</span>
                      {gp.breed && <span className="text-white/40 text-xs"> · {gp.breed}</span>}
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">{gp.sex || "—"}</td>
                    <td className="px-4 py-3">
                      {status ? (
                        <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${statusColor}`}>
                          {status}
                        </span>
                      ) : (
                        <span className="text-white/25 text-xs">No visits</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">
                      {latestVisit?.involved_services?.join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(gp.alerts || []).map((a) => (
                          <span key={a} className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${ALERT_COLORS[a] || ALERT_COLORS.Other}`}>
                            {a}
                          </span>
                        ))}
                        {gp.infectious_status && gp.infectious_status !== "Negative" && (
                          <span className="px-1.5 py-0.5 rounded border text-[10px] font-medium bg-red-500/20 text-red-300 border-red-400/25">
                            {gp.infectious_status}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-white/8 text-[11px] text-white/25">
          {filtered.length} patient{filtered.length !== 1 ? "s" : ""} shown
        </div>
      </div>

      {selectedPatient && (
        <PatientProfileModal
          patient={selectedPatient}
          visits={visitsByPatient[selectedPatient.id] || []}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </PageContainer>
  );
}