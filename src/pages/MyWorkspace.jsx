import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import PageContainer from "../components/shared/PageContainer";
import SurgicalLogForm from "../components/surgical/SurgicalLogForm";
import {
  Scissors,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  Search,
  Users,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function formatSurgeryDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy");
  } catch {
    return dateStr;
  }
}

function LoggedBadge({ entry, userEmail }) {
  const queryClient = useQueryClient();
  const hasLogged = (entry.logged_by || []).includes(userEmail);
  const [loading, setLoading] = useState(false);

  const toggle = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const current = entry.logged_by || [];
      const next = hasLogged
        ? current.filter((x) => x !== userEmail)
        : [...current, userEmail];
      await base44.entities.SurgicalLogEntry.update(entry.id, { logged_by: next });
      queryClient.invalidateQueries({ queryKey: ["surgical-logs-mine"] });
      queryClient.invalidateQueries({ queryKey: ["surgical-logs"] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
        hasLogged
          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
          : "bg-white/8 text-white/45 hover:bg-white/15 hover:text-white/80"
      }`}
    >
      {hasLogged ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {hasLogged ? "Logged" : "Mark Logged"}
    </button>
  );
}

export default function MyWorkspace() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: allEntries = [], isLoading } = useQuery({
    queryKey: ["surgical-logs-mine"],
    queryFn: () => base44.entities.SurgicalLogEntry.list("-surgery_date"),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-all"],
    queryFn: () => base44.entities.Staff.list(),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const userEmail = currentUser?.email || "";
  const userFullName = currentUser?.full_name || "";
  const firstName = userFullName.split(" ")[0]?.toLowerCase() || "";

  // Show entries where this user is scrubbed in OR has manually marked as logged
  const myEntries = allEntries.filter((e) => {
    const scrubbed = (e.residents_scrubbed_in || []).some((r) =>
      r.toLowerCase().includes(firstName)
    );
    const markedLogged = (e.logged_by || []).includes(userEmail);
    return scrubbed || markedLogged;
  });

  const filtered = myEntries.filter((e) => {
    return (
      !search ||
      (e.case_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.procedure || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.primary_surgeon || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.species || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <PageContainer>
      <div className="mb-5">
        <Link
          to={createPageUrl("Home")}
          className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Home
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Scissors className="w-5 h-5 text-white/80" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">My Procedure Log</h1>
            <p className="text-xs text-white/45 mt-0.5">
              {firstName ? `Showing procedures for ${userFullName}` : "Your personal surgical case log"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log Surgery
        </button>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 border border-white/10 mb-5">
        <Search className="w-3.5 h-3.5 text-white/40 shrink-0" />
        <input
          className="bg-transparent text-xs text-white placeholder:text-white/35 outline-none flex-1"
          placeholder="Search case number, procedure, surgeon…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-white/40 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/8 flex items-center justify-center mx-auto mb-3">
            <Scissors className="w-6 h-6 text-white/30" />
          </div>
          <p className="text-sm text-white/40">No procedures in your log yet.</p>
          <p className="text-xs text-white/30 mt-1">Cases where you are scrubbed in or have marked as logged will appear here.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  {["Case #", "Date", "Service", "Species", "Laterality", "Procedure", "Primary Surgeon", "Residents", "Emergency"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-white/45 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, i) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-white font-medium">{entry.case_number}</td>
                    <td className="px-4 py-3 text-white/70 whitespace-nowrap">{formatSurgeryDate(entry.surgery_date)}</td>
                    <td className="px-4 py-3 text-white/70 whitespace-nowrap">{entry.service || "—"}</td>
                    <td className="px-4 py-3 text-white/70">{entry.species}</td>
                    <td className="px-4 py-3 text-white/70">{entry.laterality}</td>
                    <td className="px-4 py-3 text-white/80 max-w-[180px] truncate" title={entry.procedure}>{entry.procedure}</td>
                    <td className="px-4 py-3 text-white/70 whitespace-nowrap">{entry.primary_surgeon || "—"}</td>
                    <td className="px-4 py-3">
                      {(entry.residents_scrubbed_in || []).length > 0 ? (
                        <span className="flex items-center gap-1 text-white/60">
                          <Users className="w-3 h-3" />
                          {entry.residents_scrubbed_in.length}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {entry.emergency ? (
                        <span className="flex items-center gap-1 text-red-400 text-[11px]">
                          <AlertTriangle className="w-3 h-3" /> Yes
                        </span>
                      ) : (
                        <span className="text-white/35">No</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-white/5">
            {filtered.map((entry) => (
              <div key={entry.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm font-semibold text-white">{entry.case_number}</span>
                    <span className="ml-2 text-xs text-white/45">{formatSurgeryDate(entry.surgery_date)}</span>
                    {entry.emergency && (
                      <span className="ml-2 text-[10px] text-red-400 font-medium">EMERGENCY</span>
                    )}
                  </div>
                  <LoggedBadge entry={entry} userEmail={userEmail} />
                </div>
                <p className="text-xs text-white/80 font-medium">{entry.procedure}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/50">
                  <span>{entry.species}</span>
                  <span>{entry.laterality}</span>
                  {entry.service && <span>{entry.service}</span>}
                  {entry.primary_surgeon && <span>Surgeon: {entry.primary_surgeon}</span>}
                  {(entry.residents_scrubbed_in || []).length > 0 && (
                    <span>{entry.residents_scrubbed_in.length} resident(s)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <SurgicalLogForm
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ["surgical-logs-mine"] });
              queryClient.invalidateQueries({ queryKey: ["surgical-logs"] });
            }}
            staffList={staffList}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  );
}