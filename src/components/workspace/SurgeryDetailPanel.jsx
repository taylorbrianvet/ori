import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Copy, Check, CheckCircle2, AlertTriangle, Users, X } from "lucide-react";
import { toast } from "sonner";

function formatLongDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    return format(new Date(y, m - 1, d), "MMMM d, yyyy");
  } catch {
    return dateStr;
  }
}

function CopyButton({ label, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      disabled={!value}
      className={`flex items-center justify-between gap-2 w-full px-3 py-2.5 rounded-xl border transition-colors text-left ${
        copied
          ? "border-green-500/40 bg-green-500/10 text-green-400"
          : "border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
      }`}
    >
      <div className="min-w-0">
        <p className="text-[10px] text-white/35 font-medium uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xs text-white/80 truncate">{value || "—"}</p>
      </div>
      <div className="flex-shrink-0">
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 opacity-50" />}
      </div>
    </button>
  );
}

export default function SurgeryDetailPanel({ entry, userEmail, onClose }) {
  const queryClient = useQueryClient();
  const hasLogged = (entry.logged_by || []).includes(userEmail);
  const [marking, setMarking] = useState(false);

  // Fetch procedure details for full copy string
  const { data: procedures = [] } = useQuery({
    queryKey: ["surgical-procedures"],
    queryFn: () => base44.entities.SurgicalProcedure.filter({ active: true }, "category", 500),
    staleTime: 60000,
  });

  const procedureRecord = procedures.find(
    (p) => p.procedure_name === entry.procedure
  );

  // Format: Procedure Name | Subcategory | Category
  const procedureCopyText = procedureRecord
    ? [procedureRecord.procedure_name, procedureRecord.subcategory, procedureRecord.category]
        .filter(Boolean)
        .join("  |  ")
    : entry.procedure || "";

  const toggleLogged = async () => {
    setMarking(true);
    try {
      const current = entry.logged_by || [];
      const next = hasLogged
        ? current.filter((x) => x !== userEmail)
        : [...current, userEmail];
      await base44.entities.SurgicalLogEntry.update(entry.id, { logged_by: next });
      queryClient.invalidateQueries({ queryKey: ["surgical-logs-mine"] });
      queryClient.invalidateQueries({ queryKey: ["surgical-logs"] });
      toast.success(hasLogged ? "Removed from logged" : "Marked as logged");
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] text-white/35 uppercase tracking-wider font-medium mb-1">Surgery Detail</p>
          <h2 className="text-base font-semibold text-white leading-snug">{entry.procedure}</h2>
          <p className="text-xs text-white/45 mt-0.5">{formatLongDate(entry.surgery_date)}</p>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {entry.emergency && (
          <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/12 px-2.5 py-1 rounded-full font-medium">
            <AlertTriangle className="w-3 h-3" /> Emergency
          </span>
        )}
        {entry.service && (
          <span className="text-[10px] text-white/50 bg-white/8 px-2.5 py-1 rounded-full">{entry.service}</span>
        )}
        {entry.species && (
          <span className="text-[10px] text-white/50 bg-white/8 px-2.5 py-1 rounded-full">{entry.species}</span>
        )}
      </div>

      {/* Details */}
      <div className="glass-card p-3 mb-4 space-y-2 text-xs">
        {[
          ["Case #", entry.case_number],
          ["Laterality", entry.laterality],
          ["Diagnosis", entry.diagnosis],
          ["Primary Surgeon", entry.primary_surgeon],
          ["Faculty Present", entry.faculty_present],
          ["Residents", (entry.residents_scrubbed_in || []).length > 0 ? `${entry.residents_scrubbed_in.length} scrubbed in` : null],
        ].map(([label, val]) =>
          val ? (
            <div key={label} className="flex gap-2">
              <span className="text-white/35 w-24 flex-shrink-0">{label}</span>
              <span className="text-white/75">{val}</span>
            </div>
          ) : null
        )}
      </div>

      {/* Copy buttons */}
      <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-2">Copy to Clipboard</p>
      <div className="space-y-2 flex-1">
        <CopyButton label="Copy Date" value={formatLongDate(entry.surgery_date)} />
        <CopyButton label="Copy Patient ID" value={entry.case_number} />
        <CopyButton label="Copy Procedure" value={procedureCopyText} />
        <CopyButton label="Copy Diagnosis" value={entry.diagnosis} />
      </div>

      {/* Log toggle button */}
      <button
        onClick={toggleLogged}
        disabled={marking}
        className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          hasLogged
            ? "bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-400"
            : "bg-white/10 border border-white/15 text-white/70 hover:bg-green-500/15 hover:border-green-500/30 hover:text-green-400"
        }`}
      >
        <CheckCircle2 className="w-4 h-4" />
        {hasLogged ? "Remove from Logged" : "Mark as Logged"}
      </button>
    </div>
  );
}