import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft, Plus, CheckCircle2, AlertCircle, ChevronRight, Search } from "lucide-react";
import { format } from "date-fns";
import PageContainer from "../components/shared/PageContainer";
import NewWoundCaseForm from "../components/wound/NewWoundCaseForm";

function formatDate(d) {
  if (!d) return null;
  try { const [y,m,day] = d.split("-").map(Number); return format(new Date(y,m-1,day), "MMM d"); } catch { return d; }
}

function WoundCaseRow({ woundCase, onClick }) {
  const wounds = woundCase.wound_locations || [];
  const statuses = woundCase.wound_statuses || {};
  const healedCount = wounds.filter(w => statuses[w] === "healed").length;
  const isComplete = woundCase.status === "complete";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="glass-card p-4 cursor-pointer hover:bg-white/12 transition-all active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-white truncate">{woundCase.patient_name}</h3>
            {isComplete ? (
              <span className="flex-shrink-0 flex items-center gap-1 text-[10px] text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-2.5 h-2.5" /> Healed
              </span>
            ) : (
              <span className="flex-shrink-0 text-[10px] text-amber-400 bg-amber-500/12 px-2 py-0.5 rounded-full">Active</span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-white/40 mb-2">
            {woundCase.species && <span>{woundCase.species}</span>}
            {woundCase.breed && <span>{woundCase.breed}</span>}
            {woundCase.service && <span>{woundCase.service}</span>}
            {woundCase.patient_case_number && <span>ID: {woundCase.patient_case_number}</span>}
          </div>

          {/* Wound tags */}
          <div className="flex flex-wrap gap-1.5">
            {wounds.map(w => (
              <span key={w} className={`text-[10px] px-2 py-0.5 rounded-full border ${
                statuses[w] === "healed"
                  ? "bg-green-500/10 border-green-500/20 text-green-400/70"
                  : "bg-white/6 border-white/10 text-white/50"
              }`}>
                {w}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <ChevronRight className="w-4 h-4 text-white/20" />
          {!isComplete && (
            <div className="text-[10px] text-white/35">
              {healedCount}/{wounds.length} healed
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function WoundCare() {
  const [showForm, setShowForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [search, setSearch] = useState("");

  const { data: allCases = [], isLoading } = useQuery({
    queryKey: ["wound-cases"],
    queryFn: () => base44.entities.WoundCase.list("-created_date"),
  });

  const activeCases = allCases.filter(c => c.status !== "complete");
  const completedCases = allCases.filter(c => c.status === "complete");

  const filterCases = (cases) => {
    if (!search) return cases;
    const q = search.toLowerCase();
    return cases.filter(c =>
      (c.patient_name || "").toLowerCase().includes(q) ||
      (c.patient_case_number || "").toLowerCase().includes(q) ||
      (c.service || "").toLowerCase().includes(q) ||
      (c.species || "").toLowerCase().includes(q)
    );
  };

  const handleNewCase = (woundCase) => {
    setShowForm(false);
    window.location.href = createPageUrl(`WoundCaseDetail?id=${woundCase.id}`);
  };

  const goToCase = (woundCase) => {
    window.location.href = createPageUrl(`WoundCaseDetail?id=${woundCase.id}`);
  };

  return (
    <PageContainer>
      {/* Back nav */}
      <div className="mb-5">
        <Link to={createPageUrl("PatientCare")}
          className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
          Patient Care
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Wound Care</h1>
          <p className="text-xs text-white/45 mt-0.5">{activeCases.length} active case{activeCases.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          New Case
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/8 border border-white/10 mb-5">
        <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
        <input
          className="bg-transparent text-xs text-white placeholder:text-white/35 outline-none flex-1"
          placeholder="Search patient name, ID, service…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Active cases */}
      {isLoading ? (
        <div className="py-20 text-center text-white/40 text-sm">Loading…</div>
      ) : filterCases(activeCases).length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/8 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-white/25" />
          </div>
          <p className="text-sm text-white/40 mb-1">No active wound cases</p>
          <button onClick={() => setShowForm(true)}
            className="text-xs text-white/50 hover:text-white underline transition-colors">
            Create the first wound case
          </button>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {filterCases(activeCases).map(c => (
            <WoundCaseRow key={c.id} woundCase={c} onClick={() => goToCase(c)} />
          ))}
        </div>
      )}

      {/* Completed cases toggle */}
      {completedCases.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(v => !v)}
            className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors mb-3"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400/60" />
            {showCompleted ? "Hide" : "Show"} {completedCases.length} completed case{completedCases.length !== 1 ? "s" : ""}
          </button>
          <AnimatePresence>
            {showCompleted && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden">
                {filterCases(completedCases).map(c => (
                  <WoundCaseRow key={c.id} woundCase={c} onClick={() => goToCase(c)} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* New case form */}
      <AnimatePresence>
        {showForm && (
          <NewWoundCaseForm onClose={() => setShowForm(false)} onSuccess={handleNewCase} />
        )}
      </AnimatePresence>
    </PageContainer>
  );
}